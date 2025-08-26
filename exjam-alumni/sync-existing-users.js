const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function syncExistingUsers() {
  console.log("🔄 Syncing existing users from database...\n");

  try {
    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        serviceNumber: true,
        squadron: true,
        graduationYear: true,
        phone: true,
        chapter: true,
        currentLocation: true,
        company: true,
        currentOccupation: true,
      },
    });

    console.log(`Found ${users.length} users in database:\n`);

    users.forEach((user) => {
      console.log(`User: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
      console.log("");
    });

    console.log("========================================");
    console.log("📋 Instructions for Supabase Setup:");
    console.log("========================================");
    console.log("");
    console.log("1. Go to Supabase Dashboard:");
    console.log("   https://supabase.com/dashboard/project/yzrzjagkkycmdwuhrvww/auth/users");
    console.log("");
    console.log("2. For Email Settings:");
    console.log("   - Go to Authentication > Settings");
    console.log('   - Disable "Enable email confirmations" for testing');
    console.log("   - Or configure custom SMTP settings");
    console.log("");
    console.log("3. To manually create users:");
    console.log('   - Click "Add user" button');
    console.log("   - Enter email and password");
    console.log("   - Auto-confirm email");
    console.log("");
    console.log("4. Test credentials from database:");
    console.log("   Admin: admin@exjamalumni.org / Admin123");
    console.log("   User: john.doe@example.com / Test123");
    console.log("");
    console.log("5. For production:");
    console.log("   - Enable email confirmations");
    console.log("   - Configure custom email templates");
    console.log("   - Set up OAuth providers");
    console.log("========================================\n");
  } catch (error) {
    console.error("Error syncing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncExistingUsers();
