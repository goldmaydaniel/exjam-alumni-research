const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testRegistrationWithChapter() {
  console.log("🧪 Testing Registration with Chapter Field...\n");

  try {
    // Test 1: Check if chapter field exists in schema
    console.log("1️⃣ Checking database schema...");

    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('chapter', 'squadron')
      ORDER BY column_name;
    `;

    console.log("✅ User table columns:", tableInfo);

    // Test 2: Check Squadron enum values
    console.log("\n2️⃣ Checking Squadron enum values...");

    const squadronEnumInfo = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'Squadron'
      )
      ORDER BY enumlabel;
    `;

    console.log("✅ Available squadrons:", squadronEnumInfo);

    // Test 3: Create a test user with chapter and squadron
    console.log("\n3️⃣ Testing user creation with chapter and squadron...");

    const testUser = await prisma.user.create({
      data: {
        id: `test-${Date.now()}`,
        email: `test-chapter-${Date.now()}@example.com`,
        password: "hashedpassword123",
        firstName: "Test",
        lastName: "User",
        fullName: "Test User",
        serviceNumber: "NAF/TEST123",
        squadron: "GREEN",
        chapter: "LAGOS",
        phone: "+234123456789",
        currentLocation: "Lagos, Nigeria",
        emergencyContact: "+234987654321",
        role: "VERIFIED_MEMBER",
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        squadron: true,
        chapter: true,
        serviceNumber: true,
        role: true,
      },
    });

    console.log("✅ Test user created:", testUser);

    // Test 4: Query users by chapter
    console.log("\n4️⃣ Testing chapter-based queries...");

    const lagosUsers = await prisma.user.findMany({
      where: {
        chapter: "LAGOS",
      },
      select: {
        firstName: true,
        lastName: true,
        chapter: true,
        squadron: true,
      },
      take: 3,
    });

    console.log("✅ Users in LAGOS chapter:", lagosUsers);

    // Test 5: Test squadron and chapter statistics
    console.log("\n5️⃣ Testing chapter and squadron statistics...");

    const chapterStats = await prisma.user.groupBy({
      by: ["chapter"],
      where: {
        chapter: {
          not: null,
        },
      },
      _count: {
        chapter: true,
      },
    });

    const squadronStats = await prisma.user.groupBy({
      by: ["squadron"],
      where: {
        squadron: {
          not: null,
        },
      },
      _count: {
        squadron: true,
      },
    });

    console.log("✅ Chapter statistics:", chapterStats);
    console.log("✅ Squadron statistics:", squadronStats);

    // Test 6: Cleanup test user
    console.log("\n6️⃣ Cleaning up test data...");

    await prisma.user.delete({
      where: {
        id: testUser.id,
      },
    });

    console.log("✅ Test user deleted");

    console.log("\n🎉 All tests passed! Registration with chapter field is working correctly.");

    console.log("\n📋 Summary:");
    console.log("- Chapter field exists in User table: ✅");
    console.log("- Squadron enum is properly configured: ✅");
    console.log("- User creation with chapter/squadron works: ✅");
    console.log("- Chapter-based queries work: ✅");
    console.log("- Statistics generation works: ✅");
  } catch (error) {
    console.error("❌ Error during testing:", error);

    if (error.message.includes("chapter")) {
      console.log("\n💡 Tip: The chapter field might need to be added to the database.");
      console.log("Run: npx prisma db push");
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRegistrationWithChapter()
  .then(() => {
    console.log("\n✨ Chapter field integration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error.message);
    process.exit(1);
  });
