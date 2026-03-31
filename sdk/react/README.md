# ContextMind React SDK

React hooks for seamless ContextMind integration. Works with Next.js (App Router + Pages), Vite, CRA, and any React 18+ app.

## Setup

Copy `contextmind-react.tsx` into your project.

### 1. Wrap your app

```tsx
// app/layout.tsx (Next.js App Router)
import { ContextMindProvider } from '@/sdk/react/contextmind-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ContextMindProvider
          apiKey={process.env.NEXT_PUBLIC_CM_API_KEY!}
          baseUrl=""  // empty = same origin (recommended for Next.js)
        >
          {children}
        </ContextMindProvider>
      </body>
    </html>
  )
}
```

## Hooks

### `useContextMind(sessionId, options?)` — fetch context

Fetches compressed context for a session. Call before every LLM interaction.

```tsx
import { useContextMind } from '@/sdk/react/contextmind-react'

function ChatSidebar({ sessionId }: { sessionId: string }) {
  const { context, loading, error, refetch } = useContextMind(sessionId, {
    maxTokens: 8000,
    includeRepresentations: true,
    refetchInterval: 5000,  // auto-refresh every 5 seconds
  })

  if (loading) return <div className="animate-pulse">Loading context…</div>
  if (error) return <div className="text-red-500">Error: {error.message}</div>

  return (
    <div>
      <div className="text-green-600 font-bold">{context?.savingsPercent}% token savings</div>
      <div className="text-sm text-slate-500">
        Using {context?.totalTokens} tokens (compression: {context?.compressionRatio?.toFixed(2)})
      </div>

      {context?.summary && (
        <div className="mt-4">
          <h3 className="font-semibold">Summary</h3>
          <p className="text-sm text-slate-600">{context.summary}</p>
        </div>
      )}

      {context?.representations.map(rep => (
        <div key={rep.key} className="mt-2">
          <span className="font-medium capitalize">{rep.key.replace('_', ' ')}:</span>{' '}
          <span className="text-slate-600">{rep.value}</span>{' '}
          <span className="text-xs text-slate-400">({rep.confidence}% confidence)</span>
        </div>
      ))}
    </div>
  )
}
```

### `useIngest()` — send messages

```tsx
import { useIngest } from '@/sdk/react/contextmind-react'

function MessageInput({ sessionId, onMessageSent }: { sessionId: string; onMessageSent: () => void }) {
  const { ingest, loading, result, error } = useIngest()
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return
    try {
      const result = await ingest(
        sessionId,
        [{ role: 'user', content: message }],
        'medium'  // reasoning level
      )
      console.log(`Cost: $${result.cost.toFixed(8)}`)
      console.log(`Insights extracted: ${result.representationsExtracted}`)
      setMessage('')
      onMessageSent()  // trigger context refetch
    } catch (err) {
      console.error('Ingest failed:', err)
    }
  }

  return (
    <div>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder="Type a message…"
        className="w-full border rounded-lg p-3"
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending…' : 'Send'}
      </button>
      {result && (
        <p className="text-xs text-slate-500 mt-1">
          {result.tokensIngested} tokens · ${result.cost.toFixed(8)} · {result.representationsExtracted} insights
        </p>
      )}
    </div>
  )
}
```

### `useInfer(peerId)` — query peer profile

```tsx
import { useInfer } from '@/sdk/react/contextmind-react'

function PersonalisedUI({ peerId }: { peerId: string }) {
  const { infer, result, loading, error } = useInfer(peerId)

  useEffect(() => {
    // Query on mount
    infer('What UI complexity level does this user prefer?')
  }, [peerId])

  if (loading) return <div>Analysing user profile…</div>

  return (
    <div>
      {result && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="font-medium">{result.answer}</p>
          <p className="text-xs text-slate-500 mt-2">
            Confidence: {result.confidence}% · Based on: {result.sourcedFrom.join(', ')}
          </p>
        </div>
      )}

      {/* Use insight to personalise UI */}
      <button
        onClick={() => infer('Should I show advanced settings to this user?')}
        className="mt-2 text-sm text-blue-600"
      >
        Re-analyse
      </button>
    </div>
  )
}
```

### `useSession(sessionId)` — session details

```tsx
import { useSession } from '@/sdk/react/contextmind-react'

function SessionHeader({ sessionId }: { sessionId: string }) {
  const { session, loading } = useSession(sessionId)

  if (loading) return null
  return (
    <h2>
      {session?.name ?? 'Unnamed session'} — {session?.messageCount} messages
      {!session?.isActive && <span className="text-slate-400"> (closed)</span>}
    </h2>
  )
}
```

## Complete Chat Component Example

```tsx
'use client'
import { useState, useEffect } from 'react'
import {
  useContextMind,
  useIngest,
  useInfer,
  useSession,
} from '@/sdk/react/contextmind-react'

interface Props {
  sessionId: string
  peerId: string
}

export function ChatComponent({ sessionId, peerId }: Props) {
  const [input, setInput] = useState('')

  // Fetch compressed context — auto-refreshes after ingest
  const { context, loading: ctxLoading, refetch } = useContextMind(sessionId, {
    maxTokens: 8000,
  })

  // Ingest messages
  const { ingest, loading: ingesting } = useIngest()

  // Get peer insights
  const { infer, result: profile } = useInfer(peerId)

  // Query profile on mount
  useEffect(() => {
    infer('How should I communicate with this user?')
  }, [peerId])

  const sendMessage = async () => {
    if (!input.trim() || ingesting) return
    await ingest(sessionId, [{ role: 'user', content: input }])
    setInput('')
    refetch()  // refresh context after ingest
  }

  return (
    <div className="flex gap-6">
      {/* Chat area */}
      <div className="flex-1">
        {ctxLoading ? (
          <div>Loading…</div>
        ) : (
          context?.recentMessages.map(msg => (
            <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <span className="inline-block bg-slate-100 rounded-lg px-3 py-2 text-sm">
                {msg.content}
              </span>
            </div>
          ))
        )}
        <div className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button onClick={sendMessage} disabled={ingesting}>Send</button>
        </div>
      </div>

      {/* Sidebar — context stats + profile */}
      <div className="w-64 text-sm">
        <div className="font-bold text-green-600">{context?.savingsPercent}% savings</div>
        <div className="text-slate-500">{context?.totalTokens} tokens used</div>
        {profile && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3">
            <div className="font-semibold text-blue-700 mb-1">Profile Insight</div>
            <p className="text-slate-600">{profile.answer}</p>
            <p className="text-xs text-slate-400 mt-1">{profile.confidence}% confidence</p>
          </div>
        )}
      </div>
    </div>
  )
}
```
