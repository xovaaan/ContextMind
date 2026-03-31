const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Starting NeonDB Setup...');
  
  // Read .env file directly to avoid dependency on 'dotenv'
  const envPath = path.resolve(process.cwd(), '.env');
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
    if (match) {
      databaseUrl = match[1];
    }
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env or environment.');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  
  try {
    console.log('--- Enabling pgvector extension ---');
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ Success! pgvector extension is now enabled.');
    
    console.log('\nNext Step: Run "npm run db:push" to synchronize your schema.');
  } catch (err) {
    console.error('❌ Error during setup:', err.message);
    if (err.message.includes('permission denied')) {
        console.log('\nTIP: In Neon, you may need to go to the Dashboard > SQL Editor and run this manually.');
    }
  }
}

setupDatabase();
