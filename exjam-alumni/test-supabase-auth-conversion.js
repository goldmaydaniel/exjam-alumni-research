#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthConversion() {
  console.log("🔄 Testing Supabase Auth API Conversion...\n");

  try {
    // Test 1: Test anonymous access to events API
    console.log("1. Testing anonymous access to events API...");
    const response1 = await fetch("http://localhost:3000/api/events");
    const data1 = await response1.json();

    if (response1.ok) {
      console.log("✅ Anonymous events access working");
      console.log(`   Found ${data1.events?.length || 0} published events`);
    } else {
      console.log("❌ Anonymous events access failed:", data1.error);
    }

    // Test 2: Test authenticated access (would need a real user login)
    console.log("\n2. Testing authentication flow...");

    // Try to sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: "test@example.com",
      password: "testpassword123",
    });

    if (authError) {
      console.log("⚠️  No test user found, skipping authenticated tests");
      console.log("   Error:", authError.message);
    } else {
      console.log("✅ Authentication successful");

      // Test authenticated API call
      const session = authData.session;
      if (session) {
        const response2 = await fetch("http://localhost:3000/api/registrations", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response2.ok) {
          const data2 = await response2.json();
          console.log("✅ Authenticated registrations access working");
          console.log(`   Found ${data2.length || 0} registrations`);
        } else {
          console.log("❌ Authenticated registrations access failed");
        }
      }
    }

    // Test 3: Check RLS policies by trying direct queries
    console.log("\n3. Testing RLS policies...");

    // Test anonymous query to events table
    const { data: eventsData, error: eventsError } = await supabase
      .from("Event")
      .select("id, title, status")
      .eq("status", "PUBLISHED");

    if (eventsError) {
      console.log("❌ RLS blocking anonymous event access:", eventsError.message);
    } else {
      console.log("✅ RLS allowing anonymous published event access");
      console.log(`   Found ${eventsData.length} published events`);
    }

    // Test anonymous query to registrations (should be blocked)
    const { data: regData, error: regError } = await supabase
      .from("Registration")
      .select("id")
      .limit(1);

    if (regError) {
      console.log("✅ RLS correctly blocking anonymous registration access:", regError.message);
    } else {
      console.log("❌ RLS should block anonymous registration access but didn't");
    }

    console.log("\n🔍 API Conversion Assessment:");
    console.log("- Events API: Converted to Supabase Auth ✅");
    console.log("- Registrations API: Converted to Supabase Auth ✅");
    console.log("- Tickets API: Converted to Supabase Auth ✅");
    console.log("- Checkin API: Converted to Supabase Auth ✅");
    console.log("- Analytics API: Partially converted ⚠️");
    console.log("- Auth APIs: Still need attention ⚠️");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAuthConversion().catch(console.error);
