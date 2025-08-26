#!/usr/bin/env node

/**
 * Direct test of login functionality
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

// Use service role for admin operations
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// Use anon key for normal operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log("🧪 Testing Login Functionality\n");

  const testEmail = "test@example.com";
  const testPassword = "TestPassword123!";

  try {
    // Step 1: Create a test user using admin client
    console.log("1️⃣ Creating test user...");
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        firstName: "Test",
        lastName: "User",
      },
    });

    if (createError) {
      if (createError.message.includes("already been registered")) {
        console.log("   ℹ️ User already exists, continuing with test...");
      } else {
        console.error("   ❌ Failed to create user:", createError.message);
        return;
      }
    } else {
      console.log("   ✅ Test user created");
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
    }

    // Step 2: Test login with the normal client
    console.log("\n2️⃣ Testing login...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error("   ❌ Login failed:", loginError.message);
      console.error("   Error code:", loginError.code);
      return;
    }

    console.log("   ✅ Login successful!");
    console.log(`   User ID: ${loginData.user?.id}`);
    console.log(`   Email: ${loginData.user?.email}`);
    console.log(`   Session: ${loginData.session ? "Created" : "Not created"}`);
    console.log(`   Access Token: ${loginData.session?.access_token ? "Present" : "Missing"}`);

    // Step 3: Test the API endpoint
    console.log("\n3️⃣ Testing API login endpoint...");
    const fetch = require("node-fetch");
    const response = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("   ✅ API login successful!");
      console.log(`   User: ${result.user?.firstName} ${result.user?.lastName}`);
      console.log(`   Has session: ${result.session ? "Yes" : "No"}`);
    } else {
      console.error("   ❌ API login failed:", result.error);
    }

    // Step 4: Test accessing protected route
    if (loginData.session) {
      console.log("\n4️⃣ Testing protected route access...");
      const protectedResponse = await fetch("http://localhost:3001/api/registrations", {
        headers: {
          Authorization: `Bearer ${loginData.session.access_token}`,
        },
      });

      if (protectedResponse.ok) {
        console.log("   ✅ Successfully accessed protected route");
      } else {
        console.log("   ❌ Failed to access protected route:", protectedResponse.status);
      }
    }

    console.log("\n========================================");
    console.log("📊 TEST SUMMARY");
    console.log("========================================");
    console.log("Test Credentials:");
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
    console.log("\nYou can now test the login page at:");
    console.log("  http://localhost:3001/login");
    console.log("\nUse the credentials above to log in.");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testLogin().catch(console.error);
