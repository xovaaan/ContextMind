export type PeerType = 'user' | 'agent' | 'object'
export type MessageRole = 'user' | 'assistant' | 'system'
export type SummaryType = 'short' | 'long'
export type PlanType = 'free' | 'pro' | 'enterprise'
export type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

export interface Workspace {
  id: string
  name: string
  ownerId: string
  apiKey: string
  plan: PlanType
  usageTokens: number
  createdAt: Date
  updatedAt: Date
}

export interface Peer {
  id: string
  workspaceId: string
  name: string
  type: PeerType
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  workspaceId: string
  peerId: string
  name: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  messageCount: number
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
}

export interface Summary {
  id: string
  sessionId: string
  type: SummaryType
  content: string
  messageRangeStart: number | null
  messageRangeEnd: number | null
  tokenCount: number | null
  createdAt: Date
}

export interface Representation {
  id: string
  peerId: string
  key: string
  value: string
  confidence: number
  sourceMessageIds: string[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  workspaceId: string
  peerId: string | null
  sessionId: string | null
  title: string | null
  content: string
  metadata: Record<string, unknown>
  createdAt: Date
}

// API Request/Response types
export interface IngestRequest {
  sessionId: string
  messages: Array<{ role: MessageRole; content: string; metadata?: Record<string, unknown> }>
  reasoningLevel?: ReasoningLevel
}

export interface IngestResponse {
  success: boolean
  messageIds: string[]
  tokensIngested: number
  summaryGenerated?: boolean
  representationsExtracted?: number
  cost: number
}

export interface ContextRequest {
  sessionId: string
  maxTokens?: number
  includeRepresentations?: boolean
  includeDocuments?: boolean
  query?: string
}

export interface ContextResponse {
  recentMessages: Message[]
  summary?: string
  representations: Representation[]
  relevantDocuments: Document[]
  totalTokens: number
  compressionRatio: number
}

export interface InferRequest {
  peerId: string
  question: string
  keys?: string[]
}

export interface InferResponse {
  answer: string
  confidence: number
  sourcedFrom: string[]
  peerName: string
  totalRepresentations: number
}

export const REASONING_CONFIDENCE: Record<ReasoningLevel, number> = {
  minimal: 90,
  low: 80,
  medium: 70,
  high: 60,
  max: 50,
}
