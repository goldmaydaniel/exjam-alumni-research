const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  console.log("🛡️  Create Admin User for ExJAM Alumni Association\n");
  console.log("This script will create an admin user with full access to the admin panel.\n");

  try {
    // Collect user information
    const email = await question("Admin Email: ");
    const password = await question("Admin Password: ");
    const firstName = await question("First Name: ");
    const lastName = await question("Last Name: ");
    const serviceNumber = (await question("Service Number (optional): ")) || `ADMIN-${Date.now()}`;

    console.log("\n📝 Creating admin user...");

    // Step 1: Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName,
        lastName,
        role: "ADMIN",
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("⚠️  User already exists in Supabase Auth, continuing...");

        // Try to get existing user
        const {
          data: { users },
          error: listError,
        } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const existingUser = users.find((u) => u.email === email);
        if (!existingUser) throw new Error("Could not find existing user");

        authUser.user = existingUser;
      } else {
        throw authError;
      }
    }

    console.log("✅ Supabase Auth user created/found");

    // Step 2: Hash password for database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Create or update user in database
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        role: "ADMIN",
        emailVerified: true,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      create: {
        id: authUser.user.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        serviceNumber,
        role: "ADMIN",
        emailVerified: true,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log("✅ Database user created/updated");

    // Step 4: Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: "CREATE_ADMIN",
        entity: "User",
        entityId: dbUser.id,
        metadata: {
          email: dbUser.email,
          role: "ADMIN",
          createdBy: "setup-script",
        },
      },
    });

    console.log("✅ Audit log entry created");

    // Step 5: Display success message
    console.log("\n✨ Admin user created successfully!\n");
    console.log("📋 Admin Details:");
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Role: ADMIN`);
    console.log(`   User ID: ${dbUser.id}`);
    console.log("\n🔐 Login Credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: [hidden]`);
    console.log("\n🌐 Access the admin panel at:");
    console.log("   http://localhost:3000/admin");
    console.log("\n⚡ Quick Commands:");
    console.log("   - Start dev server: npm run dev");
    console.log("   - View all users: npx prisma studio");
    console.log("   - Check database: node test-admin-supabase.js");

    // Optional: Create a test event for the admin
    const createTestData = await question("\nWould you like to create test data? (y/n): ");

    if (createTestData.toLowerCase() === "y") {
      console.log("\n📦 Creating test data...");

      // Create test event
      const testEvent = await prisma.event.create({
        data: {
          id: `test-event-${Date.now()}`,
          title: "Alumni Annual Reunion 2024",
          description: "Join us for the annual ExJAM Alumni reunion",
          shortDescription: "Annual reunion event",
          startDate: new Date("2024-12-01"),
          endDate: new Date("2024-12-03"),
          venue: "AFMS Jos",
          address: "Jos, Plateau State",
          capacity: 500,
          price: 10000,
          status: "PUBLISHED",
          organizerId: dbUser.id,
        },
      });

      console.log("✅ Test event created:", testEvent.title);

      // Create test contact messages
      for (let i = 1; i <= 3; i++) {
        await prisma.contactMessage.create({
          data: {
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            subject: `Test Message ${i}`,
            message: `This is test message ${i} for the admin panel.`,
            status: i === 1 ? "pending" : i === 2 ? "read" : "replied",
          },
        });
      }

      console.log("✅ Test contact messages created");
      console.log("\n📊 Test data summary:");
      console.log("   - 1 test event (Alumni Annual Reunion 2024)");
      console.log("   - 3 test contact messages (different statuses)");
    }
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error.message);

    if (error.code === "P2002") {
      console.log("\n💡 Tip: User with this email already exists.");
      console.log('   Run "npx prisma studio" to view existing users.');
    }

    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log("\n🎉 Setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Setup failed:", error);
    process.exit(1);
  });
