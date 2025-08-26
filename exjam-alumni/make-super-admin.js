const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    const email = "goldmay@gmail.com";
    
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("✅ User found!");
      console.log("📧 Current email:", existingUser.email);
      console.log("👤 Current role:", existingUser.role);
      
      // Update to ADMIN role
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          role: "ADMIN",
          emailVerified: true // Ensure email is verified
        },
      });
      
      console.log("🎉 Successfully updated user to ADMIN role!");
      console.log("📊 Updated role:", updatedUser.role);
      console.log("✉️  Email verified:", updatedUser.emailVerified);
      
    } else {
      console.log("❌ User not found with email:", email);
      console.log("💡 The user needs to register first before being made an admin");
      
      // List all users to see what's available
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true
        }
      });
      
      console.log("\n📋 Current users in database:");
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.fullName}) - Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error updating user role:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
makeSuperAdmin();