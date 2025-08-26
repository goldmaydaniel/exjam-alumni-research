#!/usr/bin/env node

/**
 * User Sync Script for Supabase Auth
 *
 * This script syncs existing users from the User table to Supabase Auth
 * It creates auth accounts for users who don't have them yet
 *
 * Run: node scripts/sync-users-to-supabase-auth.js
 */

const { createClient } = require("@supabase/supabase-js");
const readline = require("readline");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function syncUsers() {
  console.log("🔄 Starting User Sync to Supabase Auth...\n");

  try {
    // Step 1: Get all users from User table
    console.log("📊 Fetching users from User table...");
    const { data: users, error: fetchError } = await supabase
      .from("User")
      .select("*")
      .order("createdAt", { ascending: true });

    if (fetchError) {
      console.error("❌ Failed to fetch users:", fetchError);
      return;
    }

    console.log(`✅ Found ${users.length} users in User table\n`);

    // Step 2: Check which users already exist in Supabase Auth
    console.log("🔍 Checking Supabase Auth status for each user...\n");

    const stats = {
      total: users.length,
      alreadyInAuth: 0,
      needsAuth: 0,
      synced: 0,
      failed: 0,
    };

    const usersNeedingAuth = [];

    for (const user of users) {
      // Check if user exists in auth
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find((u) => u.email === user.email);

      if (authUser) {
        stats.alreadyInAuth++;
        console.log(`✅ ${user.email} - Already in Supabase Auth (ID: ${authUser.id})`);

        // Check if IDs match
        if (authUser.id !== user.id) {
          console.log(`   ⚠️  Warning: ID mismatch! User table: ${user.id}, Auth: ${authUser.id}`);
        }
      } else {
        stats.needsAuth++;
        usersNeedingAuth.push(user);
        console.log(`❌ ${user.email} - Not in Supabase Auth`);
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Already in Auth: ${stats.alreadyInAuth}`);
    console.log(`   Need Auth account: ${stats.needsAuth}`);

    if (stats.needsAuth === 0) {
      console.log("\n✅ All users already have Supabase Auth accounts!");
      return;
    }

    // Step 3: Ask for confirmation to create auth accounts
    console.log("\n⚠️  The following users need Supabase Auth accounts:");
    usersNeedingAuth.forEach((user) => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
    });

    const answer = await question(
      "\nDo you want to create Supabase Auth accounts for these users? (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Sync cancelled");
      return;
    }

    // Step 4: Create auth accounts for users who need them
    console.log("\n🚀 Creating Supabase Auth accounts...\n");

    for (const user of usersNeedingAuth) {
      try {
        // Generate a temporary password
        const tempPassword = `Temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;

        console.log(`Creating auth account for ${user.email}...`);

        // Create the auth user with the same ID as in User table
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: tempPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            syncedFromUserTable: true,
            syncedAt: new Date().toISOString(),
          },
        });

        if (authError) {
          console.error(`   ❌ Failed: ${authError.message}`);
          stats.failed++;
        } else {
          console.log(`   ✅ Created auth account (ID: ${authData.user.id})`);

          // Update User table with the auth ID if different
          if (authData.user.id !== user.id) {
            console.log(
              `   ⚠️  Note: Auth ID (${authData.user.id}) differs from User table ID (${user.id})`
            );
            // You might want to update the User table ID here or handle this mapping
          }

          stats.synced++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating auth for ${user.email}:`, error.message);
        stats.failed++;
      }
    }

    // Step 5: Final report
    console.log("\n========================================");
    console.log("📊 SYNC COMPLETE");
    console.log("========================================");
    console.log(`✅ Successfully synced: ${stats.synced} users`);
    console.log(`❌ Failed: ${stats.failed} users`);
    console.log(`📝 Already had auth: ${stats.alreadyInAuth} users`);
    console.log(`📊 Total processed: ${stats.total} users`);
    console.log("\n⚠️  Important Notes:");
    console.log("1. Users created with temporary passwords will need to reset their passwords");
    console.log("2. Send password reset emails to newly created users");
    console.log("3. Check any ID mismatches between User table and Auth");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    rl.close();
  }
}

// Run the sync
syncUsers().catch(console.error);
