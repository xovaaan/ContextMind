import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function setupDatabase() {
  console.log('🚀 Starting NeonDB Setup...');
  
  try {
    console.log('--- Enabling pgvector extension ---');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ Success! pgvector extension is now enabled.');
    
    console.log('\nNext Step: run "npm run db:push" to synchronize your schema.');
  } catch (err: any) {
    console.error('❌ Error during setup:', err.message);
    if (err.message.includes('permission denied')) {
        console.log('\nTIP: In Neon, you may need to go to the Dashboard > SQL Editor and run this manually.');
    }
  }
}

setupDatabase();
