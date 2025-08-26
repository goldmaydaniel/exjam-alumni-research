const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAuthUsers() {
  console.log("Creating users in Supabase Auth...\n");

  const users = [
    {
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
      metadata: {
        firstName: "Super",
        lastName: "Admin",
        role: "ADMIN",
      },
    },
    {
      email: "test@example.com",
      password: "Test@2025!",
      metadata: {
        firstName: "Test",
        lastName: "User",
        role: "ATTENDEE",
      },
    },
  ];

  for (const user of users) {
    try {
      // Try to create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata,
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          console.log(`⚠️  User ${user.email} already exists in Supabase Auth`);

          // Try to update the password
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            data?.user?.id || "",
            { password: user.password }
          );

          if (!updateError) {
            console.log(`   ✅ Password updated for ${user.email}`);
          }
        } else {
          console.error(`❌ Error creating ${user.email}:`, error.message);
        }
      } else {
        console.log(`✅ Created user: ${user.email}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${user.email}:`, err.message);
    }
  }

  console.log("\n=== Login Credentials ===");
  console.log("Admin: admin@exjamalumni.org / Admin@2025!");
  console.log("User: test@example.com / Test@2025!");
  console.log("\nYou can now login at http://localhost:3004/login");
}

createAuthUsers();
