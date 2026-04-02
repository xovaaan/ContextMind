import { ContextMind, AuthError } from './sdk/typescript/contextmind'

async function testSDK() {
  console.log('--- Testing ContextMind TypeScript SDK (v1) ---')
  
  const cm = new ContextMind({
    apiKey: 'ctxmind_test123456789012345678901234567890',
    baseUrl: 'http://localhost:3000',
    timeout: 5000
  })

  try {
    console.log('Testing cm.peers.list()...')
    await cm.peers.list()
    console.log('✅ Success! (Wait, how? Did you use a real key?)')
  } catch (err) {
    if (err instanceof AuthError) {
      console.log('✅ SDK correctly caught AuthError!')
      console.log('   Status:', err.statusCode)
      console.log('   Hint:', err.hint)
      console.log('   Message:', err.message)
      
      // If we got here, it means the SDK successfully hit the endpoint and parsed the JSON error
      if (err.statusCode === 401 || err.statusCode === 403) {
        console.log('\nSUCCESS: The SDK successfully reached the v1 API and handled the response.')
      }
    } else {
      console.error('❌ Unexpected error:', err)
    }
  }
}

testSDK()
