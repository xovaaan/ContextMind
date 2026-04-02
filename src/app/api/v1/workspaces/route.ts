import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, workspaces } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export const runtime = 'nodejs'

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userWorkspaces = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId))
    return NextResponse.json(userWorkspaces)
  } catch (err: any) {
    console.error("GET_WORKSPACES_ERROR:", err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    console.log("CREATING_WORKSPACE_FOR_USER:", userId)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateWorkspaceSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 })

    const apiKey = `ctxmind_${crypto.randomBytes(16).toString('hex')}`

    const workspace = {
      id: uuidv4(),
      name: parsed.data.name,
      ownerId: userId,
      apiKey,
      plan: 'free' as const,
      usageTokens: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log("INSERTING_WORKSPACE:", workspace.id)
    await db.insert(workspaces).values(workspace)
    console.log("WORKSPACE_INSERTED_SUCCESSFULLY")
    return NextResponse.json(workspace, { status: 201 })
  } catch (err: any) {
    console.error("WORKSPACE_CREATE_ERROR:", err.message)
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 })
  }
}
