const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:Efi@jk65012@db.sscpfvgxuqwmrqpkbqwd.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({ connectionString });
  
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    
    console.log('Reading migration script...');
    const sqlPath = path.join(__dirname, 'supabase_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration script (this might take a moment)...');
    await client.query(sql);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
