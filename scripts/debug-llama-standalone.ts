import fetch from 'node-fetch'
import * as dotenv from 'dotenv'

dotenv.config()

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct:free'

const CONTEXT = `
user: Hi, I need help debugging a memory leak in my Python service
assistant: Happy to help. Can you share the relevant code?
user: Sure. I'm using asyncio and aiohttp. The leak happens after ~1000 requests
assistant: That sounds like unclosed ClientSession objects. Are you creating a new session per request?
user: Yes I create a new aiohttp.ClientSession() in every handler. I'm a backend engineer with 8 years experience
`

async function debugExtraction() {
  console.log(`[debug] Testing extraction with model: ${MODEL}`)
  
  const prompt = `Extract only basic facts (name, location). Require 90%+ confidence.
Existing keys (update if better data): none

Valid keys: communication_style, expertise, preferences, values, decision_making, personality_traits, goals, pain_points, technical_level, language_style

Conversation context:
${CONTEXT}

Return ONLY a JSON array like: [{"key": "communication_style", "value": "...", "confidence": 85}]
No preamble, no explanation, pure JSON array.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ContextMind Debug',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a high-fidelity psychological profiling engine. Output ONLY a raw JSON array. If no traits found, return [].'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      })
    })

    const data: any = await response.json()
    const content = data.choices[0].message.content
    console.log('\n--- RAW LLM OUTPUT ---')
    console.log(content)
    console.log('----------------------\n')

    try {
      // Basic JSON isolation test
      const first = content.indexOf('[')
      const last = content.lastIndexOf(']')
      const json = content.substring(first, last + 1)
      const parsed = JSON.parse(json)
      console.log('[debug] Successfully parsed JSON array with', parsed.length, 'traits.')
      console.table(parsed)
    } catch (e) {
      console.error('[debug] Failed to parse JSON from output.')
    }
  } catch (err) {
    console.error('[debug] API Call failed:', err)
  }
}

debugExtraction()
