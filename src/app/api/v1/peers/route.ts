import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, peers } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getWorkspaceByApiKey } from '@/lib/ai/memory'
import { v4 as uuidv4 } from 'uuid'

const CreatePeerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['user', 'agent', 'object']),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    const conditions = [eq(peers.workspaceId, workspace.id)]
    if (type) conditions.push(eq(peers.type, type))

    const result = await db.select().from(peers).where(and(...conditions))
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
    const parsed = CreatePeerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })

    const peer = {
      id: uuidv4(),
      workspaceId: workspace.id,
      name: parsed.data.name,
      type: parsed.data.type,
      metadata: parsed.data.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(peers).values(peer)
    return NextResponse.json(peer, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
