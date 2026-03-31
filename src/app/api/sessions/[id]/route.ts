import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, sessions, messages, summaries } from '@/lib/db'
import { eq, and, asc } from 'drizzle-orm'
import { getWorkspaceByApiKey } from '@/lib/ai/memory'

const UpdateSessionSchema = z.object({
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const session = await db.select().from(sessions)
      .where(and(eq(sessions.id, params.id), eq(sessions.workspaceId, workspace.id)))
      .limit(1)
    if (!session[0]) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const sessionMessages = await db.select().from(messages)
      .where(eq(messages.sessionId, params.id))
      .orderBy(asc(messages.sequence))

    const sessionSummaries = await db.select().from(summaries)
      .where(eq(summaries.sessionId, params.id))

    return NextResponse.json({ ...session[0], messages: sessionMessages, summaries: sessionSummaries })
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
    const parsed = UpdateSessionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error' }, { status: 400 })

    const existing = await db.select().from(sessions)
      .where(and(eq(sessions.id, params.id), eq(sessions.workspaceId, workspace.id)))
      .limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const updated = await db.update(sessions)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(sessions.id, params.id))
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

    const existing = await db.select().from(sessions)
      .where(and(eq(sessions.id, params.id), eq(sessions.workspaceId, workspace.id)))
      .limit(1)
    if (!existing[0]) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    await db.delete(sessions).where(eq(sessions.id, params.id))
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
