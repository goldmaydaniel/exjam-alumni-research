#!/usr/bin/env node

const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function checkDatabaseTables() {
  console.log("🔍 Checking database schema...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Check what tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📋 Existing tables:");
    if (result.rows.length === 0) {
      console.log("❌ No tables found in public schema");
    } else {
      result.rows.forEach((row) => {
        console.log(`  • ${row.table_name}`);
      });
    }

    // Check for specific tables we need
    const requiredTables = ["users", "events", "registrations"];
    console.log("\n🎯 Required tables check:");

    const existingTableNames = result.rows.map((row) => row.table_name);

    for (const table of requiredTables) {
      if (existingTableNames.includes(table)) {
        console.log(`  ✅ ${table} - exists`);
      } else {
        console.log(`  ❌ ${table} - missing`);
      }
    }

    // Check if this is a fresh database that needs initial setup
    if (result.rows.length === 0 || !existingTableNames.includes("users")) {
      console.log("\n⚠️  This appears to be a fresh database that needs initial schema setup");
      console.log("🔧 You may need to run Prisma migrations first:");
      console.log("   npx prisma migrate dev");
      console.log("   or");
      console.log("   npx prisma db push");
    }
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

checkDatabaseTables().catch((error) => {
  console.error("❌ Database check failed:", error);
  process.exit(1);
});
