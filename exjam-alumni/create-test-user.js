#!/usr/bin/env node

/**
 * Create a test user for login testing
 */

const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

// Use service role for admin operations
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
  console.log("🧪 Creating Test User for Login\n");

  const testEmail = "demo@exjamalumni.org";
  const testPassword = "Demo123456!";

  try {
    // Step 1: Check if user exists and delete if so
    console.log("1️⃣ Checking for existing user...");
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === testEmail);

    if (existingUser) {
      console.log("   Found existing user, deleting...");
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error("   ❌ Failed to delete user:", deleteError.message);
        return;
      }
      console.log("   ✅ Existing user deleted");
    }

    // Step 2: Create new test user
    console.log("\n2️⃣ Creating new test user...");
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        firstName: "Demo",
        lastName: "User",
        role: "USER",
      },
    });

    if (createError) {
      console.error("   ❌ Failed to create user:", createError.message);
      return;
    }

    console.log("   ✅ Test user created successfully");
    console.log(`   User ID: ${createData.user.id}`);

    // Step 3: Create corresponding User table entry
    console.log("\n3️⃣ Creating User table entry...");
    const { error: userTableError } = await adminClient.from("User").insert({
      id: createData.user.id,
      email: testEmail,
      firstName: "Demo",
      lastName: "User",
      role: "USER",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userTableError) {
      console.log("   ⚠️ User table insert failed:", userTableError.message);
      console.log("   (This is okay if the user already exists in the table)");
    } else {
      console.log("   ✅ User table entry created");
    }

    // Step 4: Test login
    console.log("\n4️⃣ Testing login with created user...");
    const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: loginData, error: loginError } = await normalClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.error("   ❌ Login test failed:", loginError.message);
    } else {
      console.log("   ✅ Login test successful!");
      console.log(`   Session created: ${loginData.session ? "Yes" : "No"}`);
    }

    console.log("\n========================================");
    console.log("✅ TEST USER CREATED SUCCESSFULLY");
    console.log("========================================");
    console.log("Login Credentials:");
    console.log(`  📧 Email: ${testEmail}`);
    console.log(`  🔐 Password: ${testPassword}`);
    console.log("\n📍 Login Page:");
    console.log("  http://localhost:3001/login");
    console.log("\nYou can now use these credentials to test the login page!");
  } catch (error) {
    console.error("❌ Failed to create test user:", error);
  }
}

createTestUser().catch(console.error);
