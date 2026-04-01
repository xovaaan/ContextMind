require('dotenv').config()
const APP_URL = 'http://localhost:3000'
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = process.env.OPENROUTER_API_KEY

async function callLLM(model) {
  const body = {
    model: model,
    messages: [
      { role: 'user', content: 'Say hello in valid JSON format: {"hello": "world"}' }
    ],
    temperature: 0.1,
    max_tokens: 100,
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': APP_URL,
      'X-Title': 'ContextMind',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error(`Error for ${model}: ${response.status} - ${err.substring(0, 100)}`)
    return
  }
  const data = await response.json()
  console.log(`Success for ${model}:`, data.choices?.[0]?.message?.content)
}

const models = [
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-nemo:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'minimax/minimax-m2.5:free'
]

async function run() {
  for (const m of models) {
    await callLLM(m)
    await new Promise(r => setTimeout(r, 1000))
  }
}
run()
