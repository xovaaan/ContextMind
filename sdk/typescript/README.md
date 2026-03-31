# ContextMind TypeScript SDK

Fully typed. Zero dependencies. Works in Node.js 18+, Deno, Bun, and modern browsers.

## Setup

Copy `contextmind.ts` into your project.

```ts
import { ContextMind, type ReasoningLevel, type PeerType } from './contextmind'

const cm = new ContextMind({
  apiKey: 'ctxmind_your_key',
  baseUrl: 'https://your-app.com',
})
```

## Full Example

```ts
import {
  ContextMind,
  AuthError, NotFoundError, ValidationError,
  type IngestMessage, type ReasoningLevel,
} from './contextmind'

const cm = new ContextMind({ apiKey: 'ctxmind_your_key' })

async function main() {
  // Create peer — fully typed return
  const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
  // peer.id: string, peer.type: PeerType, etc.

  // Create session
  const session = await cm.sessions.create({
    peerId: peer.id,
    name: 'Onboarding',
    metadata: { channel: 'web', plan: 'pro' },
  })

  // Ingest — typed messages
  const messages: IngestMessage[] = [
    { role: 'user', content: 'I prefer bullet points over long paragraphs' },
    { role: 'assistant', content: 'Understood.' },
    { role: 'user', content: 'I am a senior TypeScript engineer' },
  ]

  const result = await cm.ingest({
    sessionId: session.id,
    messages,
    reasoningLevel: 'high' satisfies ReasoningLevel,
  })

  console.log(`Tokens: ${result.tokensIngested}`)
  console.log(`Insights: ${result.representationsExtracted}`)

  // Context — ContextResponse class with typed properties
  const ctx = await cm.context({ sessionId: session.id, maxTokens: 8000 })
  // ctx.recentMessages: Message[]
  // ctx.summary: string | null
  // ctx.representations: Representation[]
  // ctx.compressionRatio: number
  // ctx.savingsPercent: number (computed)

  const openAIMessages = ctx.toOpenAIMessages('You are a helpful assistant.')
  // Returns: Array<{ role: 'system' | 'user' | 'assistant', content: string }>

  // Infer — InferResponse class
  const insight = await cm.infer({
    peerId: peer.id,
    question: 'What level of technical depth does this user prefer?',
    keys: ['expertise', 'communication_style'],  // optional filter
  })
  // insight.answer: string
  // insight.confidence: number
  // insight.sourcedFrom: string[]
  // insight.peerName: string
  console.log(insight.answer)
}

main().catch(console.error)
```

## Exported Types

```ts
// Enums
type PeerType = 'user' | 'agent' | 'object'
type MessageRole = 'user' | 'assistant' | 'system'
type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

// Entities
interface Peer { id, workspaceId, name, type, metadata, createdAt, updatedAt }
interface Session { id, workspaceId, peerId, name, isActive, messageCount, ... }
interface Message { id, sessionId, peerId, content, role, tokenCount, sequence, ... }
interface Representation { id, peerId, key, value, confidence, sourceMessageIds, ... }

// Request types
interface IngestMessage { role, content, metadata? }
interface IngestOptions { sessionId, messages, reasoningLevel? }
interface ContextOptions { sessionId, maxTokens?, includeRepresentations?, ... }
interface InferOptions { peerId, question, keys? }

// Response classes (with methods)
class ContextResponse { recentMessages, summary, representations, totalTokens,
                        compressionRatio, savingsPercent, toOpenAIMessages() }
class InferResponse { answer, confidence, sourcedFrom, peerName, totalRepresentations }

// Errors
class ContextMindError extends Error { statusCode, hint }
class AuthError extends ContextMindError {}
class NotFoundError extends ContextMindError {}
class ValidationError extends ContextMindError {}
```
