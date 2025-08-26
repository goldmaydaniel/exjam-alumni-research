import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  process.exit(1);
}

// Create Supabase admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  try {
    console.log("Creating admin user in Supabase...");

    // Create or update admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@exjamalumni.org",
      password: "Admin123",
      email_confirm: true,
      user_metadata: {
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        serviceNumber: "AFMS 00/0001",
        squadron: "ALPHA",
        phone: "+234 123 456 7890",
        chapter: "Lagos",
        currentLocation: "Lagos, Nigeria",
        role: "ADMIN",
      },
    });

    if (authError) {
      // If user exists, update the password
      if (authError.message.includes("already been registered")) {
        console.log("Admin user exists, updating password...");

        // Get the existing user
        const {
          data: { users },
          error: listError,
        } = await supabase.auth.admin.listUsers({
          filter: `email.eq.admin@exjamalumni.org`,
        });

        if (listError) throw listError;
        if (!users || users.length === 0) throw new Error("Admin user not found");

        const userId = users[0].id;

        // Update the password
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: "Admin123",
          email_confirm: true,
          user_metadata: {
            firstName: "Super",
            lastName: "Admin",
            fullName: "Super Admin",
            serviceNumber: "AFMS 00/0001",
            squadron: "ALPHA",
            phone: "+234 123 456 7890",
            chapter: "Lagos",
            currentLocation: "Lagos, Nigeria",
            role: "ADMIN",
          },
        });

        if (updateError) throw updateError;

        console.log("✅ Admin password updated successfully");
        console.log("Email: admin@exjamalumni.org");
        console.log("Password: Admin123");
      } else {
        throw authError;
      }
    } else {
      console.log("✅ Admin user created successfully");
      console.log("Email: admin@exjamalumni.org");
      console.log("Password: Admin123");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
