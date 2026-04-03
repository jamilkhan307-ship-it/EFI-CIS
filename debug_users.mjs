import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debug() {
  console.log('Logging in as Admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nbd@emmforce.com',
    password: 'Jamil@650',
  });

  if (authError) {
    console.error('Admin login failed:', authError.message);
    return;
  }

  console.log('Fetching users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError) {
    console.error('Failed to fetch users:', usersError.message);
  } else {
    console.log(`Found ${users.length} users in table.`);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: [${u.email}], Name: [${u.name}], Role: ${u.role}`);
    });
  }
}

debug();
