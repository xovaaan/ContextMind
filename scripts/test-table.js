const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function testTableCreation() {
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
  const databaseUrl = match[1];

  const sql = neon(databaseUrl);
  
  try {
    console.log('--- Attempting raw table creation with vector type ---');
    await sql`CREATE TABLE IF NOT EXISTS temp_vector_test (id serial primary key, val vector(1536));`;
    console.log('✅ Manual table creation succeeded!');
    
    // Cleanup
    await sql`DROP TABLE temp_vector_test;`;
    console.log('✅ Cleanup succeeded.');
  } catch (err) {
    console.error('❌ Manual table creation failed:', err.message);
    if (err.message.includes('type "vector" does not exist')) {
        console.log('--- Re-Enabling pgvector extension as final attempt ---');
        await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
        console.log('--- Re-tried enabling extension ---');
        await sql`CREATE TABLE IF NOT EXISTS temp_vector_test (id serial primary key, val vector(1536));`;
        console.log('✅ Re-manual table creation succeeded!');
    }
  }
}

testTableCreation();
