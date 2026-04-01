require('dotenv').config()
const BASE_URL = 'https://openrouter.ai/api/v1'
const apiKey = process.env.OPENROUTER_API_KEY

async function test(model) {
  const body = {
    model: model,
    messages: [{ role: 'user', content: 'Say hello in valid JSON format: [{"key": "hi", "value": "world", "confidence": 100}]' }],
    temperature: 0.1, max_tokens: 100,
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.log(`Failed: ${model} - ${response.status}`)
    return
  }
  const data = await response.json()
  const msg = data.choices[0].message
  console.log(`Success: ${model}`)
  if (msg.content) console.log(`Content:`, msg.content)
}

async function run() {
  await test('google/gemma-2-9b-it:free')
  await test('meta-llama/llama-3.1-8b-instruct:free')
  await test('mistralai/mistral-7b-instruct:free')
  await test('HuggingFaceH4/zephyr-7b-beta:free')
  await test('microsoft/phi-3-mini-128k-instruct:free')
}
run()
