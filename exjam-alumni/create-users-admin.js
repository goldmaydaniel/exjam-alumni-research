const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// We need to create an admin client with service role key for user management
// First, let's try with the regular client and handle the auth differently

async function createUsersViaAPI() {
  console.log("🚀 Creating users via Supabase Admin API...\n");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Supabase credentials in .env file");
    process.exit(1);
  }

  console.log("📝 Using Supabase Project:", SUPABASE_URL);
  console.log("");

  // For creating users programmatically, we need the service role key
  console.log("⚠️  Note: To create users programmatically, you need the SERVICE_ROLE_KEY");
  console.log("");
  console.log("🔧 Alternative Method - Using Supabase CLI:");
  console.log("========================================");
  console.log("");
  console.log("1. Install Supabase CLI (if not installed):");
  console.log("   brew install supabase/tap/supabase");
  console.log("");
  console.log("2. Login to Supabase:");
  console.log("   supabase login");
  console.log("");
  console.log("3. Link to your project:");
  console.log("   supabase link --project-ref yzrzjagkkycmdwuhrvww");
  console.log("");
  console.log("4. Create users with SQL:");
  console.log(
    "   supabase db execute --sql \"SELECT create_user('admin@exjamalumni.org', 'Admin@2025!');\""
  );
  console.log("");
  console.log("========================================");
  console.log("");

  // Let's create a SQL script instead
  const sqlScript = `
-- Create users directly in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new

-- Function to create authenticated users
CREATE OR REPLACE FUNCTION create_app_user(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS void AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create the auth user
  new_user_id := extensions.uuid_generate_v4();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    aud,
    role
  ) VALUES (
    new_user_id,
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    user_metadata,
    NOW(),
    NOW(),
    encode(gen_random_bytes(32), 'hex'),
    'authenticated',
    'authenticated'
  );

  -- Also create corresponding record in public.User table
  INSERT INTO public."User" (
    id,
    email,
    "firstName",
    "lastName",
    "fullName",
    password,
    role,
    "emailVerified",
    "createdAt",
    "updatedAt"
  ) VALUES (
    new_user_id,
    user_email,
    COALESCE(user_metadata->>'firstName', 'User'),
    COALESCE(user_metadata->>'lastName', ''),
    COALESCE(user_metadata->>'firstName', 'User') || ' ' || COALESCE(user_metadata->>'lastName', ''),
    '',
    COALESCE(user_metadata->>'role', 'ATTENDEE'),
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin user
SELECT create_app_user(
  'admin@exjamalumni.org',
  'Admin@2025!',
  '{"firstName": "Super", "lastName": "Admin", "role": "ADMIN"}'::JSONB
);

-- Create test user
SELECT create_app_user(
  'john.doe@example.com',
  'Test@2025!',
  '{"firstName": "John", "lastName": "Doe", "role": "ATTENDEE"}'::JSONB
);

-- Create additional test user
SELECT create_app_user(
  'jane.smith@example.com',
  'Test@2025!',
  '{"firstName": "Jane", "lastName": "Smith", "role": "SPEAKER"}'::JSONB
);

-- Verify users were created
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 3;
`;

  // Save SQL script to file
  const fs = require("fs");
  fs.writeFileSync("create-supabase-users.sql", sqlScript);

  console.log("✅ SQL script created: create-supabase-users.sql");
  console.log("");
  console.log("📋 To create users, choose one of these methods:");
  console.log("");
  console.log("METHOD 1 - Via Supabase Dashboard:");
  console.log("1. Go to: https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/sql/new");
  console.log("2. Copy and paste the content from create-supabase-users.sql");
  console.log('3. Click "Run"');
  console.log("");
  console.log("METHOD 2 - Via Supabase CLI:");
  console.log("supabase db execute -f create-supabase-users.sql");
  console.log("");
  console.log("========================================");
  console.log("Test Accounts to be Created:");
  console.log("========================================");
  console.log("Admin:");
  console.log("  Email: admin@exjamalumni.org");
  console.log("  Password: Admin@2025!");
  console.log("");
  console.log("User 1:");
  console.log("  Email: john.doe@example.com");
  console.log("  Password: Test@2025!");
  console.log("");
  console.log("User 2:");
  console.log("  Email: jane.smith@example.com");
  console.log("  Password: Test@2025!");
  console.log("========================================");
}

// Alternative: Create via direct database connection
async function createUsersDirectly() {
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();

  try {
    console.log("\n📦 Creating/Updating users directly in database...\n");

    // Update or create admin user
    const adminPassword = await bcrypt.hash("Admin@2025!", 10);
    await prisma.user.upsert({
      where: { email: "admin@exjamalumni.org" },
      update: {
        password: adminPassword,
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        role: "ADMIN",
        emailVerified: true,
      },
      create: {
        id: "admin-" + Date.now(),
        email: "admin@exjamalumni.org",
        password: adminPassword,
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        role: "ADMIN",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Admin user ready: admin@exjamalumni.org");

    // Update or create test user
    const testPassword = await bcrypt.hash("Test@2025!", 10);
    await prisma.user.upsert({
      where: { email: "john.doe@example.com" },
      update: {
        password: testPassword,
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        role: "ATTENDEE",
        emailVerified: true,
      },
      create: {
        id: "user-" + Date.now(),
        email: "john.doe@example.com",
        password: testPassword,
        firstName: "John",
        lastName: "Doe",
        fullName: "John Doe",
        role: "ATTENDEE",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("✅ Test user ready: john.doe@example.com");

    console.log("\n✨ Users are ready in the database!");
    console.log("You can now login with the regular authentication system.\n");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run both methods
createUsersViaAPI()
  .then(() => {
    console.log("\n🔄 Also updating database directly for fallback auth...");
    return createUsersDirectly();
  })
  .then(() => {
    console.log("\n✅ Setup complete! You can now test login.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
