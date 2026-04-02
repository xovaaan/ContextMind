import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, sessions, peers } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getWorkspaceByApiKey } from '@/lib/ai/memory'
import { v4 as uuidv4 } from 'uuid'

const CreateSessionSchema = z.object({
  peerId: z.string(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const peerId = searchParams.get('peerId')
    const isActive = searchParams.get('isActive')

    let query = db.select().from(sessions).where(eq(sessions.workspaceId, workspace.id))

    const conditions = [eq(sessions.workspaceId, workspace.id)]
    if (peerId) conditions.push(eq(sessions.peerId, peerId))
    if (isActive !== null) conditions.push(eq(sessions.isActive, isActive === 'true'))

    const result = await db.select().from(sessions).where(and(...conditions))
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateSessionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })

    // Verify peer belongs to workspace
    const peer = await db.select().from(peers)
      .where(and(eq(peers.id, parsed.data.peerId), eq(peers.workspaceId, workspace.id)))
      .limit(1)
    if (!peer[0]) return NextResponse.json({ error: 'Peer not found' }, { status: 404 })

    const session = {
      id: uuidv4(),
      workspaceId: workspace.id,
      peerId: parsed.data.peerId,
      name: parsed.data.name || null,
      metadata: parsed.data.metadata || {},
      isActive: true,
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(sessions).values(session)
    return NextResponse.json(session, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
