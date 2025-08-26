#!/usr/bin/env node

const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function checkUserTableStructure() {
  console.log("🔍 Checking User table structure...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Check User table structure
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 User table columns:");
    if (result.rows.length === 0) {
      console.log("❌ User table not found or has no columns");
    } else {
      console.log("Column Name\t\tData Type\tNullable\tDefault");
      console.log("─".repeat(60));
      result.rows.forEach((row) => {
        console.log(
          `${row.column_name.padEnd(20)}\t${row.data_type.padEnd(15)}\t${row.is_nullable}\t${row.column_default || "NULL"}`
        );
      });
    }

    // Also check Registration table
    const regResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'Registration' 
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Registration table columns:");
    if (regResult.rows.length === 0) {
      console.log("❌ Registration table not found or has no columns");
    } else {
      console.log("Column Name\t\tData Type\tNullable\tDefault");
      console.log("─".repeat(60));
      regResult.rows.forEach((row) => {
        console.log(
          `${row.column_name.padEnd(20)}\t${row.data_type.padEnd(15)}\t${row.is_nullable}\t${row.column_default || "NULL"}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

checkUserTableStructure().catch((error) => {
  console.error("❌ Database check failed:", error);
  process.exit(1);
});
