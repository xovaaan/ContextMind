/**
 * ContextMind React SDK
 * =====================
 *
 * React hooks for seamless ContextMind integration.
 * Works with Next.js (App Router & Pages Router), Vite, CRA, and any React 18+ app.
 *
 * Drop-in replacement for managing conversation context state — handles loading,
 * error states, and automatic context refresh.
 *
 * @example
 * // In _app.tsx or layout.tsx
 * import { ContextMindProvider } from './contextmind-react'
 *
 * export default function App({ children }) {
 *   return (
 *     <ContextMindProvider apiKey="ctxmind_your_key" baseUrl="https://your-app.com">
 *       {children}
 *     </ContextMindProvider>
 *   )
 * }
 *
 * // In any component:
 * import { useContextMind, useInfer, useSession } from './contextmind-react'
 *
 * function ChatComponent({ sessionId, peerId }) {
 *   const { context, loading, refetch } = useContextMind(sessionId)
 *   const { infer, result: profile } = useInfer(peerId)
 *
 *   // context.recentMessages  → recent messages
 *   // context.summary         → compressed history
 *   // context.savingsPercent  → token savings
 * }
 */

'use client'

import React, {
  createContext, useContext, useCallback,
  useState, useEffect, useRef, type ReactNode
} from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PeerType = 'user' | 'agent' | 'object'
export type MessageRole = 'user' | 'assistant' | 'system'
export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

export interface Message {
  id: string
  sessionId: string
  peerId: string
  content: string
  role: MessageRole
  tokenCount: number
  sequence: number
  createdAt: string
}

export interface Representation {
  id: string
  peerId: string
  key: string
  value: string
  confidence: number
  sourceMessageIds: string[]
  createdAt: string
}

export interface CMContext {
  recentMessages: Message[]
  summary: string | null
  representations: Representation[]
  relevantDocuments: unknown[]
  totalTokens: number
  compressionRatio: number
  savingsPercent: number
}

export interface IngestMessage {
  role: MessageRole
  content: string
  metadata?: Record<string, unknown>
}

export interface IngestResult {
  success: boolean
  messageIds: string[]
  tokensIngested: number
  summaryGenerated: boolean
  representationsExtracted: number
  cost: number
}

export interface InferResult {
  answer: string
  confidence: number
  sourcedFrom: string[]
  peerName: string
  totalRepresentations: number
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ContextMindContextValue {
  apiKey: string
  baseUrl: string
}

const ContextMindContext = createContext<ContextMindContextValue | null>(null)

function useContextMindClient() {
  const ctx = useContext(ContextMindContext)
  if (!ctx) throw new Error('useContextMind hooks must be used inside <ContextMindProvider>')
  return ctx
}

async function apiFetch(
  baseUrl: string,
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': 'contextmind-react/1.0.0',
      ...(options.headers as Record<string, string> ?? {}),
    },
  })

  const data = await res.json().catch(() => ({ error: 'Unknown error' }))

  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? 'API error'
    const hint = (data as { hint?: string }).hint
    throw new Error(hint ? `${msg} — ${hint}` : msg)
  }

  return data
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ContextMindProviderProps {
  /** Your workspace API key (starts with ctxmind_) */
  apiKey: string
  /** API base URL. Default: empty string (same origin) for Next.js apps */
  baseUrl?: string
  children: ReactNode
}

/**
 * Wrap your app (or layout) with this provider.
 * All ContextMind hooks must be used inside this provider.
 *
 * @example
 * // app/layout.tsx (Next.js App Router)
 * export default function RootLayout({ children }) {
 *   return (
 *     <ContextMindProvider apiKey={process.env.NEXT_PUBLIC_CM_API_KEY!}>
 *       {children}
 *     </ContextMindProvider>
 *   )
 * }
 */
export function ContextMindProvider({ apiKey, baseUrl = '', children }: ContextMindProviderProps) {
  return (
    <ContextMindContext.Provider value={{ apiKey, baseUrl: baseUrl.replace(/\/$/, '') }}>
      {children}
    </ContextMindContext.Provider>
  )
}

// ─── useContextMind ───────────────────────────────────────────────────────────

export interface UseContextMindOptions {
  maxTokens?: number
  includeRepresentations?: boolean
  includeDocuments?: boolean
  query?: string
  /** Refetch interval in ms. 0 = disabled. Default: 0 */
  refetchInterval?: number
  /** Whether to fetch immediately. Default: true */
  enabled?: boolean
}

export interface UseContextMindReturn {
  /** The assembled context package */
  context: CMContext | null
  /** True while the initial fetch is in progress */
  loading: boolean
  /** Error from the last failed fetch */
  error: Error | null
  /** Manually trigger a refetch */
  refetch: () => Promise<void>
}

/**
 * Fetch and subscribe to compressed context for a session.
 *
 * Use this hook before sending messages to your LLM. It returns
 * compressed context within your token budget, achieving ~90% token savings.
 *
 * @param sessionId  UUID of the session to fetch context for.
 * @param options    Configuration options.
 *
 * @example
 * function ChatPage({ sessionId }: { sessionId: string }) {
 *   const { context, loading, error, refetch } = useContextMind(sessionId, {
 *     maxTokens: 8000,
 *   })
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *
 *   return (
 *     <div>
 *       <p>Token savings: {context?.savingsPercent}%</p>
 *       <p>Recent messages: {context?.recentMessages.length}</p>
 *       {context?.summary && <Summary text={context.summary} />}
 *     </div>
 *   )
 * }
 */
export function useContextMind(
  sessionId: string | null | undefined,
  options: UseContextMindOptions = {}
): UseContextMindReturn {
  const { apiKey, baseUrl } = useContextMindClient()
  const {
    maxTokens = 8000,
    includeRepresentations = true,
    includeDocuments = true,
    query,
    refetchInterval = 0,
    enabled = true,
  } = options

  const [context, setContext] = useState<CMContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchContext = useCallback(async () => {
    if (!sessionId || !enabled) return
    setLoading(prev => context === null ? true : prev)
    setError(null)
    try {
      const params = new URLSearchParams({
        sessionId,
        maxTokens: String(maxTokens),
        includeRepresentations: String(includeRepresentations),
        includeDocuments: String(includeDocuments),
        ...(query ? { query } : {}),
      })
      const data = await apiFetch(baseUrl, apiKey, `/api/v1/context?${params}`)
      const raw = data as Record<string, unknown>
      const compressionRatio = (raw.compressionRatio as number) ?? 1.0
      setContext({
        recentMessages: (raw.recentMessages as Message[]) ?? [],
        summary: (raw.summary as string) ?? null,
        representations: (raw.representations as Representation[]) ?? [],
        relevantDocuments: (raw.relevantDocuments as unknown[]) ?? [],
        totalTokens: (raw.totalTokens as number) ?? 0,
        compressionRatio,
        savingsPercent: Math.round((1 - compressionRatio) * 1000) / 10,
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [sessionId, apiKey, baseUrl, maxTokens, includeRepresentations, includeDocuments, query, enabled])

  useEffect(() => {
    fetchContext()
    if (refetchInterval > 0) {
      intervalRef.current = setInterval(fetchContext, refetchInterval)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchContext, refetchInterval])

  return { context, loading, error, refetch: fetchContext }
}

// ─── useIngest ────────────────────────────────────────────────────────────────

export interface UseIngestReturn {
  /** Call this to ingest messages */
  ingest: (sessionId: string, messages: IngestMessage[], reasoningLevel?: ReasoningLevel) => Promise<IngestResult>
  /** Result from the last successful ingest */
  result: IngestResult | null
  /** True while ingesting */
  loading: boolean
  /** Error from the last failed ingest */
  error: Error | null
}

/**
 * Hook for ingesting messages into a session.
 *
 * @example
 * function ChatInput({ sessionId, onSent }) {
 *   const { ingest, loading, result } = useIngest()
 *   const [input, setInput] = useState('')
 *
 *   const send = async () => {
 *     await ingest(sessionId, [
 *       { role: 'user', content: input },
 *     ])
 *     setInput('')
 *     onSent()
 *   }
 *
 *   return (
 *     <div>
 *       <input value={input} onChange={e => setInput(e.target.value)} />
 *       <button onClick={send} disabled={loading}>
 *         {loading ? 'Sending…' : 'Send'}
 *       </button>
 *       {result && <span>Cost: ${result.cost.toFixed(8)}</span>}
 *     </div>
 *   )
 * }
 */
export function useIngest(): UseIngestReturn {
  const { apiKey, baseUrl } = useContextMindClient()
  const [result, setResult] = useState<IngestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const ingest = useCallback(async (
    sessionId: string,
    messages: IngestMessage[],
    reasoningLevel: ReasoningLevel = 'medium'
  ): Promise<IngestResult> => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(baseUrl, apiKey, '/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ sessionId, messages, reasoningLevel }),
      }) as IngestResult
      setResult(data)
      return data
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [apiKey, baseUrl])

  return { ingest, result, loading, error }
}

// ─── useInfer ────────────────────────────────────────────────────────────────

export interface UseInferReturn {
  /** Call this to query a peer's profile */
  infer: (question: string, keys?: string[]) => Promise<InferResult>
  /** Result from the last successful infer call */
  result: InferResult | null
  /** True while inferring */
  loading: boolean
  /** Error from the last failed infer call */
  error: Error | null
}

/**
 * Hook for querying a peer's psychological profile (Infer API).
 *
 * @param peerId UUID of the peer to query.
 *
 * @example
 * function PersonalisedGreeting({ peerId }: { peerId: string }) {
 *   const { infer, result, loading } = useInfer(peerId)
 *
 *   useEffect(() => {
 *     infer('What is the user\'s preferred tone and communication style?')
 *   }, [peerId])
 *
 *   if (loading) return <span>Analysing profile…</span>
 *
 *   return (
 *     <div>
 *       <h3>Profile Insight</h3>
 *       <p>{result?.answer}</p>
 *       <small>Confidence: {result?.confidence}%</small>
 *     </div>
 *   )
 * }
 */
export function useInfer(peerId: string | null | undefined): UseInferReturn {
  const { apiKey, baseUrl } = useContextMindClient()
  const [result, setResult] = useState<InferResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const infer = useCallback(async (
    question: string,
    keys?: string[]
  ): Promise<InferResult> => {
    if (!peerId) throw new Error('peerId is required')
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch(baseUrl, apiKey, '/api/v1/infer', {
        method: 'POST',
        body: JSON.stringify({ peerId, question, ...(keys ? { keys } : {}) }),
      }) as InferResult
      setResult(data)
      return data
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      throw e
    } finally {
      setLoading(false)
    }
  }, [peerId, apiKey, baseUrl])

  return { infer, result, loading, error }
}

// ─── useSession ───────────────────────────────────────────────────────────────

export interface UseSessionReturn {
  session: { id: string; name: string | null; messageCount: number; isActive: boolean } | null
  loading: boolean
  error: Error | null
}

/**
 * Fetch session details and subscribe to message count updates.
 *
 * @example
 * function SessionHeader({ sessionId }) {
 *   const { session } = useSession(sessionId)
 *   return <h2>{session?.name ?? 'Unnamed'} — {session?.messageCount} messages</h2>
 * }
 */
export function useSession(sessionId: string | null | undefined): UseSessionReturn {
  const { apiKey, baseUrl } = useContextMindClient()
  const [session, setSession] = useState<UseSessionReturn['session']>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    apiFetch(baseUrl, apiKey, `/api/v1/sessions/${sessionId}`)
      .then(data => setSession(data as UseSessionReturn['session']))
      .catch(err => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [sessionId, apiKey, baseUrl])

  return { session, loading, error }
}
