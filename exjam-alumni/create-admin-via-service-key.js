const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yzrzjagkkycmdwuhrvww.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ";

async function createAdminUser() {
  console.log("🔄 Creating admin user via service key...");

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Create user using admin API
    console.log("📝 Creating user in Supabase Auth...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
      email_confirm: true,
      user_metadata: {
        firstName: "Super",
        lastName: "Admin",
        role: "ADMIN",
      },
    });

    if (error) {
      console.error("❌ Failed to create user:", error.message);
      console.error("📋 Full error:", error);
      return;
    }

    console.log("✅ Admin user created successfully!");
    console.log("🔑 User ID:", data.user.id);
    console.log("📧 Email:", data.user.email);
    console.log("✅ Email confirmed:", data.user.email_confirmed_at !== null);

    // Now test authentication
    console.log("");
    console.log("🔄 Testing authentication...");

    // Create a regular client for testing authentication
    const testClient = createClient(
      supabaseUrl,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTc2MzksImV4cCI6MjA3MTQ5MzYzOX0.p_S5zIZHE9fBDL4ZiP-NZd8vDKIyHvfxje4WqaE-KoA"
    );

    const { data: authData, error: authError } = await testClient.auth.signInWithPassword({
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
    });

    if (authError) {
      console.error("❌ Authentication test failed:", authError.message);
    } else {
      console.log("✅ Authentication test successful!");
      console.log("🎉 Admin user is ready to use!");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// Run the creation
createAdminUser()
  .then(() => {
    console.log("");
    console.log("🎉 Setup completed!");
    console.log("📧 Email: admin@exjamalumni.org");
    console.log("🔐 Password: Admin@2025!");
    console.log("🌐 Login URL: http://localhost:3000/login");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Setup failed:", error.message);
    process.exit(1);
  });
