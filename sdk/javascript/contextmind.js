/**
 * ContextMind JavaScript SDK
 * ==========================
 *
 * Official JavaScript client for the ContextMind API.
 * Works in Node.js (18+), Deno, Bun, and modern browsers.
 * Zero dependencies — uses native fetch.
 *
 * @example
 * // CommonJS
 * const { ContextMind } = require('./contextmind.js')
 *
 * // ESM
 * import { ContextMind } from './contextmind.js'
 *
 * const cm = new ContextMind({ apiKey: 'ctxmind_your_key' })
 *
 * const peer = await cm.peers.create({ name: 'Alice', type: 'user' })
 * const session = await cm.sessions.create({ peerId: peer.id })
 *
 * await cm.ingest({
 *   sessionId: session.id,
 *   messages: [
 *     { role: 'user', content: 'I prefer concise technical answers' },
 *     { role: 'assistant', content: 'Noted. Keeping it brief.' },
 *   ],
 *   reasoningLevel: 'medium',
 * })
 *
 * const ctx = await cm.context({ sessionId: session.id, maxTokens: 8000 })
 * console.log(`Savings: ${ctx.savingsPercent}%`)
 *
 * const insight = await cm.infer({
 *   peerId: peer.id,
 *   question: 'What communication style does this user prefer?',
 * })
 * console.log(insight.answer)
 */

'use strict'

const SDK_VERSION = '1.0.0'

// ─── Error types ─────────────────────────────────────────────────────────────

class ContextMindError extends Error {
  constructor(message, statusCode, hint) {
    super(hint ? `${message} — Hint: ${hint}` : message)
    this.name = 'ContextMindError'
    this.statusCode = statusCode
    this.hint = hint
  }
}

class AuthError extends ContextMindError {
  constructor(message, hint) { super(message, 401, hint); this.name = 'AuthError' }
}

class NotFoundError extends ContextMindError {
  constructor(message, hint) { super(message, 404, hint); this.name = 'NotFoundError' }
}

class ValidationError extends ContextMindError {
  constructor(message, hint) { super(message, 400, hint); this.name = 'ValidationError' }
}

// ─── Response wrappers ───────────────────────────────────────────────────────

/**
 * Assembled context package from cm.context().
 * Use toOpenAIMessages() to build a messages array ready for OpenAI/Anthropic.
 */
class ContextResponse {
  constructor(data) {
    /** @type {Array<{role: string, content: string, tokenCount: number}>} */
    this.recentMessages = data.recentMessages ?? []
    /** @type {string|null} */
    this.summary = data.summary ?? null
    /** @type {Array<{key: string, value: string, confidence: number}>} */
    this.representations = data.representations ?? []
    /** @type {Array} */
    this.relevantDocuments = data.relevantDocuments ?? []
    /** @type {number} Total tokens in this context package */
    this.totalTokens = data.totalTokens ?? 0
    /**
     * Ratio of context tokens to full history tokens.
     * 0.09 = you are sending 9% of full history = 91% token savings.
     * @type {number}
     */
    this.compressionRatio = data.compressionRatio ?? 1.0
    this._raw = data
  }

  /** Percentage token savings vs sending full history. E.g. 91.0 */
  get savingsPercent() {
    return Math.round((1 - this.compressionRatio) * 1000) / 10
  }

  /**
   * Convert context into an OpenAI-compatible messages array.
   * Assembles system prompt (summary + Theory of Mind profile) + recent messages.
   *
   * @param {string} [systemPrefix] - Optional text to prepend to the system message.
   * @returns {Array<{role: string, content: string}>}
   *
   * @example
   * const ctx = await cm.context({ sessionId: '...' })
   * const messages = ctx.toOpenAIMessages('You are a helpful assistant.')
   * const response = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [...messages, { role: 'user', content: userInput }],
   * })
   */
  toOpenAIMessages(systemPrefix = '') {
    const parts = []
    if (systemPrefix) parts.push(systemPrefix)
    if (this.summary) parts.push(`\n\nCONVERSATION HISTORY SUMMARY:\n${this.summary}`)
    if (this.representations.length > 0) {
      const repText = this.representations
        .map(r => `- ${r.key}: ${r.value} (confidence: ${r.confidence}%)`)
        .join('\n')
      parts.push(`\n\nUSER PROFILE (Theory of Mind):\n${repText}`)
    }

    const result = []
    if (parts.length > 0) {
      result.push({ role: 'system', content: parts.join('') })
    }
    for (const msg of this.recentMessages) {
      result.push({ role: msg.role, content: msg.content })
    }
    return result
  }

  toString() {
    return `ContextResponse(totalTokens=${this.totalTokens}, savings=${this.savingsPercent}%, representations=${this.representations.length})`
  }
}

/**
 * Response from the Infer API.
 */
class InferResponse {
  constructor(data) {
    /** @type {string} Synthesized answer based on the peer's psychological profile */
    this.answer = data.answer ?? ''
    /** @type {number} Average confidence score (0-100) of source representations */
    this.confidence = data.confidence ?? 0
    /** @type {string[]} Representation keys used to generate the answer */
    this.sourcedFrom = data.sourcedFrom ?? []
    /** @type {string} Display name of the queried peer */
    this.peerName = data.peerName ?? ''
    /** @type {number} Total number of representations in the peer's profile */
    this.totalRepresentations = data.totalRepresentations ?? 0
    this._raw = data
  }

  toString() {
    return `InferResponse(confidence=${this.confidence}%, sourcedFrom=[${this.sourcedFrom.join(', ')}])`
  }
}

// ─── Resource classes ────────────────────────────────────────────────────────

class PeersResource {
  constructor(client) { this._client = client }

  /**
   * Create a new peer.
   * @param {{ name: string, type?: 'user'|'agent'|'object', metadata?: object }} options
   * @returns {Promise<object>} Created peer
   */
  async create({ name, type = 'user', metadata } = {}) {
    return this._client._post('/api/peers', { name, type, ...(metadata ? { metadata } : {}) })
  }

  /**
   * List all peers, optionally filtered by type.
   * @param {{ type?: 'user'|'agent'|'object' }} [options]
   * @returns {Promise<object[]>}
   */
  async list({ type } = {}) {
    return this._client._get('/api/peers', type ? { type } : {})
  }

  /**
   * Get a peer with full profile (representations + sessions).
   * @param {string} peerId
   * @returns {Promise<object>}
   */
  async get(peerId) {
    return this._client._get(`/api/peers/${peerId}`)
  }

  /**
   * Update a peer's name or metadata.
   * @param {string} peerId
   * @param {{ name?: string, metadata?: object }} updates
   * @returns {Promise<object>}
   */
  async update(peerId, updates) {
    return this._client._patch(`/api/peers/${peerId}`, updates)
  }

  /**
   * Delete a peer and all associated data.
   * @param {string} peerId
   * @returns {Promise<{ success: true }>}
   */
  async delete(peerId) {
    return this._client._delete(`/api/peers/${peerId}`)
  }
}

class SessionsResource {
  constructor(client) { this._client = client }

  /**
   * Create a new session.
   * @param {{ peerId: string, name?: string, metadata?: object }} options
   * @returns {Promise<object>} Created session with id
   */
  async create({ peerId, name, metadata } = {}) {
    return this._client._post('/api/sessions', {
      peerId,
      ...(name ? { name } : {}),
      ...(metadata ? { metadata } : {}),
    })
  }

  /**
   * List sessions, optionally filtered.
   * @param {{ peerId?: string, isActive?: boolean }} [options]
   * @returns {Promise<object[]>}
   */
  async list({ peerId, isActive } = {}) {
    const params = {}
    if (peerId) params.peerId = peerId
    if (isActive !== undefined) params.isActive = String(isActive)
    return this._client._get('/api/sessions', params)
  }

  /**
   * Get a session with full message history and summaries.
   * @param {string} sessionId
   * @returns {Promise<object>}
   */
  async get(sessionId) {
    return this._client._get(`/api/sessions/${sessionId}`)
  }

  /**
   * Update a session.
   * @param {string} sessionId
   * @param {{ name?: string, isActive?: boolean, metadata?: object }} updates
   */
  async update(sessionId, updates) {
    return this._client._patch(`/api/sessions/${sessionId}`, updates)
  }

  /** Mark a session as closed (isActive: false). */
  async close(sessionId) {
    return this.update(sessionId, { isActive: false })
  }

  /** Delete a session and all its messages. */
  async delete(sessionId) {
    return this._client._delete(`/api/sessions/${sessionId}`)
  }
}

// ─── Main client ─────────────────────────────────────────────────────────────

class ContextMind {
  /**
   * Create a new ContextMind client.
   *
   * @param {object} options
   * @param {string} options.apiKey    - Your workspace API key (starts with ctxmind_)
   * @param {string} [options.baseUrl] - API base URL. Default: http://localhost:3000
   * @param {number} [options.timeout] - Fetch timeout in ms. Default: 30000
   */
  constructor({ apiKey, baseUrl = 'http://localhost:3000', timeout = 30000 } = {}) {
    if (!apiKey) throw new AuthError('apiKey is required')
    if (!apiKey.startsWith('ctxmind_')) throw new AuthError('Invalid API key format. Keys must start with ctxmind_')

    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.timeout = timeout

    this.peers = new PeersResource(this)
    this.sessions = new SessionsResource(this)
  }

  _headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': `contextmind-js/${SDK_VERSION}`,
    }
  }

  async _handleResponse(res) {
    let data
    try { data = await res.json() } catch { data = { error: 'Unknown error' } }

    if (res.status === 401) throw new AuthError(data.error || 'Unauthorized', data.hint)
    if (res.status === 404) throw new NotFoundError(data.error || 'Not found', data.hint)
    if (res.status === 400) throw new ValidationError(data.error || 'Validation error', data.hint)
    if (!res.ok) throw new ContextMindError(data.error || 'API error', res.status)
    return data
  }

  async _get(path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString(), { headers: this._headers(), signal: AbortSignal.timeout(this.timeout) })
    return this._handleResponse(res)
  }

  async _post(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST', headers: this._headers(), body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse(res)
  }

  async _patch(path, body) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH', headers: this._headers(), body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse(res)
  }

  async _delete(path) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE', headers: this._headers(), signal: AbortSignal.timeout(this.timeout),
    })
    return this._handleResponse(res)
  }

  /**
   * Ingest conversation messages into ContextMind.
   *
   * Core write operation. Call after each turn or in batches.
   * Automatically triggers summarization (every 20 or 60 messages)
   * and Theory of Mind extraction at the specified reasoning level.
   *
   * @param {object} options
   * @param {string} options.sessionId         - UUID of the session.
   * @param {Array<{role: string, content: string, metadata?: object}>} options.messages
   * @param {'minimal'|'low'|'medium'|'high'|'max'} [options.reasoningLevel='medium']
   *
   * @returns {Promise<{
   *   success: boolean,
   *   messageIds: string[],
   *   tokensIngested: number,
   *   summaryGenerated: boolean,
   *   representationsExtracted: number,
   *   cost: number
   * }>}
   *
   * @example
   * const result = await cm.ingest({
   *   sessionId: '7c9e6679-...',
   *   messages: [
   *     { role: 'user', content: 'Can you help me debug this async function?' },
   *     { role: 'assistant', content: 'Of course! Share the code and I\'ll take a look.' },
   *   ],
   *   reasoningLevel: 'medium',
   * })
   * console.log(`Cost: $${result.cost.toFixed(8)}`)
   */
  async ingest({ sessionId, messages, reasoningLevel = 'medium' }) {
    return this._post('/api/ingest', { sessionId, messages, reasoningLevel })
  }

  /**
   * Retrieve compressed context for a session.
   *
   * Call before every LLM API call. Returns recent messages + summary + Theory of Mind
   * profile within your token budget, achieving ~90% token reduction.
   *
   * @param {object} options
   * @param {string} options.sessionId                    - UUID of the session.
   * @param {number} [options.maxTokens=8000]             - Token budget (max: 32000).
   * @param {boolean} [options.includeRepresentations=true]
   * @param {boolean} [options.includeDocuments=true]
   * @param {string} [options.query]                      - Semantic search query.
   *
   * @returns {Promise<ContextResponse>}
   *
   * @example
   * const ctx = await cm.context({ sessionId: '...', maxTokens: 8000 })
   * console.log(`Sending ${ctx.totalTokens} tokens instead of full history`)
   * console.log(`Savings: ${ctx.savingsPercent}%`)
   *
   * // Ready for OpenAI:
   * const messages = ctx.toOpenAIMessages('You are a helpful assistant.')
   */
  async context({ sessionId, maxTokens = 8000, includeRepresentations = true,
                  includeDocuments = true, query } = {}) {
    const params = {
      sessionId,
      maxTokens: String(maxTokens),
      includeRepresentations: String(includeRepresentations),
      includeDocuments: String(includeDocuments),
      ...(query ? { query } : {}),
    }
    const data = await this._get('/api/context', params)
    return new ContextResponse(data)
  }

  /**
   * Query a peer's psychological profile using natural language (Infer API).
   *
   * ContextMind reasons over all accumulated Theory of Mind representations
   * and synthesizes a direct answer. Use this to personalise prompts, adapt UI,
   * or understand how to best interact with a specific user/agent.
   *
   * @param {object} options
   * @param {string} options.peerId    - UUID of the peer to query.
   * @param {string} options.question  - Natural language question (max 500 chars).
   * @param {string[]} [options.keys]  - Optional: limit to specific representation keys.
   *
   * @returns {Promise<InferResponse>}
   *
   * @example
   * const result = await cm.infer({
   *   peerId: '550e8400-...',
   *   question: 'What communication style does this user prefer?',
   * })
   * console.log(result.answer)
   * console.log(`Confidence: ${result.confidence}%`)
   * console.log(`Based on: ${result.sourcedFrom.join(', ')}`)
   */
  async infer({ peerId, question, keys } = {}) {
    const data = await this._post('/api/infer', {
      peerId, question, ...(keys ? { keys } : {}),
    })
    return new InferResponse(data)
  }
}

// Export for both ESM and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContextMind, ContextResponse, InferResponse, ContextMindError, AuthError, NotFoundError, ValidationError }
} else if (typeof exports !== 'undefined') {
  exports.ContextMind = ContextMind
}

export { ContextMind, ContextResponse, InferResponse, ContextMindError, AuthError, NotFoundError, ValidationError }
