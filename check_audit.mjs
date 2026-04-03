import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://sscpfvgxuqwmrqpkbqwd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA');

async function check() {
  const { error: ae } = await supabase.auth.signInWithPassword({ email: 'nbd@emmforce.com', password: 'Jamil@650' });
  if (ae) { console.log("Auth error:", ae.message); return; }
  console.log("Authenticated.\n");

  // Test 1: Simple insert with minimal data
  console.log("--- Test 1: Minimal insert ---");
  const { data: d1, error: e1 } = await supabase.from("audit_logs").insert({ action: "TEST" }).select();
  console.log("Error:", e1?.message || "none", e1?.code, e1?.details);
  console.log("Data:", JSON.stringify(d1));

  // Test 2: Insert with all columns from the AuditLogs page interface
  console.log("\n--- Test 2: Full insert ---");
  const { data: d2, error: e2 } = await supabase.from("audit_logs").insert({
    action: "STATUS_CHANGE",
    entity: "CIR-2026-1482",
    user_name: "Super Admin",
    user_role: "SUPER_ADMIN",
    details: "CIR status changed from SUBMITTED to CHECKED",
    timestamp: new Date().toISOString(),
  }).select();
  console.log("Error:", e2?.message || "none", e2?.code, e2?.details);
  console.log("Data:", JSON.stringify(d2));

  // Test 3: Check what columns exist
  console.log("\n--- Test 3: Checking table with empty select ---");
  const { data: d3, error: e3 } = await supabase.from("audit_logs").select("*").limit(5);
  console.log("Error:", e3?.message || "none");
  console.log("Count:", d3?.length);
  if (d3?.length) console.log("Columns:", Object.keys(d3[0]));

  await supabase.auth.signOut();
}
check();
