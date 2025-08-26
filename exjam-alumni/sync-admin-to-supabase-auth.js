const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yzrzjagkkycmdwuhrvww.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkxNzYzOSwiZXhwIjoyMDcxNDkzNjM5fQ.3_t1THtTegbpNoDwCNeicwyghk8j6Aw0HUBVSlgopkQ";

async function syncAdminUser() {
  console.log("🔄 Starting admin user sync to Supabase Auth...");

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // First, check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users?.find((u) => u.email === "admin@exjamalumni.org");

    if (existingUser) {
      console.log("✅ Admin user already exists in Supabase Auth:", existingUser.id);

      // Update the password just in case
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: "Admin@2025!",
          email_confirm: true,
        }
      );

      if (updateError) {
        console.error("❌ Failed to update admin user:", updateError.message);
      } else {
        console.log("✅ Admin user password updated successfully");
      }

      return existingUser.id;
    }

    // Create new user in Supabase Auth
    console.log("📝 Creating admin user in Supabase Auth...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
      email_confirm: true,
      user_metadata: {
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        role: "ADMIN",
      },
    });

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("User creation succeeded but no user data returned");
    }

    console.log("✅ Admin user created in Supabase Auth:", data.user.id);
    console.log("📧 Email:", data.user.email);
    console.log("✅ Email confirmed:", data.user.email_confirmed_at !== null);

    return data.user.id;
  } catch (error) {
    console.error("❌ Error syncing admin user:", error.message);
    throw error;
  }
}

// Run the sync
syncAdminUser()
  .then((userId) => {
    console.log("🎉 Admin user sync completed successfully!");
    console.log("🔑 User ID:", userId);
    console.log("📧 Email: admin@exjamalumni.org");
    console.log("🔐 Password: Admin@2025!");
    console.log("");
    console.log("✅ You can now log in at http://localhost:3000/login");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Sync failed:", error.message);
    process.exit(1);
  });
