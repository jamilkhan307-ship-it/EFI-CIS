const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({ 
    host: 'aws-0-ap-south-1.pooler.supabase.com', // Mumbai pooler
    port: 6543, // Transaction pooler
    user: 'postgres.sscpfvgxuqwmrqpkbqwd', // pooler requires user.project_ref
    password: 'Efi@jk65012', // No URL encoding needed here
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting to Supabase via IPv4 session pooler (explicit config)...');
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
    try { await client.end(); } catch (e) {}
  }
}

runMigration();
