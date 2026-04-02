import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, peers, representations, sessions } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getWorkspaceByApiKey } from '@/lib/ai/memory'

const UpdatePeerSchema = z.object({
  name: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const peer = await db.select().from(peers)
      .where(and(eq(peers.id, params.id), eq(peers.workspaceId, workspace.id)))
      .limit(1)
    if (!peer[0]) return NextResponse.json({ error: 'Peer not found' }, { status: 404 })

    const peerReps = await db.select().from(representations).where(eq(representations.peerId, params.id))
    const peerSessions = await db.select().from(sessions).where(eq(sessions.peerId, params.id))

    return NextResponse.json({ ...peer[0], representations: peerReps, sessions: peerSessions })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const parsed = UpdatePeerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error' }, { status: 400 })

    const existing = await db.select().from(peers)
      .where(and(eq(peers.id, params.id), eq(peers.workspaceId, workspace.id)))
      .limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Peer not found' }, { status: 404 })

    const updated = await db.update(peers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(peers.id, params.id))
      .returning()

    return NextResponse.json(updated[0])
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const existing = await db.select().from(peers)
      .where(and(eq(peers.id, params.id), eq(peers.workspaceId, workspace.id)))
      .limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Peer not found' }, { status: 404 })

    await db.delete(peers).where(eq(peers.id, params.id))
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
