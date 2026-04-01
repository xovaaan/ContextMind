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
  console.log(`Content:`, msg.content)
  console.log(`Reasoning:`, msg.reasoning)
}

async function run() {
  await test('google/gemini-2.0-flash-lite-preview-02-05:free')
  await test('deepseek/deepseek-chat:free')
  await test('deepseek/deepseek-r1:free')
  await test('qwen/qwen-2.5-coder-32b-instruct:free')
}
run()
