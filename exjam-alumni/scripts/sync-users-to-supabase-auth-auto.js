#!/usr/bin/env node

/**
 * User Sync Script for Supabase Auth (Automatic Mode)
 *
 * This script syncs existing users from the User table to Supabase Auth
 * It creates auth accounts for users who don't have them yet
 *
 * Run: node scripts/sync-users-to-supabase-auth-auto.js
 */

const { createClient } = require("@supabase/supabase-js");

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

async function syncUsers() {
  console.log("🔄 Starting User Sync to Supabase Auth (Automatic Mode)...\n");

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
      skipped: 0,
    };

    const usersNeedingAuth = [];

    for (const user of users) {
      // Check if user exists in auth by trying to get them by email
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(user.id);

      if (authData?.user) {
        stats.alreadyInAuth++;
        console.log(`✅ ${user.email} - Already in Supabase Auth`);
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

    // Step 3: Create auth accounts for the first 3 users as a test
    console.log("\n🚀 Creating Supabase Auth accounts (TEST MODE - First 3 only)...\n");

    const usersToSync = usersNeedingAuth.slice(0, 3); // Only sync first 3 as test
    console.log(`   Will create auth for: ${usersToSync.map((u) => u.email).join(", ")}\n`);

    for (const user of usersToSync) {
      try {
        // Generate a temporary password
        const tempPassword = `Temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;

        console.log(`Creating auth account for ${user.email}...`);

        // Create the auth user
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
          console.log(`   📝 Temp password: ${tempPassword}`);

          // Update User table with the auth ID if different
          if (authData.user.id !== user.id) {
            console.log(`   ⚠️  Auth ID differs from User table ID`);
            console.log(`      Updating User table to use Auth ID: ${authData.user.id}`);

            // Update the User record to use the Auth ID
            const { error: updateError } = await supabase
              .from("User")
              .update({ authId: authData.user.id })
              .eq("id", user.id);

            if (updateError) {
              console.log(`      ❌ Failed to update User table: ${updateError.message}`);
            } else {
              console.log(`      ✅ Updated User table with auth ID`);
            }
          }

          stats.synced++;
        }
      } catch (error) {
        console.error(`   ❌ Error creating auth for ${user.email}:`, error.message);
        stats.failed++;
      }
    }

    stats.skipped = usersNeedingAuth.length - usersToSync.length;

    // Step 4: Final report
    console.log("\n========================================");
    console.log("📊 SYNC COMPLETE (TEST MODE)");
    console.log("========================================");
    console.log(`✅ Successfully synced: ${stats.synced} users`);
    console.log(`⏭️  Skipped (test mode): ${stats.skipped} users`);
    console.log(`❌ Failed: ${stats.failed} users`);
    console.log(`📝 Already had auth: ${stats.alreadyInAuth} users`);
    console.log(`📊 Total processed: ${stats.total} users`);
    console.log("\n⚠️  Important Notes:");
    console.log("1. This was a TEST RUN - only first 3 users were synced");
    console.log("2. Users created with temporary passwords shown above");
    console.log("3. Users will need to reset passwords for production use");
    console.log("4. To sync all users, modify the script to remove the limit");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  }
}

// Run the sync
syncUsers().catch(console.error);
