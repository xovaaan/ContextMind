require('dotenv').config()
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = process.env.OPENROUTER_API_KEY

const prompt = `Extract standard behavioral patterns and preferences. Require 70%+ confidence.
Existing keys (update if better data): none

Valid keys: communication_style, expertise, preferences, values, decision_making, personality_traits, goals, pain_points, technical_level, language_style

Conversation context:
user: I love Python and hate JavaScript. I work in ML and prefer reading docs over asking for help.

Return ONLY a JSON array like: [{"key": "communication_style", "value": "...", "confidence": 85}]
No preamble, no explanation, pure JSON array.`

async function test(model) {
  const body = {
    model,
    messages: [
      { role: 'system', content: 'You are a psychological profiling engine. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 1000,
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      console.log(`FAIL: ${model} - ${response.status} - ${err.substring(0,60)}`)
      return
    }
    const data = await response.json()
    const msg = data.choices[0].message
    const content = msg.content || msg.reasoning || ''
    const match = content.match(/\[[\s\S]*\]/)
    if (match) {
      console.log(`✓ PASS: ${model}`)
      console.log(`  Result:`, match[0].substring(0, 120))
    } else {
      console.log(`? EMPTY: ${model} - content was: ${content.substring(0, 80)}`)
    }
  } catch(e) {
    console.log(`ERR: ${model} - ${e.message}`)
  }
}

const candidates = [
  'google/gemma-3-4b-it:free',
  'google/gemma-3n-e2b-it:free',
  'google/gemma-3n-e4b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'arcee-ai/trinity-mini:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'z-ai/glm-4.5-air:free',
]

async function run() {
  for (const m of candidates) {
    await test(m)
    await new Promise(r => setTimeout(r, 800))
  }
}
run()
