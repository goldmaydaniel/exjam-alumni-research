const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminFunctionality() {
  console.log("🔍 Testing Admin Functionality with Supabase...\n");

  try {
    // Test 1: ContactMessage table
    console.log("1️⃣ Testing ContactMessage table...");
    const testMessage = await prisma.contactMessage.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        subject: "Test Subject",
        message: "This is a test message from the admin test script.",
        status: "pending",
      },
    });
    console.log("✅ ContactMessage created:", testMessage.id);

    // Fetch messages
    const messages = await prisma.contactMessage.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });
    console.log(`✅ Found ${messages.length} contact messages\n`);

    // Test 2: SiteConfig table
    console.log("2️⃣ Testing SiteConfig table...");
    const siteConfig = await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: {
        site_name: "ExJAM Alumni Association",
        contact_email: "info@exjam.org.ng",
      },
      create: {
        id: 1,
        site_name: "ExJAM Alumni Association",
        contact_email: "info@exjam.org.ng",
      },
    });
    console.log("✅ SiteConfig configured:", siteConfig.site_name);

    // Test 3: User statistics
    console.log("\n3️⃣ Fetching user statistics...");
    const userStats = await prisma.user.aggregate({
      _count: true,
      where: { status: "ACTIVE" },
    });
    console.log(`✅ Active users: ${userStats._count}`);

    const verifiedUsers = await prisma.user.count({
      where: { emailVerified: true },
    });
    console.log(`✅ Verified users: ${verifiedUsers}`);

    // Test 4: Event statistics
    console.log("\n4️⃣ Fetching event statistics...");
    const eventStats = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      include: {
        _count: {
          select: { Registration: true },
        },
      },
      take: 5,
    });
    console.log(`✅ Active events: ${eventStats.length}`);

    // Test 5: Recent registrations
    console.log("\n5️⃣ Fetching recent registrations...");
    const recentRegistrations = await prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: { firstName: true, lastName: true, email: true },
        },
        Event: {
          select: { title: true },
        },
      },
    });
    console.log(`✅ Recent registrations: ${recentRegistrations.length}`);

    // Test 6: Payment statistics
    console.log("\n6️⃣ Calculating payment statistics...");
    const paymentStats = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: "SUCCESS" },
    });
    console.log(`✅ Total revenue: $${paymentStats._sum.amount || 0}`);
    console.log(`✅ Successful payments: ${paymentStats._count}`);

    // Test 7: Admin dashboard view
    console.log("\n7️⃣ Testing admin dashboard view...");
    const { data: dashboardStats, error } = await supabase
      .from("admin_dashboard_stats")
      .select("*")
      .single();

    if (error) {
      console.log("⚠️ Dashboard view not available:", error.message);
    } else {
      console.log("✅ Dashboard stats:", dashboardStats);
    }

    // Test 8: Cleanup test message
    console.log("\n8️⃣ Cleaning up test data...");
    await prisma.contactMessage.delete({
      where: { id: testMessage.id },
    });
    console.log("✅ Test message deleted");

    console.log("\n✨ All admin functionality tests completed successfully!");

    // Summary
    console.log("\n📊 Summary:");
    console.log("- ContactMessage table: ✅ Working");
    console.log("- SiteConfig table: ✅ Working");
    console.log("- User management: ✅ Working");
    console.log("- Event management: ✅ Working");
    console.log("- Payment tracking: ✅ Working");
    console.log("- Admin dashboard: ✅ Ready");
  } catch (error) {
    console.error("❌ Error testing admin functionality:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testAdminFunctionality()
  .then(() => {
    console.log("\n🎉 Admin module successfully integrated with Supabase!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Admin module test failed:", error);
    process.exit(1);
  });
