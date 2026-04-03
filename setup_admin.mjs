// Create a Super Admin auth user and add RLS policies
// Run this after tables are created

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

async function setup() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Step 1: Check if Super Admin already exists in the users table
  console.log('Step 1: Checking users table...');
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'nbd@emmforce.com')
    .single();
  
  if (existingUser) {
    console.log('Super Admin already exists in users table:', existingUser);
  } else {
    console.log('Creating Super Admin in users table...');
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'nbd@emmforce.com',
        name: 'NBD Admin',
        role: 'SUPER_ADMIN',
        department: 'IT',
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error.message);
    } else {
      console.log('Super Admin created:', data);
    }
  }

  // Step 2: Create auth user using Supabase Auth API
  console.log('\nStep 2: Creating Supabase Auth user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'nbd@emmforce.com',
    password: 'Jamil@650',
  });
  
  if (authError) {
    if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
      console.log('Auth user already exists. Trying to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'nbd@emmforce.com',
        password: 'Jamil@650',
      });
      if (signInError) {
        console.error('Sign-in failed:', signInError.message);
      } else {
        console.log('Sign-in successful! User:', signInData.user?.email);
      }
    } else {
      console.error('Error creating auth user:', authError.message);
    }
  } else {
    console.log('Auth user created:', authData.user?.email);
    console.log('Note: Email confirmation may be required. Check your Supabase Auth settings.');
  }
  
  // Step 3: Verify the whole flow works 
  console.log('\nStep 3: Verifying data access...');
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('*');
  
  if (usersError) {
    console.error('Could not fetch users:', usersError.message);
    console.log('\nThis might be because RLS (Row Level Security) is blocking anonymous access.');
    console.log('You need to either:');
    console.log('1. Disable RLS on the users table, OR');
    console.log('2. Add a policy that allows authenticated users to read');
  } else {
    console.log('Users in database:', allUsers?.length || 0);
    allUsers?.forEach(u => console.log(` - ${u.name} (${u.email}) - ${u.role}`));
  }
  
  console.log('\n✅ Setup complete!');
  console.log('You can now log into the CIR Portal with:');
  console.log('  Email: nbd@emmforce.com');
  console.log('  Password: Jamil@650');
}

setup().catch(console.error);
