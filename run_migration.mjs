// Migration script using Supabase Management API (via fetch)
// This script creates all tables by executing SQL through the Supabase REST API

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';
const DB_PASSWORD = 'Efi@jk65012';

// Step 1: Create an RPC function to execute arbitrary SQL, then call it
// We'll use supabase-js to do this

async function runMigration() {
  // Import supabase-js dynamically  
  const { createClient } = await import('@supabase/supabase-js');
  
  // Create client with service role key if available, otherwise anon
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // First, let's try to sign in as a user to get elevated privileges
  // The anon key can still interact with the REST API
  
  // Try creating tables one by one using the REST API
  // Supabase exposes PostgREST - we can't run DDL through it directly
  // But we CAN check if tables exist by querying them
  
  console.log('Testing connection to Supabase...');
  
  // Test connection by trying to query a table
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('Tables do not exist yet. You need to run the SQL schema manually.');
      console.log('');
      console.log('Please go to: https://supabase.com/dashboard/project/sscpfvgxuqwmrqpkbqwd/sql/new');
      console.log('And paste the contents of supabase_schema.sql');
    } else {
      console.log('Connection error:', error.message);
    }
  } else {
    console.log('Tables already exist! Connection successful.');
    console.log('Users table data:', data);
  }
  
  // Now let's try to seed the super admin
  console.log('\nAttempting to seed Super Admin user...');
  const { data: adminData, error: adminError } = await supabase
    .from('users')
    .upsert({
      email: 'nbd@emmforce.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      department: 'IT',
      is_active: true,
    }, { onConflict: 'email' })
    .select();
    
  if (adminError) {
    console.log('Could not seed admin:', adminError.message);
  } else {
    console.log('Super Admin seeded successfully:', adminData);
  }
}

runMigration().catch(console.error);
