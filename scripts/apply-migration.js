const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('--- Manually applying Drizzle migration (with vector fixes) ---');
  
  const envPath = path.resolve(process.cwd(), '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?(.*?)["']?$/m);
  const databaseUrl = match[1];
  const sql = neon(databaseUrl);

  const migrationPath = path.resolve(process.cwd(), 'drizzle/0000_rich_excalibur.sql');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Split statements by drizzle-kit breakpoint or standard semicolons
  const statements = migrationContent.split(/-->\s*statement-breakpoint/);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let statement of statements) {
    statement = statement.trim();
    if (!statement) continue;
    
    // Safety check: Replace "vector(1536)" with vector(1536) in case the file wasn't fully cleaned
    const cleanStatement = statement.replace(/"vector\((\d+)\)"/g, 'vector($1)');
    
    try {
      await sql(`${cleanStatement}`);
      successCount++;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          skipCount++;
      } else {
          console.error('❌ Error executing statement:', err.message);
          console.error('Failed snippet:', cleanStatement.substring(0, 100) + '...');
          failCount++;
      }
    }
  }
  
  console.log(`\n✅ Migration summary: ${successCount} applied, ${skipCount} skipped, ${failCount} failed.`);
  if (failCount > 0) {
      process.exit(1);
  }
}

applyMigration();
