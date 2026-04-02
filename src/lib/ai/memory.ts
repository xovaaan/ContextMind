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

  // LLM enrichment runs in background
  Promise.resolve().then(async () => {
    console.log(`[enrichment] Starting background tasks for session ${sessionId}...`)
    
    // 1. Handle Summarization (Decoupled)
    try {
      if (Math.floor(newMessageCount / 20) > Math.floor(session.messageCount / 20)) {
        console.log(`[enrichment] Triggering SHORT summary for ${sessionId}`)
        await generateSummary(sessionId, 'short', 1000)
      }
      if (Math.floor(newMessageCount / 60) > Math.floor(session.messageCount / 60)) {
        console.log(`[enrichment] Triggering LONG summary for ${sessionId}`)
        await generateSummary(sessionId, 'long', 4000)
      }
    } catch (err) {
      console.error(`[enrichment] Summarization failed for ${sessionId}:`, err)
    }

    // 2. Handle Representation Extraction (Decoupled)
    try {
      if (reasoningLevel !== 'minimal') {
        processToMEnrichment(session.peerId, sessionId, incomingMessages, messageIds, reasoningLevel)
          .catch(err => console.error(`[enrichment] ToM extraction failed for ${sessionId}:`, err))
      }
    } catch (err) {
      console.error(`[enrichment] ToM dispatch failed for ${sessionId}:`, err)
    }
  })

  return {
    messageIds,
    tokensIngested: totalTokens,
    summaryGenerated: false, // Legacy field
    representationsExtracted: 0,
    cost: estimateCost(totalTokens),
  }
}

/**
 * Separate function for Theory of Mind extraction to keep processIngest clean.
 */
async function processToMEnrichment(
  peerId: string,
  sessionId: string,
  incomingMessages: any[],
  messageIds: string[],
  reasoningLevel: ReasoningLevel
) {
  const confidenceThreshold = REASONING_CONFIDENCE[reasoningLevel]
  const contextText = incomingMessages.map(m => `${m.role}: ${m.content}`).join('\n')

  console.log(`[enrichment] Extracting representations for peer ${peerId} (level: ${reasoningLevel})...`)

  const existingReps = await db.select({ key: representations.key })
    .from(representations)
    .where(eq(representations.peerId, peerId))
  const existingKeys = existingReps.map(r => r.key)

  try {
    const extracted = await extractRepresentations(contextText, existingKeys, reasoningLevel)
    console.log(`[enrichment] AI returned ${extracted.length} raw traits for session ${sessionId}. Preview: ${extracted.slice(0, 2).map(e => e.key).join(', ') || 'none'}`)

    const filtered = extracted.filter(r => r.confidence >= confidenceThreshold)
    console.log(`[enrichment] ${filtered.length} traits passed threshold (${confidenceThreshold}%).`)

    if (filtered.length === 0 && extracted.length > 0) {
      const best = [...extracted].sort((a, b) => b.confidence - a.confidence)[0]
      console.log(`[enrichment] All ${extracted.length} traits were below threshold. Best: '${best.key}' at ${best.confidence}% (target ${confidenceThreshold}%).`)
      return
    }

    if (filtered.length === 0) return

    for (const rep of filtered) {
      const existing = await db.select().from(representations)
        .where(and(
          eq(representations.peerId, peerId),
          eq(representations.key, rep.key)
        ))
        .limit(1)

      if (existing[0]) {
        if (rep.confidence > existing[0].confidence) {
          console.log(`[enrichment] Updating existing representation: ${rep.key}`)
          await db.update(representations)
            .set({ 
              value: rep.value, 
              confidence: rep.confidence, 
              sourceMessageIds: messageIds, 
              updatedAt: new Date() 
            })
            .where(eq(representations.id, existing[0].id))
        }
      } else {
        console.log(`[enrichment] Creating new representation: ${rep.key}`)
        await db.insert(representations).values({
          id: uuidv4(),
          peerId: peerId,
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
    console.log(`[enrichment] Finished ToM extraction for session ${sessionId}.`)
  } catch (err) {
    console.error(`[enrichment] Error during ToM extraction for session ${sessionId}:`, err)
  }
}

async function generateSummary(sessionId: string, type: 'short' | 'long', maxTokens: number) {
  const allMessages = await db.select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.sequence))

  if (allMessages.length === 0) return

  const messageTexts = allMessages.map(m => `${m.role}: ${m.content}`)
  const summaryText = await summarizeMessages(messageTexts, maxTokens, type)

  await db.insert(summaries).values({
    id: uuidv4(),
    sessionId,
    content: summaryText,
    type,
    messageRangeStart: allMessages[0].sequence,
    messageRangeEnd: allMessages[allMessages.length - 1].sequence,
    tokenCount: countTokens(summaryText),
    createdAt: new Date(),
  })
}

export async function assembleContext(
  workspaceId: string, 
  sessionId: string, 
  options: { 
    maxTokens?: number; 
    includeRepresentations?: boolean; 
    includeDocuments?: boolean;
    query?: string;
  } = {}
) {
  const { 
    maxTokens = 4000, 
    includeRepresentations = true, 
    includeDocuments = true,
    query = ''
  } = options

  const sessionResult = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
  if (!sessionResult[0]) throw new Error(`Session ${sessionId} not found`)
  const session = sessionResult[0]

  // Security check
  if (session.workspaceId !== workspaceId) throw new Error('Unauthorized access to session')

  const recentReps = includeRepresentations 
    ? await db.select()
        .from(representations)
        .where(eq(representations.peerId, session.peerId))
        .orderBy(desc(representations.updatedAt))
    : []

  const latestSummary = await db.select()
    .from(summaries)
    .where(eq(summaries.sessionId, sessionId))
    .orderBy(desc(summaries.createdAt))
    .limit(1)

  const allMessages = await db.select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.sequence))

  const totalRawTokens = allMessages.reduce((sum, msg) => sum + msg.tokenCount, 0)

  // Determine if there's an active summary to deduplicate historical messages
  const activeSummary = latestSummary[0]
  
  // Hard Reduction: completely drop messages that were already covered by the summary
  const unsummarizedMessages = allMessages.filter(msg => 
    !activeSummary?.messageRangeEnd || msg.sequence > activeSummary.messageRangeEnd
  )

  let currentTokens = 0
  const contextMessages: Message[] = []
  
  const repText = recentReps.map(r => `${r.key}: ${r.value}`).join('\n')
  const repTokens = countTokens(repText)
  
  const summaryText = activeSummary?.content || ''
  const summaryTokens = countTokens(summaryText)

  // Pack whatever new unsummarized messages remain, up to the API cap
  const budget = maxTokens - repTokens - summaryTokens
  
  for (const msg of unsummarizedMessages) {
    if (currentTokens + msg.tokenCount > budget) break
    contextMessages.unshift(msg as Message)
    currentTokens += msg.tokenCount
  }

  return {
    totalTokens: repTokens + summaryTokens + currentTokens,
    representations: recentReps,
    summary: latestSummary[0] || null,
    recentMessages: contextMessages,
    compressionRatio: (repTokens + summaryTokens + currentTokens) / Math.max(1, totalRawTokens || 1)
  }
}