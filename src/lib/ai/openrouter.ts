import type { ReasoningLevel } from '@/types'
import { countTokens } from './tokens'

const BASE_URL = 'https://openrouter.ai/api/v1'
const MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m2.5:free'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callLLM(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; useReasoning?: boolean } = {}
): Promise<string> {
  const { temperature = 0.3, maxTokens = 1000, useReasoning = false } = options

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  }

  if (useReasoning) {
    body.reasoning = { effort: 'medium' }
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': 'ContextMind',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message
  return message?.content || message?.reasoning || ''
}

export async function summarizeMessages(
  messages: string[],
  maxTokens: number,
  type: 'short' | 'long'
): Promise<string> {
  const conversationText = messages.join('\n')
  const detail = type === 'short'
    ? 'Create a concise summary (max 1000 tokens) capturing the main topics, decisions, and key information.'
    : 'Create a comprehensive summary (max 4000 tokens) covering all topics, context, user preferences, decisions, and important details.'

  const result = await callLLM([
    {
      role: 'system',
      content: 'You are a precise summarization engine. Extract key information efficiently. Output only the summary, no preamble.',
    },
    {
      role: 'user',
      content: `${detail}\n\nConversation to summarize:\n${conversationText}`,
    },
  ], { temperature: 0.2, maxTokens })

  return result
}

export interface ExtractedRepresentation {
  key: string
  value: string
  confidence: number
}

export async function extractRepresentations(
  context: string,
  existingKeys: string[],
  reasoningLevel: ReasoningLevel
): Promise<ExtractedRepresentation[]> {
  const useReasoning = reasoningLevel === 'high' || reasoningLevel === 'max'
  const depthInstruction = {
    minimal: 'Extract only basic facts (name, location). Require 90%+ confidence.',
    low: 'Extract standard recall information. Require 80%+ confidence.',
    medium: 'Extract balanced behavioral patterns and preferences. Require 70%+ confidence.',
    high: 'Extract complex insights including motivations and cognitive patterns. Require 60%+ confidence.',
    max: 'Extract deep psychological profiling including values, biases, and decision patterns. Require 50%+ confidence.',
  }[reasoningLevel]

  const prompt = `${depthInstruction}
Existing keys (update if better data): ${existingKeys.join(', ') || 'none'}

Valid keys: communication_style, expertise, preferences, values, decision_making, personality_traits, goals, pain_points, technical_level, language_style

Conversation context:
${context}

Return ONLY a JSON array like: [{"key": "communication_style", "value": "...", "confidence": 85}]
No preamble, no explanation, pure JSON array.`

  const result = await callLLM([
    {
      role: 'system',
      content: 'You are a psychological profiling engine. Extract behavioral patterns using formal deductive reasoning. Return only valid JSON.',
    },
    { role: 'user', content: prompt },
  ], { temperature: 0.3, maxTokens: 2000, useReasoning })

  try {
    const match = result.match(/\[[\s\S]*\]/)
    const clean = match ? match[0] : result.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function queryRepresentations(
  representations: Record<string, string>,
  question: string
): Promise<string> {
  const profileText = Object.entries(representations)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return callLLM([
    {
      role: 'system',
      content: 'You are a peer intelligence system. Answer questions about a person based on their psychological profile. Be specific and cite the relevant profile data.',
    },
    {
      role: 'user',
      content: `Profile:\n${profileText}\n\nQuestion: ${question}`,
    },
  ], { temperature: 0.4, maxTokens: 500 })
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': 'ContextMind',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text.slice(0, 8000), // Truncate to avoid token limits
    }),
  })

  if (!response.ok) {
    // Return zero vector as fallback
    console.error('Embedding API error:', await response.text())
    return new Array(1536).fill(0)
  }

  const data = await response.json()
  return data.data?.[0]?.embedding || new Array(1536).fill(0)
}
