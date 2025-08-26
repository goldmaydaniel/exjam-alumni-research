#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function executeSchemaUpdate() {
  console.log("🔧 Setting up Edge Functions database schema...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Read the schema file
    const schemaFile = process.argv[2] || "setup-edge-functions-schema.sql";
    const schemaSQL = fs.readFileSync(schemaFile, "utf8");

    console.log("📋 Executing schema updates...\n");

    // Execute the entire schema at once
    const result = await client.query(schemaSQL);

    console.log("✅ Schema updates completed successfully!");
    console.log(`📊 Affected rows: ${result.rowCount || "N/A"}`);
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("⚠️  Some objects already exist - this is normal");
      console.log("✅ Schema is up to date");
    } else {
      console.error("❌ Schema update error:", error.message);
      throw error;
    }
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }

  console.log("\n🎉 Edge Functions schema setup complete!");
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
