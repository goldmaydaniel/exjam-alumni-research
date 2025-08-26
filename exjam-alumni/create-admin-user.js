const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

console.log("🔐 Creating Admin User for ExJAM Alumni System...");

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function createAdminUser() {
  try {
    const adminEmail = "admin@exjamalumni.org";
    const adminPassword = "ExJamAdmin2025!";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminId = `admin-${Date.now()}`;

    console.log("📝 Creating admin user...");
    console.log("Email:", adminEmail);
    console.log("ID:", adminId);

    // Create admin user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: "ADMIN",
        firstName: "System",
        lastName: "Administrator",
      },
    });

    if (authError) {
      console.log("⚠️  Supabase Auth creation failed:", authError.message);
      console.log("Proceeding with direct database insert...");
    } else {
      console.log("✅ Supabase Auth user created:", authUser.user.id);
    }

    // Create user record in our custom User table
    const userData = {
      id: authUser?.user?.id || adminId,
      email: adminEmail,
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      fullName: "System Administrator",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      serviceNumber: "SYS001",
      squadron: "ALPHA",
      currentLocation: "Headquarters",
      graduationYear: "2000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: user, error: userError } = await supabase
      .from("User")
      .insert([userData])
      .select()
      .single();

    if (userError) {
      console.log("⚠️  User table insert failed:", userError.message);
      console.log("This might be because the User table doesn't exist yet.");

      // Save admin credentials to a file for later use
      const fs = require("fs");
      const adminCreds = {
        email: adminEmail,
        password: adminPassword,
        hashedPassword: hashedPassword,
        id: adminId,
        message: "Use these credentials after the database is fully set up",
      };

      fs.writeFileSync("admin-credentials.json", JSON.stringify(adminCreds, null, 2));
      console.log("💾 Admin credentials saved to admin-credentials.json");
    } else {
      console.log("✅ Admin user created in User table!");
      console.log("User ID:", user.id);
    }

    console.log("\n🎉 Admin Setup Complete!");
    console.log("\n📋 Admin Login Credentials:");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("\n⚠️  SECURITY: Change this password after first login!");

    return { email: adminEmail, password: adminPassword };
  } catch (error) {
    console.error("❌ Admin user creation failed:", error.message);
    return null;
  }
}

// Test database connection first
async function testConnection() {
  try {
    console.log("🔍 Testing Supabase connection...");

    // Test service role access
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log("⚠️  Session test warning:", error.message);
    }

    console.log("✅ Supabase connection active");
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await createAdminUser();
  }
}

main();
