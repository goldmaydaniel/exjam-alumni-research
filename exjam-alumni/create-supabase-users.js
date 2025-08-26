const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestUsers() {
  console.log("🚀 Creating test users in Supabase...\n");

  // Create admin user
  console.log("Creating admin user...");
  const { data: admin, error: adminError } = await supabase.auth.signUp({
    email: "admin@exjamalumni.org",
    password: "Admin@2025!",
    options: {
      data: {
        firstName: "Super",
        lastName: "Admin",
        role: "ADMIN",
        serviceNumber: "AFMS 00/0001",
        squadron: "ALPHA",
        graduationYear: "2000",
        phone: "+234 123 456 7890",
        chapter: "Lagos",
        currentLocation: "Lagos, Nigeria",
        company: "ExJAM Alumni Association",
        currentOccupation: "System Administrator",
      },
    },
  });

  if (adminError) {
    if (adminError.message.includes("already registered")) {
      console.log("⚠️  Admin user already exists");
    } else {
      console.error("❌ Admin user error:", adminError.message);
    }
  } else {
    console.log("✅ Admin user created successfully");
    if (admin?.user) {
      console.log("   Email:", admin.user.email);
      console.log("   ID:", admin.user.id);
    }
  }

  // Create test user
  console.log("\nCreating test user...");
  const { data: user, error: userError } = await supabase.auth.signUp({
    email: "john.doe@example.com",
    password: "Test@2025!",
    options: {
      data: {
        firstName: "John",
        lastName: "Doe",
        role: "ATTENDEE",
        serviceNumber: "AFMS 95/1234",
        squadron: "JAGUAR",
        graduationYear: "1995",
        phone: "+234 801 234 5678",
        chapter: "Abuja",
        currentLocation: "Abuja, Nigeria",
        company: "Nigerian Air Force",
        currentOccupation: "Pilot",
      },
    },
  });

  if (userError) {
    if (userError.message.includes("already registered")) {
      console.log("⚠️  Test user already exists");
    } else {
      console.error("❌ Test user error:", userError.message);
    }
  } else {
    console.log("✅ Test user created successfully");
    if (user?.user) {
      console.log("   Email:", user.user.email);
      console.log("   ID:", user.user.id);
    }
  }

  // Create additional test user
  console.log("\nCreating additional test user...");
  const { data: user2, error: user2Error } = await supabase.auth.signUp({
    email: "jane.smith@example.com",
    password: "Test@2025!",
    options: {
      data: {
        firstName: "Jane",
        lastName: "Smith",
        role: "SPEAKER",
        serviceNumber: "AFMS 97/5678",
        squadron: "MIG",
        graduationYear: "1997",
        phone: "+234 802 345 6789",
        chapter: "Port Harcourt",
        currentLocation: "Port Harcourt, Nigeria",
        company: "Aviation Consulting Ltd",
        currentOccupation: "Aviation Consultant",
      },
    },
  });

  if (user2Error) {
    if (user2Error.message.includes("already registered")) {
      console.log("⚠️  Additional test user already exists");
    } else {
      console.error("❌ Additional test user error:", user2Error.message);
    }
  } else {
    console.log("✅ Additional test user created successfully");
    if (user2?.user) {
      console.log("   Email:", user2.user.email);
      console.log("   ID:", user2.user.id);
    }
  }

  console.log("\n========================================");
  console.log("📧 Test Accounts Created:");
  console.log("========================================");
  console.log("Admin:");
  console.log("  Email: admin@exjamalumni.org");
  console.log("  Password: Admin@2025!");
  console.log("  Role: ADMIN");
  console.log("");
  console.log("User 1:");
  console.log("  Email: john.doe@example.com");
  console.log("  Password: Test@2025!");
  console.log("  Role: ATTENDEE");
  console.log("");
  console.log("User 2:");
  console.log("  Email: jane.smith@example.com");
  console.log("  Password: Test@2025!");
  console.log("  Role: SPEAKER");
  console.log("========================================\n");

  console.log(
    "ℹ️  Note: Check your email for verification links if email confirmations are enabled."
  );
  console.log(
    "ℹ️  You can disable email confirmations in Supabase Dashboard > Authentication > Settings\n"
  );
}

// Run the function
createTestUsers()
  .then(() => {
    console.log("✨ Setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
