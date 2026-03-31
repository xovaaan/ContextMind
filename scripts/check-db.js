const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function checkExtension() {
  const envPath = path.resolve(process.cwd(), '.env');
  let databaseUrl;
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
  databaseUrl = match[1];

  const sql = neon(databaseUrl);
  
  try {
    const result = await sql`SELECT extname FROM pg_extension WHERE extname = 'vector';`;
    console.log('Extensions found:', result);
    
    // Also check if the type exists
    const typeResult = await sql`SELECT typname FROM pg_type WHERE typname = 'vector';`;
    console.log('Types found:', typeResult);
  } catch (err) {
    console.error('Error checking extension:', err.message);
  }
}

checkExtension();
