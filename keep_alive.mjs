const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase credentials in process.env.");
  process.exit(1);
}

async function keepAlive() {
  console.log("Pinging Supabase to prevent project pause...");
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cir_records?select=cir_number&limit=1`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.error("Ping failed with status:", response.status);
      process.exit(1);
    }
    
    console.log("Ping successful! Supabase project is awake.");
    process.exit(0);
  } catch (error) {
    console.error("Unexpected error during ping:", error);
    process.exit(1);
  }
}

keepAlive();
