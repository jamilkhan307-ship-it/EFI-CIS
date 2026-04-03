import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const r = {};

const tables = [
  'users', 'cir_records', 'form_config', 'system_settings',
  'section_access_overrides', 'audit_logs', 'form_change_logs',
  'master_customers', 'master_categories', 'master_packaging',
  'master_ppap_levels', 'master_materials', 'master_departments'
];

async function run() {
  r.url = SUPABASE_URL;
  r.tables = {};

  for (const t of tables) {
    const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    r.tables[t] = error ? { status: 'FAIL', error: error.message } : { status: 'OK', rows: count };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'nbd@emmforce.com', password: 'Jamil@650',
  });
  r.auth = signInError
    ? { status: 'FAIL', error: signInError.message }
    : { status: 'OK', email: signInData.user?.email, id: signInData.user?.id };

  const { data: usersData } = await supabase.from('users').select('name, email, role, is_active');
  r.users = usersData || [];

  writeFileSync('verify_results.json', JSON.stringify(r, null, 2), 'utf8');
}

run().catch(e => {
  r.fatal = e.message;
  writeFileSync('verify_results.json', JSON.stringify(r, null, 2), 'utf8');
});
