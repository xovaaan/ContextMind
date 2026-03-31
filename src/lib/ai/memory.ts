import { db, sessions, messages, summaries, representations, workspaces } from '@/lib/db'
import { eq, desc, asc, sql, and } from 'drizzle-orm'
import { summarizeMessages, extractRepresentations, getEmbedding } from './openrouter'
import { countTokens, estimateCost } from './tokens'
import { v4 as uuidv4 } from 'uuid'
import type { ReasoningLevel, Message } from '@/types'
import { REASONING_CONFIDENCE } from '@/types'

export async function getWorkspaceByApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('ctxmind_') || apiKey.length !== 40) return null
  const result = await db.select().from(workspaces).where(eq(workspaces.apiKey, apiKey)).limit(1)
  return result[0] || null
}

export async function processIngest(
  workspaceId: string,
  sessionId: string,
  incomingMessages: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>,
  reasoningLevel: ReasoningLevel = 'medium'
) {
  const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
  if (!sessionResult[0]) throw new Error(`Session ${sessionId} not found`)
  const session = sessionResult[0]

  if (session.workspaceId !== workspaceId) throw new Error('Session does not belong to this workspace')

  const maxSeqResult = await db
    .select({ maxSeq: sql<number>`COALESCE(MAX(sequence), 0)` })
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
  const startSeq = (maxSeqResult[0]?.maxSeq || 0) + 1

  const messageIds: string[] = []
  let totalTokens = 0

  for (let i = 0; i < incomingMessages.length; i++) {
    const msg = incomingMessages[i]
    const id = uuidv4()
    const tokenCount = countTokens(msg.content)
    totalTokens += tokenCount

    await db.insert(messages).values({
      id,
      sessionId,
      peerId: session.peerId,
      content: msg.content,
      role: msg.role,
      metadata: msg.metadata || {},
      tokenCount,
      sequence: startSeq + i,
      createdAt: new Date(),
    })

    messageIds.push(id)
  }

  const newMessageCount = session.messageCount + incomingMessages.length
  await db.update(sessions)
    .set({ messageCount: newMessageCount, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId))

  await db.update(workspaces)
    .set({ usageTokens: sql`usage_tokens + ${totalTokens}`, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId))

  let summaryTriggered = false
  if (Math.floor(newMessageCount / 20) > Math.floor(session.messageCount / 20)) summaryTriggered = true
  if (Math.floor(newMessageCount / 60) > Math.floor(session.messageCount / 60)) summaryTriggered = true

  // LLM enrichment runs in background — response returns immediately
  Promise.resolve().then(async () => {
    try {
      if (Math.floor(newMessageCount / 20) > Math.floor(session.messageCount / 20)) {
        await generateSummary(sessionId, 'short', 1000)
      }
      if (Math.floor(newMessageCount / 60) > Math.floor(session.messageCount / 60)) {
        await generateSummary(sessionId, 'long', 4000)
      }

      if (reasoningLevel !== 'minimal') {
        const confidenceThreshold = REASONING_CONFIDENCE[reasoningLevel]
        const contextText = incomingMessages.map(m => `${m.role}: ${m.content}`).join('\n')

        const existingReps = await db.select({ key: representations.key })
          .from(representations)
          .where(eq(representations.peerId, session.peerId))
        const existingKeys = existingReps.map(r => r.key)

        const extracted = await extractRepresentations(contextText, existingKeys, reasoningLevel)
        const filtered = extracted.filter(r => r.confidence >= confidenceThreshold)

        for (const rep of filtered) {
          const existing = await db.select().from(representations)
            .where(and(
              eq(representations.peerId, session.peerId),
              eq(representations.key, rep.key)
            ))
            .limit(1)

          if (existing[0]) {
            if (rep.confidence > existing[0].confidence) {
              await db.update(representations)
                .set({ value: rep.value, confidence: rep.confidence, sourceMessageIds: messageIds, updatedAt: new Date() })
                .where(eq(representations.id, existing[0].id))
            }
          } else {
            await db.insert(representations).values({
              id: uuidv4(),
              peerId: session.peerId,
              key: rep.key,
              value: rep.value,
              confidence: rep.confidence,
              sourceMessageIds: messageIds,
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }
        }
      }
    } catch (err) {
      console.error('[background enrichment]', err)
    }
  })

  return {
    messageIds,
    tokensIngested: totalTokens,
    summaryGenerated: summaryTriggered,
    representationsExtracted: 0,
    cost: estimateCost(totalTokens),
  }
}

async function generateSummary(sessionId: string, type: 'short' | 'long', maxTokens: number) {
  const allMessages = await db.select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.sequence))

  if (allMessages.length === 0) return

  const messageTexts = allMessages.map(m => `${m.role}: ${m.content}`)

  if (type === 'long') {
    const prevSummaries = await db.select()
      .from(summaries)
      .where(eq(summaries.sessionId, sessionId))
      .orderBy(desc(summaries.createdAt))
      .limit(3)

    if (prevSummaries.length > 0) {
      const summaryTexts = prevSummaries.map(s => `[${s.type.toUpperCase()} SUMMARY]: ${s.content}`)
      messageTexts.unshift(...summaryTexts)
    }
  }

  const content = await summarizeMessages(messageTexts, maxTokens, type)
  const tokenCount = countTokens(content)
  const embedding = await getEmbedding(content)

  await db.insert(summaries).values({
    id: uuidv4(),
    sessionId,
    type,
    content,
    messageRangeStart: allMessages[0]?.sequence,
    messageRangeEnd: allMessages[allMessages.length - 1]?.sequence,
    tokenCount,
    embedding,
    createdAt: new Date(),
  })
}

export async function assembleContext(
  workspaceId: string,
  sessionId: string,
  options: {
    maxTokens?: number
    includeRepresentations?: boolean
    includeDocuments?: boolean
    query?: string
  }
) {
  const { maxTokens = 8000, includeRepresentations = true } = options
  const recentBudget = Math.floor(maxTokens * 0.6)
  const summaryBudget = Math.floor(maxTokens * 0.4)

  const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
  if (!sessionResult[0]) throw new Error('Session not found')
  const session = sessionResult[0]

  const allMessages = await db.select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.sequence))
    .limit(100)

  const recentMessages: Message[] = []
  let usedTokens = 0

  for (const msg of allMessages) {
    if (usedTokens + msg.tokenCount > recentBudget) break
    recentMessages.unshift(msg as Message)
    usedTokens += msg.tokenCount
  }

  let summaryContent: string | undefined
  const latestSummary = await db.select()
    .from(summaries)
    .where(eq(summaries.sessionId, sessionId))
    .orderBy(desc(summaries.createdAt))
    .limit(1)

  if (latestSummary[0]) {
    const summaryTokens = latestSummary[0].tokenCount || 0
    if (summaryTokens <= summaryBudget) {
      summaryContent = latestSummary[0].content
      usedTokens += summaryTokens
    }
  }

  let peerRepresentations: typeof representations.$inferSelect[] = []
  if (includeRepresentations) {
    peerRepresentations = await db.select()
      .from(representations)
      .where(eq(representations.peerId, session.peerId))
      .orderBy(desc(representations.confidence))
      .limit(10)
  }

  const totalHistoricalResult = await db
    .select({ total: sql<number>`COALESCE(SUM(token_count), 0)` })
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
  const totalHistoricalTokens = totalHistoricalResult[0]?.total || 1
  const compressionRatio = usedTokens / totalHistoricalTokens

  return {
    recentMessages,
    summary: summaryContent,
    representations: peerRepresentations,
    relevantDocuments: [],
    totalTokens: usedTokens,
    compressionRatio,
  }
}