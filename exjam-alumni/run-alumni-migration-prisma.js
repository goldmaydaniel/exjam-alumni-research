const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function runMigration() {
  console.log("🚀 Starting Alumni Directory Migration via Prisma...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "exjam-alumni/supabase/migrations/20250125_alumni_directory.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split into individual statements and filter out comments
    const statements = migrationSQL
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      // Add semicolon back if missing
      const sql = statement.endsWith(";") ? statement : statement + ";";

      // Extract description
      let description = "Executing statement";
      if (sql.includes("CREATE TABLE")) {
        const match = sql.match(/CREATE TABLE[^(]+/);
        description = match ? match[0].replace(/IF NOT EXISTS/g, "").trim() : "Creating table";
      } else if (sql.includes("CREATE INDEX")) {
        const match = sql.match(/CREATE INDEX ([^ ]+)/);
        description = `Creating index: ${match ? match[1] : "index"}`;
      } else if (sql.includes("CREATE POLICY")) {
        const match = sql.match(/CREATE POLICY "([^"]+)"/);
        description = `Creating policy: ${match ? match[1] : "policy"}`;
      } else if (sql.includes("ALTER TABLE")) {
        const match = sql.match(/ALTER TABLE ([^ ]+)/);
        description = `Altering table: ${match ? match[1] : "table"}`;
      } else if (sql.includes("CREATE TRIGGER")) {
        const match = sql.match(/CREATE TRIGGER ([^ ]+)/);
        description = `Creating trigger: ${match ? match[1] : "trigger"}`;
      } else if (sql.includes("CREATE OR REPLACE FUNCTION")) {
        const match = sql.match(/CREATE OR REPLACE FUNCTION ([^(]+)/);
        description = `Creating function: ${match ? match[1] : "function"}`;
      } else if (sql.includes("CREATE OR REPLACE VIEW")) {
        const match = sql.match(/CREATE OR REPLACE VIEW ([^ ]+)/);
        description = `Creating view: ${match ? match[1] : "view"}`;
      } else if (sql.includes("GRANT")) {
        description = "Granting permissions";
      }

      console.log(`[${i + 1}/${statements.length}] ${description}`);

      try {
        await prisma.$executeRawUnsafe(sql);
        console.log("   ✅ Success\n");
        successCount++;
      } catch (error) {
        const errorMsg = error.message || "Unknown error";
        console.log(`   ❌ Error: ${errorMsg}\n`);
        errorCount++;
        errors.push({ statement: description, error: errorMsg });

        // Continue even if there's an error (might be duplicate table/index)
        if (!errorMsg.includes("already exists") && !errorMsg.includes("duplicate")) {
          console.log("   ⚠️  Non-duplicate error, continuing...\n");
        }
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 Migration Summary:");
    console.log(`   ✅ Successful: ${successCount} statements`);
    console.log(`   ❌ Failed: ${errorCount} statements`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    if (errorCount > 0 && errors.length > 0) {
      console.log("❌ Failed statements:");
      errors.forEach((e, idx) => {
        console.log(`   ${idx + 1}. ${e.statement}`);
        console.log(`      Error: ${e.error}\n`);
      });
    }

    if (successCount > 0) {
      console.log("🎉 Migration partially or fully completed!\n");
      console.log("Next steps:");
      console.log("1. Check if tables were created successfully");
      console.log("2. Register a new user with squadron selection");
      console.log("3. Navigate to /alumni to see the directory");
      console.log("4. Test connection requests between alumni\n");
    }
  } catch (error) {
    console.error("❌ Fatal error during migration:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("✨ Migration process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
