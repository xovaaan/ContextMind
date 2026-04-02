import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceByApiKey, processIngest } from '@/lib/ai/memory'

const IngestSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
  })).min(1).max(100),
  reasoningLevel: z.enum(['minimal', 'low', 'medium', 'high', 'max']).optional().default('medium'),
})

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })

    const workspace = await getWorkspaceByApiKey(apiKey)
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })

    const body = await req.json()
    const parsed = IngestSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })

    const { sessionId, messages, reasoningLevel } = parsed.data
    const result = await processIngest(workspace.id, sessionId, messages, reasoningLevel)

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('not found') || message.includes('belong') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}