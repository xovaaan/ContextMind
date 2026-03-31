const APP_URL = 'http://localhost:3000'
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = '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'

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
