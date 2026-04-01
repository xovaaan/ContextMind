require('dotenv').config()
const APP_URL = 'http://localhost:3000'
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = process.env.OPENROUTER_API_KEY

async function callLLM(model) {
  const body = {
    model: model,
    messages: [
      { role: 'system', content: 'You are a psychological profiling engine. Output JSON.' },
      { role: 'user', content: 'Extract behavioral patterns from: "I like python and kubernetes". Return only JSON array.' }
    ],
    temperature: 0.3,
    max_tokens: 2000,
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
    console.error(`Error for ${model}: ${response.status} - ${err}`)
    return
  }

  const data = await response.json()
  console.log(`Success for ${model}:`, data.choices?.[0]?.message?.content)
}

callLLM('meta-llama/llama-3.3-70b-instruct:free').then(() => {
  callLLM('google/gemini-2.0-flash-lite-preview-02-05:free')
})
