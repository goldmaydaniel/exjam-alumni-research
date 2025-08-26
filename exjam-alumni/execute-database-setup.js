const { execSync } = require("child_process");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

console.log("🚀 ExJAM Alumni Database Setup via CLI");
console.log("====================================\n");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

console.log("📊 Database URL:", DATABASE_URL.replace(/:([^:@]{8})[^:@]*@/, ":$1***@"));

// Read the corrected SQL file
const sqlFile = "CORRECTED_DATABASE_SETUP.sql";
if (!fs.existsSync(sqlFile)) {
  console.error(`❌ SQL file not found: ${sqlFile}`);
  process.exit(1);
}

console.log(`📄 Reading SQL file: ${sqlFile}`);
const sqlContent = fs.readFileSync(sqlFile, "utf8");
console.log(`📋 SQL content size: ${sqlContent.length} characters\n`);

// Try different approaches to execute the SQL
async function executeDatabaseSetup() {
  console.log("🔧 Attempting database setup...\n");

  // Method 1: Try using psql command directly
  try {
    console.log("🔹 Method 1: Using psql command...");

    // Create a temporary SQL file for execution
    fs.writeFileSync("temp_setup.sql", sqlContent);

    const psqlCommand = `psql "${DATABASE_URL}" -f temp_setup.sql`;
    console.log("Executing:", psqlCommand.replace(/:([^:@]{8})[^:@]*@/, ":$1***@"));

    const result = execSync(psqlCommand, {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 60000, // 1 minute timeout
    });

    console.log("✅ psql execution successful!");
    console.log("Output:", result);

    // Clean up
    fs.unlinkSync("temp_setup.sql");
    return true;
  } catch (error) {
    console.log("❌ psql method failed:", error.message);

    // Clean up on error
    if (fs.existsSync("temp_setup.sql")) {
      fs.unlinkSync("temp_setup.sql");
    }
  }

  // Method 2: Try using node-postgres if available
  try {
    console.log("\n🔹 Method 2: Using node-postgres...");

    const { Client } = require("pg");
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();
    console.log("✅ PostgreSQL connection established");

    // Execute the SQL in chunks to avoid issues
    const sqlStatements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📋 Executing ${sqlStatements.length} SQL statements...`);

    for (let i = 0; i < sqlStatements.length; i++) {
      const stmt = sqlStatements[i];
      if (stmt.length > 10) {
        // Skip empty statements
        try {
          await client.query(stmt + ";");
          if (i % 10 === 0) {
            console.log(`  ✅ Executed ${i + 1}/${sqlStatements.length} statements`);
          }
        } catch (stmtError) {
          console.log(`  ⚠️  Statement ${i + 1} warning:`, stmtError.message.substring(0, 100));
        }
      }
    }

    await client.end();
    console.log("✅ node-postgres execution completed!");
    return true;
  } catch (error) {
    console.log("❌ node-postgres method failed:", error.message);
  }

  // Method 3: Try using Prisma
  try {
    console.log("\n🔹 Method 3: Using Prisma db execute...");

    // Write SQL to a file and use Prisma
    fs.writeFileSync("prisma_setup.sql", sqlContent);

    const prismaCommand =
      "npx prisma db execute --file prisma_setup.sql --schema prisma/schema.prisma";
    console.log("Executing:", prismaCommand);

    const prismaResult = execSync(prismaCommand, {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 60000,
    });

    console.log("✅ Prisma execution successful!");
    console.log("Output:", prismaResult);

    // Clean up
    fs.unlinkSync("prisma_setup.sql");
    return true;
  } catch (error) {
    console.log("❌ Prisma method failed:", error.message);

    // Clean up on error
    if (fs.existsSync("prisma_setup.sql")) {
      fs.unlinkSync("prisma_setup.sql");
    }
  }

  return false;
}

// Test database connection first
async function testConnection() {
  try {
    console.log("🧪 Testing database connection...");

    const { Client } = require("pg");
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();
    const result = await client.query("SELECT version();");
    await client.end();

    console.log("✅ Database connection successful!");
    console.log("PostgreSQL version:", result.rows[0].version.substring(0, 50) + "...");
    return true;
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
    return false;
  }
}

// Main execution
async function main() {
  // Test connection first
  const connectionOk = await testConnection();

  if (!connectionOk) {
    console.log("\n❌ Cannot proceed with database setup - connection failed");
    console.log("💡 Please verify your DATABASE_URL and database credentials");
    process.exit(1);
  }

  // Execute database setup
  const setupSuccess = await executeDatabaseSetup();

  if (setupSuccess) {
    console.log("\n🎉 Database setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Test application login with admin@exjamalumni.org");
    console.log("2. Verify tables are created in Supabase dashboard");
    console.log("3. Start using the application!");
  } else {
    console.log("\n❌ All database setup methods failed");
    console.log("\n💡 Manual setup required:");
    console.log("1. Copy CORRECTED_DATABASE_SETUP.sql to Supabase Dashboard");
    console.log("2. Run in SQL Editor");
    console.log("3. Check for any remaining syntax errors");
  }
}

main().catch(console.error);
