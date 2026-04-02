import { extractRepresentations } from '../src/lib/ai/openrouter'
import dotenv from 'dotenv'

dotenv.config()

const CONTEXT = `
user: Hi, I'm a senior backend engineer with 8 years of experience. I specialize in Python and Kubernetes.
assistant: Nice to meet you! What kind of help do you need today?
user: I prefer concise communication and direct code examples. I'm currently working on a cost-sensitive project using Terraform.
`

async function main() {
  console.log('--- Testing Extraction with Llama 3.1 70B ---')
  console.log('Model:', process.env.OPENROUTER_MODEL)
  
  try {
    const existingKeys: string[] = []
    const reasoningLevel = 'medium'
    
    console.log('Prompting LLM...')
    const result = await extractRepresentations(CONTEXT, existingKeys, reasoningLevel)
    
    console.log('--- Results ---')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.length === 0) {
      console.log('FAILED: No representations extracted.')
    } else {
      console.log(`SUCCESS: Extracted ${result.length} representations.`)
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err)
  }
}

main()
