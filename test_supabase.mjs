import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("=== SUPABASE CONNECTIVITY TEST ===");
  
  // 1. Test basic connection
  console.log("\n1. Testing basic connectivity...");
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, email, name, role, is_active")
    .limit(10);
  
  if (usersError) {
    console.log("   FAIL: Cannot query users table:", usersError.message);
  } else {
    console.log("   OK: Users table accessible. Found", usersData.length, "users:");
    usersData.forEach(u => console.log("       -", u.email, "|", u.role, "|", u.name, "| active:", u.is_active));
  }

  // 2. Test auth
  console.log("\n2. Testing authentication...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nbd@emmforce.com',
    password: 'Jamil@650',
  });
  
  if (authError) {
    console.log("   FAIL: Auth error:", authError.message);
  } else {
    console.log("   OK: Authenticated as", authData.user.email, "| Auth UID:", authData.user.id);
  }

  // 3. Check if the auth user's email exists in the users table
  if (authData?.user?.email) {
    console.log("\n3. Checking profile match...");
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", authData.user.email)
      .single();
    
    if (profileError) {
      console.log("   FAIL: Profile lookup error:", profileError.message);
      console.log("   This is the ROOT CAUSE of the hanging! The user authenticates via Supabase Auth but has no matching row in the 'users' table.");
    } else {
      console.log("   OK: Profile found:", profile.name, "|", profile.role, "| Active:", profile.is_active);
    }
  }

  // 4. Test other tables
  console.log("\n4. Testing other tables...");
  const tables = ['cir_records', 'master_customers', 'master_categories', 'form_config', 'audit_logs'];
  for (const t of tables) {
    const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log("  ", error ? `FAIL ${t}: ${error.message}` : `OK ${t}: ${count} rows`);
  }

  console.log("\n=== TEST COMPLETE ===");
  await supabase.auth.signOut();
}

test().catch(e => console.error("Test failed:", e));
