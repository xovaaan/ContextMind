/**
 * ContextMind TypeScript SDK
 * ==========================
 *
 * Fully-typed client for the ContextMind API.
 * Works in Node.js 18+, Deno, Bun, and modern browsers.
 * Zero dependencies — uses native fetch.
 *
 * @example
 * import { ContextMind } from './contextmind'
 *
 * const cm = new ContextMind({ apiKey: 'ctxmind_your_key' })
 *
 * const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
 * const session = await cm.sessions.create({ peerId: peer.id })
 *
 * await cm.ingest({
 *   sessionId: session.id,
 *   messages: [{ role: 'user', content: 'I prefer concise answers' }],
 * })
 *
 * const ctx = await cm.context({ sessionId: session.id })
 * const messages = ctx.toOpenAIMessages('You are a helpful assistant.')
 *
 * const insight = await cm.infer({
 *   peerId: peer.id,
 *   question: 'How should I communicate with this user?',
 * })
 */

export type PeerType = 'user' | 'agent' | 'object'
export type MessageRole = 'user' | 'assistant' | 'system'
export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

export interface Peer {
  id: string
  workspaceId: string
  name: string
  type: PeerType
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  workspaceId: string
  peerId: string
  name: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  sessionId: string
  peerId: string
  content: string
  role: MessageRole
  metadata: Record<string, unknown>
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
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface IngestMessage {
  role: MessageRole
  content: string
  metadata?: Record<string, unknown>
}

export interface IngestOptions {
  sessionId: string
  messages: IngestMessage[]
  reasoningLevel?: ReasoningLevel
}

export interface IngestResult {
  success: boolean
  messageIds: string[]
  tokensIngested: number
  summaryGenerated: boolean
  representationsExtracted: number
  cost: number
}

export interface ContextOptions {
  sessionId: string
  maxTokens?: number
  includeRepresentations?: boolean
  includeDocuments?: boolean
  query?: string
}

export interface InferOptions {
  peerId: string
  question: string
  keys?: string[]
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ─── Error types ─────────────────────────────────────────────────────────────

export class ContextMindError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly hint?: string
  ) {
    super(hint ? `${message} — Hint: ${hint}` : message)
    this.name = 'ContextMindError'
  }
}

export class AuthError extends ContextMindError {
  constructor(message: string, hint?: string) { super(message, 401, hint); this.name = 'AuthError' }
}

export class NotFoundError extends ContextMindError {
  constructor(message: string, hint?: string) { super(message, 404, hint); this.name = 'NotFoundError' }
}

export class ValidationError extends ContextMindError {
  constructor(message: string, hint?: string) { super(message, 400, hint); this.name = 'ValidationError' }
}

// ─── Response types ──────────────────────────────────────────────────────────

export class ContextResponse {
  /** Verbatim recent messages within the 60% token budget */
  readonly recentMessages: Message[]
  /** Compressed summary within the 40% token budget */
  readonly summary: string | null
  /** Theory of Mind profile, ordered by confidence */
  readonly representations: Representation[]
  /** Semantically matched documents */
  readonly relevantDocuments: unknown[]
  /** Total tokens in this context package */
  readonly totalTokens: number
  /**
   * Ratio of context tokens to full history tokens.
   * 0.09 = you are sending 9% of full history = 91% token savings.
   */
  readonly compressionRatio: number

  constructor(data: Record<string, unknown>) {
    this.recentMessages = (data.recentMessages as Message[]) ?? []
    this.summary = (data.summary as string) ?? null
    this.representations = (data.representations as Representation[]) ?? []
    this.relevantDocuments = (data.relevantDocuments as unknown[]) ?? []
    this.totalTokens = (data.totalTokens as number) ?? 0
    this.compressionRatio = (data.compressionRatio as number) ?? 1.0
  }

  /** Percentage token savings vs sending full history. E.g. 91.0 */
  get savingsPercent(): number {
    return Math.round((1 - this.compressionRatio) * 1000) / 10
  }

  /**
   * Build an OpenAI-compatible messages array from this context.
   * Assembles: system (summary + Theory of Mind) + recent messages.
   *
   * @param systemPrefix Optional text prepended to the system message.
   * @returns Messages array ready for OpenAI / Anthropic / any OpenAI-compatible API.
   *
   * @example
   * const ctx = await cm.context({ sessionId })
   * const messages = ctx.toOpenAIMessages('You are a helpful coding assistant.')
   * const response = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [...messages, { role: 'user', content: userInput }],
   * })
   */
  toOpenAIMessages(systemPrefix = ''): OpenAIMessage[] {
    const parts: string[] = []
    if (systemPrefix) parts.push(systemPrefix)
    if (this.summary) parts.push(`\n\nCONVERSATION HISTORY SUMMARY:\n${this.summary}`)
    if (this.representations.length > 0) {
      const repText = this.representations
        .map(r => `- ${r.key}: ${r.value} (confidence: ${r.confidence}%)`)
        .join('\n')
      parts.push(`\n\nUSER PROFILE (Theory of Mind):\n${repText}`)
    }

    const result: OpenAIMessage[] = []
    if (parts.length > 0) {
      result.push({ role: 'system', content: parts.join('') })
    }
    for (const msg of this.recentMessages) {
      result.push({ role: msg.role as 'user' | 'assistant', content: msg.content })
    }
    return result
  }

  toString(): string {
    return `ContextResponse(totalTokens=${this.totalTokens}, savings=${this.savingsPercent}%, representations=${this.representations.length})`
  }
}

export class InferResponse {
  /** Synthesized answer based on the peer's psychological profile */
  readonly answer: string
  /** Average confidence score (0–100) of the source representations */
  readonly confidence: number
  /** Representation keys that were used to generate the answer */
  readonly sourcedFrom: string[]
  /** Display name of the queried peer */
  readonly peerName: string
  /** Total number of representations in the peer's profile */
  readonly totalRepresentations: number

  constructor(data: Record<string, unknown>) {
    this.answer = (data.answer as string) ?? ''
    this.confidence = (data.confidence as number) ?? 0
    this.sourcedFrom = (data.sourcedFrom as string[]) ?? []
    this.peerName = (data.peerName as string) ?? ''
    this.totalRepresentations = (data.totalRepresentations as number) ?? 0
  }

  toString(): string {
    return `InferResponse(confidence=${this.confidence}%, sourcedFrom=[${this.sourcedFrom.join(', ')}])`
  }
}

// ─── Resource classes ────────────────────────────────────────────────────────

export class PeersResource {
  constructor(private readonly client: ContextMind) {}

  /**
   * Create a new peer.
   *
   * @param options.name     Display name for the peer.
   * @param options.type     "user" | "agent" | "object". Default: "user".
   * @param options.metadata Optional arbitrary metadata.
   */
  async create(options: { name: string; type?: PeerType; metadata?: Record<string, unknown> }): Promise<Peer> {
    return this.client._post<Peer>('/api/peers', {
      name: options.name,
      type: options.type ?? 'user',
      ...(options.metadata ? { metadata: options.metadata } : {}),
    })
  }

  /**
   * List all peers, optionally filtered by type.
   */
  async list(options: { type?: PeerType } = {}): Promise<Peer[]> {
    return this.client._get<Peer[]>('/api/peers', options.type ? { type: options.type } : {})
  }

  /**
   * Get a peer with their full profile (representations + sessions).
   */
  async get(peerId: string): Promise<Peer & { representations: Representation[]; sessions: Session[] }> {
    return this.client._get(`/api/peers/${peerId}`)
  }

  /**
   * Update a peer's name or metadata.
   */
  async update(peerId: string, updates: { name?: string; metadata?: Record<string, unknown> }): Promise<Peer> {
    return this.client._patch<Peer>(`/api/peers/${peerId}`, updates)
  }

  /**
   * Delete a peer and all associated data (sessions, messages, representations).
   */
  async delete(peerId: string): Promise<{ success: true }> {
    return this.client._delete<{ success: true }>(`/api/peers/${peerId}`)
  }
}

export class SessionsResource {
  constructor(private readonly client: ContextMind) {}

  /**
   * Create a new session (conversation thread).
   *
   * @param options.peerId   UUID of the peer this session belongs to.
   * @param options.name     Optional human-readable session name.
   * @param options.metadata Optional metadata.
   */
  async create(options: { peerId: string; name?: string; metadata?: Record<string, unknown> }): Promise<Session> {
    return this.client._post<Session>('/api/sessions', {
      peerId: options.peerId,
      ...(options.name ? { name: options.name } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    })
  }

  /**
   * List sessions, optionally filtered.
   */
  async list(options: { peerId?: string; isActive?: boolean } = {}): Promise<Session[]> {
    const params: Record<string, string> = {}
    if (options.peerId) params.peerId = options.peerId
    if (options.isActive !== undefined) params.isActive = String(options.isActive)
    return this.client._get<Session[]>('/api/sessions', params)
  }

  /**
   * Get a session with its full message history and summaries.
   */
  async get(sessionId: string): Promise<Session & { messages: Message[] }> {
    return this.client._get(`/api/sessions/${sessionId}`)
  }

  /**
   * Update a session.
   */
  async update(sessionId: string, updates: { name?: string; isActive?: boolean; metadata?: Record<string, unknown> }): Promise<Session> {
    return this.client._patch<Session>(`/api/sessions/${sessionId}`, updates)
  }

  /** Mark a session as closed. */
  async close(sessionId: string): Promise<Session> {
    return this.update(sessionId, { isActive: false })
  }

  /** Delete a session and all its messages. */
  async delete(sessionId: string): Promise<{ success: true }> {
    return this.client._delete<{ success: true }>(`/api/sessions/${sessionId}`)
  }
}

// ─── Main client ─────────────────────────────────────────────────────────────

const SDK_VERSION = '1.0.0'

export interface ContextMindOptions {
  /** Your workspace API key (starts with ctxmind_) */
  apiKey: string
  /** API base URL. Default: http://localhost:3000 */
  baseUrl?: string
  /** Fetch timeout in ms. Default: 30000 */
  timeout?: number
}

export class ContextMind {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number

  readonly peers: PeersResource
  readonly sessions: SessionsResource

  constructor({ apiKey, baseUrl = 'http://localhost:3000', timeout = 30000 }: ContextMindOptions) {
    if (!apiKey) throw new AuthError('apiKey is required')
    if (!apiKey.startsWith('ctxmind_')) throw new AuthError('Invalid API key format. Keys must start with ctxmind_')

    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.timeout = timeout

    this.peers = new PeersResource(this)
    this.sessions = new SessionsResource(this)
  }

  private _headers(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `contextmind-ts/${SDK_VERSION}`,
    }
  }

  private async _handleResponse<T>(res: Response): Promise<T> {
    let data: Record<string, unknown>
    try { data = await res.json() } catch { data = { error: 'Unknown error' } }

    if (res.status === 401) throw new AuthError(String(data.error ?? 'Unauthorized'), String(data.hint ?? ''))
    if (res.status === 404) throw new NotFoundError(String(data.error ?? 'Not found'), String(data.hint ?? ''))
    if (res.status === 400) throw new ValidationError(String(data.error ?? 'Validation error'), String(data.hint ?? ''))
    if (!res.ok) throw new ContextMindError(String(data.error ?? 'API error'), res.status)
    return data as T
  }

  async _get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), { headers: this._headers(), signal: AbortSignal.timeout(this.timeout) })
    return this._handleResponse<T>(res)
  }

  async _post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST', headers: this._headers(), body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse<T>(res)
  }

  async _patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH', headers: this._headers(), body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse<T>(res)
  }

  async _delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE', headers: this._headers(), signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse<T>(res)
  }

  /**
   * Ingest conversation messages into ContextMind.
   *
   * Core write operation. Call this after each conversation turn or in batches.
   * Automatically triggers:
   * - Short summary (1K tokens) every 20 messages
   * - Long summary (4K tokens) every 60 messages
   * - Theory of Mind extraction at the specified reasoning level
   *
   * @example
   * const result = await cm.ingest({
   *   sessionId: '7c9e6679-...',
   *   messages: [
   *     { role: 'user', content: 'I need to refactor this TypeScript service' },
   *     { role: 'assistant', content: 'Happy to help. Share the code.' },
   *   ],
   *   reasoningLevel: 'medium',
   * })
   * console.log(`${result.tokensIngested} tokens ingested, cost $${result.cost.toFixed(8)}`)
   */
  async ingest(options: IngestOptions): Promise<IngestResult> {
    return this._post<IngestResult>('/api/ingest', {
      sessionId: options.sessionId,
      messages: options.messages,
      reasoningLevel: options.reasoningLevel ?? 'medium',
    })
  }

  /**
   * Retrieve compressed, token-optimised context for a session.
   *
   * Replaces fetching full message history before LLM calls.
   * Applies 60/40 token budget: recent messages vs compressed summary.
   * Includes Theory of Mind profile with minimal additional token overhead.
   *
   * @example
   * const ctx = await cm.context({ sessionId: '...', maxTokens: 8000 })
   * console.log(`Savings: ${ctx.savingsPercent}%`)
   *
   * // Pass directly to OpenAI:
   * const msgs = ctx.toOpenAIMessages('You are a helpful assistant.')
   * const response = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [...msgs, { role: 'user', content: userInput }],
   * })
   */
  async context(options: ContextOptions): Promise<ContextResponse> {
    const params: Record<string, string> = {
      sessionId: options.sessionId,
      maxTokens: String(options.maxTokens ?? 8000),
      includeRepresentations: String(options.includeRepresentations ?? true),
      includeDocuments: String(options.includeDocuments ?? true),
      ...(options.query ? { query: options.query } : {}),
    }
    const data = await this._get<Record<string, unknown>>('/api/context', params)
    return new ContextResponse(data)
  }

  /**
   * Query a peer's psychological profile in natural language (Infer API).
   *
   * ContextMind reasons over all accumulated Theory of Mind representations
   * and returns a synthesized, actionable answer. Use this to personalise
   * LLM prompts, adapt UI elements, or understand user behaviour patterns.
   *
   * @example
   * const result = await cm.infer({
   *   peerId: '550e8400-...',
   *   question: 'What level of technical detail does this user prefer?',
   *   keys: ['expertise', 'communication_style'],  // optional: focus on specific keys
   * })
   *
   * console.log(result.answer)
   * // → "Alice prefers high technical detail. She is a senior engineer who
   * //    finds simplified explanations patronising. Use precise terminology."
   *
   * console.log(`Confidence: ${result.confidence}%`)
   * console.log(`Based on: ${result.sourcedFrom.join(', ')}`)
   */
  async infer(options: InferOptions): Promise<InferResponse> {
    const data = await this._post<Record<string, unknown>>('/api/infer', {
      peerId: options.peerId,
      question: options.question,
      ...(options.keys ? { keys: options.keys } : {}),
    })
    return new InferResponse(data)
  }
}
