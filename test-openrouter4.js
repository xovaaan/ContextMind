const APP_URL = 'http://localhost:3000'
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = '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'

async function callLLM(model) {
  const body = {
    model: model,
    messages: [
      { role: 'user', content: 'Say hello in valid JSON format: [{"key": "hi", "value": "world", "confidence": 100}]' }
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
  'google/gemini-2.0-pro-exp-02-05:free',
  'google/gemini-2.0-flash-thinking-exp:free',
  'google/gemini-2.0-flash-thinking-exp-1219:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-chat:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free'
]

async function run() {
  for (const m of models) {
    await callLLM(m)
    await new Promise(r => setTimeout(r, 1000))
  }
}
run()
