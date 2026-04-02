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
      content: `You are a high-fidelity psychological profiling engine.
      - Output ONLY a raw JSON array.
      - DO NOT include preamble, explanations, or markdown blocks.
      - If no traits are found, return exactly [].
      - Structure: [{"key": "key_name", "value": "string summary", "confidence": 0-100}]`,
    },
    { role: 'user', content: prompt },
  ], { temperature: 0.1, maxTokens: 2000, useReasoning })

  try {
    const parsed = parseAIJSON(result)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.warn('[extractRepresentations] Failed to parse JSON:', err)
    return []
  }
}

/**
 * Bulletproof JSON parser for AI responses.
 * Extracts the FIRST valid JSON array [...] or object {...} found in the text,
 * ignoring all preamble, markdown, or closing explanations.
 */
function parseAIJSON(text: string): any {
  if (!text) return null
  
  const trimmed = text.trim()
  
  // 1. Try direct parse first (fastest)
  try { return JSON.parse(trimmed) } catch {}

  // 2. Locate the bounds of the JSON array or object
  // We look for the first [ or { and the corresponding last ] or }
  const firstArray = trimmed.indexOf('[')
  const lastArray = trimmed.lastIndexOf(']')
  
  const firstObject = trimmed.indexOf('{')
  const lastObject = trimmed.lastIndexOf('}')

  // Try to extract an array if it looks like the dominant structure
  if (firstArray !== -1 && lastArray > firstArray) {
    const candidate = trimmed.substring(firstArray, lastArray + 1)
    try { return JSON.parse(candidate) } catch {}
  }

  // Try to extract an object if no array found or array parse failed
  if (firstObject !== -1 && lastObject > firstObject) {
    const candidate = trimmed.substring(firstObject, lastObject + 1)
    try { return JSON.parse(candidate) } catch {
      // Sometimes models escape quotes incorrectly
      try {
        const cleaned = candidate.replace(/\\"/g, '"').replace(/\\n/g, ' ')
        return JSON.parse(cleaned)
      } catch {}
    }
  }

  // 3. Last resort: Clean markdown markers and try again
  const cleaned = trimmed.replace(/```json\n?|```\n?|\n?```/g, '').trim()
  try { return JSON.parse(cleaned) } catch {}

  console.error('[parseAIJSON] Extraction failed. Raw preview:', trimmed.slice(0, 100))
  return null
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
