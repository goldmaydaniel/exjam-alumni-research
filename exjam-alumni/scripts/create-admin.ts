import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Admin credentials
    const email = "admin@exjamalumni.org";
    const password = "Admin@2025!"; // Change this in production

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log("❌ Admin user already exists with email:", email);

      // Update to ADMIN role if not already
      if (existingAdmin.role !== "ADMIN") {
        await prisma.user.update({
          where: { email },
          data: { role: "ADMIN" },
        });
        console.log("✅ Updated existing user to ADMIN role");
      }

      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        fullName: "Super Admin",
        serviceNumber: "ADMIN001",
        set: "2000",
        squadron: "ALPHA",
        phone: "+234 800 000 0000",
        chapter: "FCT-Abuja",
        currentLocation: "Abuja, Nigeria",
        emergencyContact: "System Administrator: +234 800 000 0001",
        role: "ADMIN",
        emailVerified: true,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("🆔 User ID:", adminUser.id);
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
