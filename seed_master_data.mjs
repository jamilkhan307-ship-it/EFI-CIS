import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sscpfvgxuqwmrqpkbqwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzY3Bmdmd4dXF3bXJxcGticXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0Nzc4MTEsImV4cCI6MjA4OTA1MzgxMX0.VjaVtaGdgTo5sOLFjeW6iOgmkFsPqgHqS5JgmftelwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'nbd@emmforce.com',
    password: 'Jamil@650',
  });
  if (authError) { console.error("Auth failed:", authError.message); return; }
  console.log("Authenticated. Seeding...\n");

  const seedTable = async (table, names) => {
    // Check existing
    const { data: existing } = await supabase.from(table).select('name');
    const existingNames = new Set((existing || []).map(r => r.name));
    const toInsert = names.filter(n => !existingNames.has(n)).map(n => ({ name: n, is_active: true }));
    
    if (toInsert.length === 0) {
      console.log(`  ${table}: all ${names.length} records already exist`);
      return;
    }
    
    const { error } = await supabase.from(table).insert(toInsert);
    if (error) {
      console.log(`  FAIL ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: inserted ${toInsert.length} records`);
    }
  };

  await seedTable("master_ppap_levels", ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]);
  await seedTable("master_categories", [
    "Propshaft Assembly", "CV Joint", "Clutch Assembly", "Differential Component",
    "Drive Axle", "Gear", "Bearing", "Seal", "Flange Yoke", "Slip Yoke"
  ]);
  await seedTable("master_packaging", [
    "Plastic Bin (Reusable)", "Wooden Pallet", "Corrugated Box",
    "VCI Bag + Carton", "Steel Rack", "Foam Packaging"
  ]);
  await seedTable("master_materials", [
    "ASTM A536 65-45-12", "SAE 1020", "SAE 4140",
    "Aluminum A356-T6", "Cast Iron EN-GJL-250", "SAE 8620",
    "AISI 1045", "EN8 Steel"
  ]);
  await seedTable("master_departments", [
    "IT", "Sales", "Quality", "Management", "Engineering", "Business Development", "Finance", "HR"
  ]);

  console.log("\n=== Verifying ===");
  for (const t of ['master_ppap_levels', 'master_categories', 'master_packaging', 'master_materials', 'master_departments', 'master_customers']) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t}: ${count} rows`);
  }

  console.log("\n=== Done ===");
  await supabase.auth.signOut();
}

seed().catch(e => console.error("Seed failed:", e));
