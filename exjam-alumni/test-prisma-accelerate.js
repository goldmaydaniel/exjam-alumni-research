#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client/edge");
const { withAccelerate } = require("@prisma/extension-accelerate");
require("dotenv").config({ path: ".env.local" });

async function testPrismaAccelerate() {
  console.log("🚀 Testing Prisma Accelerate connection...\n");

  try {
    // Create Prisma client with Accelerate extension
    const prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    }).$extends(withAccelerate());

    console.log("✅ Prisma Accelerate client initialized");

    // Test basic query - count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

    // Test performance query with caching
    console.log("⏱️  Testing cached query performance...");

    const startTime = Date.now();
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      cacheStrategy: {
        ttl: 300, // 5 minutes
        tags: ["user-list"],
      },
    });
    const endTime = Date.now();

    console.log(`✅ Query completed in ${endTime - startTime}ms`);
    console.log(`📋 Sample users:`, users.slice(0, 2));

    // Test admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (adminUser) {
      console.log("👑 Admin user found:", adminUser);
    } else {
      console.log("⚠️  No admin user found");
    }

    // Test registration count
    const registrationCount = await prisma.registration.count();
    console.log(`📝 Total registrations: ${registrationCount}`);

    await prisma.$disconnect();
    console.log("\n🎉 Prisma Accelerate connection test successful!");
  } catch (error) {
    console.error("❌ Prisma Accelerate test failed:", error.message);

    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }

    process.exit(1);
  }
}

testPrismaAccelerate();
