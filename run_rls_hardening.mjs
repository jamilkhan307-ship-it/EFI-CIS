import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const results = [];
  
  // First sign in to get authenticated access
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nbd@emmforce.com', password: 'Jamil@650',
  });
  
  if (authError) {
    results.push('[FAIL] Auth: ' + authError.message);
    writeFileSync('rls_results.json', JSON.stringify({ results }, null, 2), 'utf8');
    return;
  }
  results.push('[OK] Authenticated as ' + authData.user.email);

  // Read the SQL file
  const sql = readFileSync('supabase_rls_security.sql', 'utf8');
  
  // Execute via Supabase RPC (requires admin access via SQL editor)
  // Since we can't run raw SQL via the client, we'll use the REST API
  const response = await fetch(SUPABASE_URL + '/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + authData.session.access_token,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (response.ok) {
    results.push('[OK] SQL executed successfully');
  } else {
    const errText = await response.text();
    results.push('[INFO] SQL cannot be run via REST API (expected). You need to run supabase_rls_security.sql in the Supabase SQL Editor manually.');
    results.push('[INFO] Response: ' + response.status + ' ' + errText.substring(0, 200));
  }

  // Test that authenticated access still works
  results.push('--- Verifying authenticated access works ---');
  const tables = ['users', 'cir_records', 'master_customers', 'audit_logs', 'form_config'];
  for (const t of tables) {
    const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    results.push(error ? '[FAIL] ' + t + ': ' + error.message : '[OK] ' + t + ': ' + count + ' rows');
  }

  writeFileSync('rls_results.json', JSON.stringify({ results }, null, 2), 'utf8');
}

run().catch(e => {
  writeFileSync('rls_results.json', JSON.stringify({ error: e.message }, null, 2), 'utf8');
});
