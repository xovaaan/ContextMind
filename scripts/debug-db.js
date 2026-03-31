const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function debugSchema() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
  const databaseUrl = match[1];

  const sql = neon(databaseUrl);
  
  try {
    const searchPath = await sql`SHOW search_path;`;
    console.log('Search path:', searchPath);
    
    const extensionSchema = await sql`SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'vector';`;
    console.log('Extension schema:', extensionSchema);
    
    const typeSchema = await sql`SELECT n.nspname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'vector';`;
    console.log('Type schema:', typeSchema);
  } catch (err) {
    console.error('Error debugging schema:', err.message);
  }
}

debugSchema();
