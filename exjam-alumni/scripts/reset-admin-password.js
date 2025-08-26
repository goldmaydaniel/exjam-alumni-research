const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const email = "admin@exjamalumni.org";
    const newPassword = "Admin@2025!";

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the admin user's password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: true,
      },
    });

    console.log("✅ Admin password reset successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 New Password:", newPassword);
    console.log("🆔 User ID:", updatedUser.id);
    console.log("\nYou can now login with these credentials.");
  } catch (error) {
    console.error("Error resetting admin password:", error);

    // If user doesn't exist, create a new admin
    if (error.code === "P2025") {
      console.log("Admin user not found. Creating new admin...");

      const hashedPassword = await bcrypt.hash("Admin@2025!", 12);

      const adminUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: "admin@exjamalumni.org",
          password: hashedPassword,
          firstName: "Super",
          lastName: "Admin",
          fullName: "Super Admin",
          serviceNumber: "ADMIN001",
          squadron: "ALPHA",
          phone: "+234 800 000 0000",
          chapter: "FCT-Abuja",
          currentLocation: "Abuja, Nigeria",
          emergencyContact: "System Administrator",
          role: "ADMIN",
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      console.log("✅ Admin user created successfully!");
      console.log("📧 Email: admin@exjamalumni.org");
      console.log("🔑 Password: Admin@2025!");
      console.log("🆔 User ID:", adminUser.id);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetAdminPassword();
