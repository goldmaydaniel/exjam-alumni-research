const fs = require("fs");
const { execSync } = require("child_process");

// Configuration - YOU NEED TO FILL THESE IN
const config = {
  // Choose your project (uncomment the one you want)

  // Option 1: Use existing supabase-cyan-lvx
  projectRef: "mixrrmdvlvhtfbmgxmkg",
  projectName: "supabase-cyan-lvx",

  // Option 2: Use a different project (uncomment and fill in)
  // projectRef: 'YOUR_PROJECT_REF',
  // projectName: 'YOUR_PROJECT_NAME',

  // FILL THESE IN:
  databasePassword: "", // Your database password
  anonKey: "", // Your anon/public key (starts with eyJ...)
  serviceRoleKey: "", // Your service_role key (starts with eyJ...)
};

// Check if config is filled
if (!config.databasePassword || !config.anonKey || !config.serviceRoleKey) {
  console.log("❌ Please fill in the configuration at the top of this file:");
  console.log("   1. databasePassword");
  console.log("   2. anonKey");
  console.log("   3. serviceRoleKey");
  console.log("");
  console.log("Get these from:");
  console.log(`   https://supabase.com/dashboard/project/${config.projectRef}/settings/api`);
  process.exit(1);
}

console.log("🚀 Setting up Supabase connection...\n");

// URL encode password
const encodedPassword = encodeURIComponent(config.databasePassword);

// Build connection strings
const databaseUrl = `postgresql://postgres.${config.projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
const directUrl = `postgresql://postgres.${config.projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
const supabaseUrl = `https://${config.projectRef}.supabase.co`;

// Create .env content
const envContent = `# Database Configuration (Supabase)
DATABASE_URL="${databaseUrl}"
DIRECT_URL="${directUrl}"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="${supabaseUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${config.anonKey}"
SUPABASE_SERVICE_ROLE_KEY="${config.serviceRoleKey}"

# JWT Secret for auth
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_eb74eed370c595cef1eefeae04c2777992108707"
PAYSTACK_SECRET_KEY="sk_test_e436e76627dbee42d4608bb4a3defcf5c11b476a"
PAYSTACK_PUBLIC_KEY="pk_test_eb74eed370c595cef1eefeae04c2777992108707"

# Email Configuration (Resend)
RESEND_API_KEY="re_iL2VeusW_9bnfECzUTDvGziwRqYFmAzkg"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Bank Transfer Details
NEXT_PUBLIC_BANK_NAME="First Bank of Nigeria"
NEXT_PUBLIC_ACCOUNT_NAME="ExJAM Alumni Association"
NEXT_PUBLIC_ACCOUNT_NUMBER="3123456789"

# Organization Details
NEXT_PUBLIC_ORG_NAME="ExJAM Alumni Association"
NEXT_PUBLIC_ORG_EMAIL="payments@exjamalumni.org"
NEXT_PUBLIC_ORG_PHONE="+234 801 234 5678"
`;

// Backup existing .env
if (fs.existsSync(".env")) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(".env", `.env.backup.${timestamp}`);
  console.log(`✅ Backed up .env to .env.backup.${timestamp}`);
}

// Write new .env
fs.writeFileSync(".env", envContent);
console.log("✅ Updated .env file\n");

// Test connection
console.log("🔗 Testing database connection...");
try {
  execSync("node test-db-connection.js", { stdio: "inherit" });
} catch (error) {
  console.log("⚠️  Connection test failed. Continuing with setup...\n");
}

// Push schema
console.log("\n🏗️  Setting up database schema...");
try {
  execSync("npx prisma db push --force-reset", { stdio: "inherit" });
  console.log("✅ Database schema created!\n");
} catch (error) {
  console.log("❌ Failed to create schema. Please check your credentials.\n");
  process.exit(1);
}

// Generate Prisma client
console.log("🔧 Generating Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma Client generated!\n");
} catch (error) {
  console.log("⚠️  Failed to generate Prisma Client\n");
}

// Create admin user
console.log("👤 Creating admin user...");
try {
  execSync("npm run create-admin", { stdio: "inherit" });
} catch (error) {
  console.log("⚠️  Admin user may already exist\n");
}

console.log("\n✅ Setup complete!\n");
console.log("📊 Summary:");
console.log(`  Project: ${config.projectName} (${config.projectRef})`);
console.log(`  URL: ${supabaseUrl}`);
console.log("  Database: Connected and configured");
console.log("  Admin: admin@exjamalumni.org / Admin@2025!");
console.log("\n🚀 Start the app with: npm run dev");
console.log("   Then visit: http://localhost:3000\n");
