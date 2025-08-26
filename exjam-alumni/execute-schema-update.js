#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function executeSchemaUpdate() {
  console.log("🔧 Setting up Edge Functions database schema...\n");

  // Create service role client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Read the schema file
  const schemaSQL = fs.readFileSync("setup-edge-functions-schema.sql", "utf8");

  // Split into individual statements
  const statements = schemaSQL
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt && !stmt.startsWith("--") && stmt !== "");

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ";";

    // Skip comment-only statements
    if (statement.trim().startsWith("--") || statement.trim() === ";") {
      continue;
    }

    try {
      console.log(`${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);

      const { error } = await supabase.rpc("exec_sql", {
        query: statement,
      });

      if (error) {
        // Some errors are expected (like table already exists)
        if (
          error.message.includes("already exists") ||
          error.message.includes("relation") ||
          (error.message.includes("column") && error.message.includes("already exists"))
        ) {
          console.log(`   ⚠️  Warning: ${error.message}`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Schema Update Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⚠️  Note: "already exists" warnings are normal\n`);

  if (errorCount === 0) {
    console.log("🎉 Edge Functions schema setup complete!");
  } else {
    console.log("⚠️  Schema setup completed with some errors. Check above for details.");
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Schema update interrupted");
  process.exit(1);
});

executeSchemaUpdate().catch((error) => {
  console.error("❌ Schema update failed:", error);
  process.exit(1);
});
