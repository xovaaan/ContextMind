# ContextMind JavaScript SDK

Zero dependencies. Works in Node.js 18+, Deno, Bun, and modern browsers via native `fetch`.

## Setup

Copy `contextmind.js` into your project.

```js
// ESM
import { ContextMind } from './contextmind.js'

// CommonJS
const { ContextMind } = require('./contextmind.js')

const cm = new ContextMind({
  apiKey: 'ctxmind_your_key',
  baseUrl: 'https://your-app.com',   // or http://localhost:3000 for local dev
})
```

## Full Example

```js
// 1. Create peer
const peer = await cm.peers.create({ name: 'Alice', type: 'user' })

// 2. Create session
const session = await cm.sessions.create({
  peerId: peer.id,
  name: 'Support chat #1',
})

// 3. Ingest messages (call after each turn)
const result = await cm.ingest({
  sessionId: session.id,
  messages: [
    { role: 'user', content: 'I need help with my React app' },
    { role: 'assistant', content: 'Happy to help. What is the issue?' },
    { role: 'user', content: 'I am a senior dev but new to Next.js 14' },
  ],
  reasoningLevel: 'medium',
})
console.log(`Tokens: ${result.tokensIngested}, Cost: $${result.cost.toFixed(8)}`)
console.log(`Insights extracted: ${result.representationsExtracted}`)

// 4. Get compressed context before every LLM call
const ctx = await cm.context({ sessionId: session.id, maxTokens: 8000 })
console.log(`Savings: ${ctx.savingsPercent}%`)
console.log(`Summary: ${ctx.summary}`)

// Build OpenAI messages array
const messages = ctx.toOpenAIMessages('You are a helpful assistant.')
// Pass to OpenAI/Anthropic/any LLM

// 5. Infer insights about the peer
const insight = await cm.infer({
  peerId: peer.id,
  question: 'How should I explain Next.js concepts to this user?',
})
console.log(insight.answer)
console.log(`Confidence: ${insight.confidence}%`)
console.log(`Based on: ${insight.sourcedFrom.join(', ')}`)
```

## Error Handling

```js
import { ContextMind, AuthError, NotFoundError, ValidationError } from './contextmind.js'

try {
  const ctx = await cm.context({ sessionId: '...' })
} catch (err) {
  if (err instanceof AuthError) {
    console.error('Invalid API key — check your dashboard')
  } else if (err instanceof NotFoundError) {
    console.error('Session not found — create a new one')
  } else if (err instanceof ValidationError) {
    console.error('Bad request:', err.message)
  } else {
    console.error('API error:', err.message)
  }
}
```
