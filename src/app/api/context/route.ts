import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getWorkspaceByApiKey, assembleContext } from '@/lib/ai/memory'

const ContextQuerySchema = z.object({
  sessionId: z.string().uuid('sessionId must be a valid UUID'),
  maxTokens: z.coerce.number().min(100).max(32000).optional().default(8000),
  includeRepresentations: z.coerce.boolean().optional().default(true),
  includeDocuments: z.coerce.boolean().optional().default(true),
  query: z.string().optional(),
})

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const parsed = ContextQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const context = await assembleContext(workspace.id, parsed.data.sessionId, parsed.data)
    return NextResponse.json(context)
  } catch (err) {
    console.error('[/api/context]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
