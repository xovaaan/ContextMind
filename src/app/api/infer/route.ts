import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceByApiKey } from '@/lib/ai/memory'
import { queryRepresentations } from '@/lib/ai/openrouter'
import { db, representations, peers } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

/**
 * POST /api/infer
 *
 * The Infer API lets you query the accumulated psychological profile of any peer
 * using plain natural language. ContextMind reasons over all stored representations
 * (communication style, expertise, preferences, values, decision patterns) and
 * synthesizes a direct answer.
 *
 * Use this to personalize LLM system prompts, route support tickets, adapt UI,
 * or answer any question about how to best interact with a specific peer.
 *
 * @header x-api-key  Your workspace API key (required)
 * @body peerId       UUID of the peer to query
 * @body question     Natural language question about the peer
 * @body keys         Optional: limit inference to specific representation keys
 *
 * @returns { answer: string, confidence: number, sourcedFrom: string[] }
 */

const InferSchema = z.object({
  peerId: z.string().uuid('peerId must be a valid UUID'),
  question: z.string().min(1, 'question is required').max(500, 'question must be under 500 characters'),
  keys: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing x-api-key header', hint: 'Include your workspace API key as x-api-key in the request headers' },
        { status: 401 }
      )
    }

    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Invalid API key', hint: 'Check your API key in the ContextMind dashboard' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const parsed = InferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { peerId, question, keys } = parsed.data

    // Verify peer belongs to this workspace
    const peer = await db.select().from(peers)
      .where(and(eq(peers.id, peerId), eq(peers.workspaceId, workspace.id)))
      .limit(1)

    if (!peer[0]) {
      return NextResponse.json(
        { error: 'Peer not found', hint: 'Ensure the peerId belongs to this workspace' },
        { status: 404 }
      )
    }

    // Fetch representations - optionally filtered by keys
    let repsQuery = db.select().from(representations).where(eq(representations.peerId, peerId))
    const allReps = await repsQuery

    const filteredReps = keys && keys.length > 0
      ? allReps.filter(r => keys.includes(r.key))
      : allReps

    if (filteredReps.length === 0) {
      return NextResponse.json({
        answer: 'No profile data available for this peer yet. Ingest at least a few messages with reasoningLevel set to "medium" or higher to build the profile.',
        confidence: 0,
        sourcedFrom: [],
        peerName: peer[0].name,
        totalRepresentations: 0,
      })
    }

    // Build representation map
    const repMap: Record<string, string> = {}
    for (const r of filteredReps) {
      repMap[r.key] = `${r.value} (confidence: ${r.confidence}%)`
    }

    const answer = await queryRepresentations(repMap, question)

    // Calculate average confidence of used representations
    const avgConfidence = Math.round(
      filteredReps.reduce((sum, r) => sum + r.confidence, 0) / filteredReps.length
    )

    return NextResponse.json({
      answer,
      confidence: avgConfidence,
      sourcedFrom: filteredReps.map(r => r.key),
      peerName: peer[0].name,
      totalRepresentations: allReps.length,
    })
  } catch (err) {
    console.error('[/api/infer]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
