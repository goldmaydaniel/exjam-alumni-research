const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    // Get all users with their basic info (not passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("=== Existing Users in Database ===\n");
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}\n`);
    });

    // Check for admin users
    const adminUsers = users.filter((u) => u.role === "ADMIN");
    if (adminUsers.length > 0) {
      console.log("=== Admin Users ===");
      adminUsers.forEach((admin) => {
        console.log(`- ${admin.email} (${admin.firstName} ${admin.lastName})`);
      });
    }

    console.log("\n=== Default Test Credentials ===");
    console.log("Based on common test patterns, try:");
    console.log("1. admin@exjamalumni.org / Admin@123");
    console.log("2. test@example.com / Test@123");
    console.log("3. user@example.com / User@123");
    console.log("\nNote: Actual passwords are hashed and cannot be retrieved.");
    console.log("If you need to reset a password, use the forgot password feature.");
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
