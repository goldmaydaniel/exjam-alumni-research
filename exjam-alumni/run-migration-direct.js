const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!connectionString) {
    console.error("❌ No DATABASE_URL found in environment");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  console.log("   URL:", connectionString.replace(/:[^:@]+@/, ":****@")); // Hide password

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database\n");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "exjam-alumni/supabase/migrations/20250125_create_users_and_alumni.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the entire migration as one transaction
    console.log("🚀 Running alumni directory migration...\n");

    await client.query("BEGIN");

    try {
      await client.query(migrationSQL);
      await client.query("COMMIT");
      console.log("✅ Migration completed successfully!\n");

      // Check what was created
      const tables = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'alumni%'
      `);

      console.log("📊 Created tables:");
      tables.rows.forEach((row) => {
        console.log(`   - ${row.tablename}`);
      });

      console.log("\n🎉 Alumni Directory is ready!");
      console.log("\nNext steps:");
      console.log("1. Register a new user with squadron selection");
      console.log("2. Navigate to /alumni to see the directory");
      console.log("3. Test connection requests between alumni\n");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Migration failed:", error.message);

      // If it's a "already exists" error, try to check what exists
      if (error.message.includes("already exists")) {
        console.log("\n⚠️  Some objects already exist. Checking current state...\n");

        const tables = await client.query(`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename LIKE 'alumni%'
        `);

        if (tables.rows.length > 0) {
          console.log("📊 Existing alumni tables:");
          tables.rows.forEach((row) => {
            console.log(`   - ${row.tablename}`);
          });
          console.log("\n✅ Alumni directory tables already exist!");
        }
      }
    }
  } catch (error) {
    console.error("❌ Connection error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Disconnected from database");
  }
}

runMigration().catch(console.error);
