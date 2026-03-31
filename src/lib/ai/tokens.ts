import { get_encoding } from 'js-tiktoken'

let encoder: ReturnType<typeof get_encoding> | null = null

function getEncoder() {
  if (!encoder) encoder = get_encoding('cl100k_base')
  return encoder
}

export function countTokens(text: string): number {
  try {
    return getEncoder().encode(text).length
  } catch {
    // Fallback: ~4 chars per token
    return Math.ceil(text.length / 4)
  }
}

export function countMessageTokens(messages: Array<{ role: string; content: string }>): number {
  // Each message has role overhead (~4 tokens) plus content
  return messages.reduce((sum, msg) => sum + countTokens(msg.content) + 4, 0) + 2 // 2 for reply primer
}

export function estimateCost(tokens: number): number {
  return tokens * 0.000002 // $2 per million tokens
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${(cost * 100).toFixed(4)}¢`
  return `$${cost.toFixed(4)}`
}
