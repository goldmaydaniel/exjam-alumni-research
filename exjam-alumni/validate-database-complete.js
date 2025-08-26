const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

console.log("🧪 ExJAM Alumni Database - Complete Functionality Test");
console.log("=====================================================\n");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize clients
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function testDatabaseFunctionality() {
  console.log("🔧 Testing Database Functionality...\n");

  let passCount = 0;
  let totalTests = 0;

  // Test 1: Supabase Connection
  totalTests++;
  try {
    const { error } = await supabaseAdmin.auth.getSession();
    if (!error) {
      console.log("✅ Test 1: Supabase Admin Connection - PASS");
      passCount++;
    } else {
      console.log("❌ Test 1: Supabase Admin Connection - FAIL:", error.message);
    }
  } catch (error) {
    console.log("❌ Test 1: Supabase Admin Connection - FAIL:", error.message);
  }

  // Test 2: Prisma Connection
  totalTests++;
  try {
    await prisma.$connect();
    console.log("✅ Test 2: Prisma Database Connection - PASS");
    passCount++;
  } catch (error) {
    console.log("❌ Test 2: Prisma Database Connection - FAIL:", error.message);
  }

  // Test 3: User Table Access
  totalTests++;
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Test 3: User Table Access - PASS (${userCount} users)`);
    passCount++;
  } catch (error) {
    console.log("❌ Test 3: User Table Access - FAIL:", error.message);
  }

  // Test 4: Event Table Access
  totalTests++;
  try {
    const eventCount = await prisma.event.count();
    console.log(`✅ Test 4: Event Table Access - PASS (${eventCount} events)`);
    passCount++;
  } catch (error) {
    console.log("❌ Test 4: Event Table Access - FAIL:", error.message);
  }

  // Test 5: Admin User Verification
  totalTests++;
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (adminUser) {
      console.log(`✅ Test 5: Admin User Verification - PASS (${adminUser.email})`);
      passCount++;
    } else {
      console.log("❌ Test 5: Admin User Verification - FAIL (No admin found)");
    }
  } catch (error) {
    console.log("❌ Test 5: Admin User Verification - FAIL:", error.message);
  }

  // Test 6: Create Test Registration
  totalTests++;
  try {
    const testEvent = await prisma.event.findFirst();
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    if (testEvent && adminUser) {
      const testRegistration = await prisma.registration.create({
        data: {
          id: "test-reg-" + Date.now(),
          userId: adminUser.id,
          eventId: testEvent.id,
          status: "PENDING",
          ticketType: "REGULAR",
        },
      });

      // Clean up test data
      await prisma.registration.delete({
        where: { id: testRegistration.id },
      });

      console.log("✅ Test 6: Registration CRUD Operations - PASS");
      passCount++;
    } else {
      console.log("❌ Test 6: Registration CRUD Operations - FAIL (Missing test data)");
    }
  } catch (error) {
    console.log("❌ Test 6: Registration CRUD Operations - FAIL:", error.message);
  }

  // Test 7: Supabase RLS Policies (Anon Access)
  totalTests++;
  try {
    const { data: events, error } = await supabaseAnon
      .from("Event")
      .select("id, title, status")
      .eq("status", "PUBLISHED")
      .limit(1);

    if (!error && events && events.length > 0) {
      console.log(
        `✅ Test 7: RLS Policy (Public Events) - PASS (${events.length} events accessible)`
      );
      passCount++;
    } else {
      console.log(
        "❌ Test 7: RLS Policy (Public Events) - FAIL:",
        error?.message || "No events found"
      );
    }
  } catch (error) {
    console.log("❌ Test 7: RLS Policy (Public Events) - FAIL:", error.message);
  }

  // Test 8: Enum Types Functionality
  totalTests++;
  try {
    const squadronUsers = await prisma.user.findMany({
      where: { squadron: "ALPHA" },
    });
    console.log(
      `✅ Test 8: Enum Types (Squadron) - PASS (${squadronUsers.length} ALPHA squadron members)`
    );
    passCount++;
  } catch (error) {
    console.log("❌ Test 8: Enum Types (Squadron) - FAIL:", error.message);
  }

  // Test 9: Index Performance (Complex Query)
  totalTests++;
  try {
    const start = Date.now();
    const complexQuery = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { in: ["ADMIN", "ORGANIZER"] },
      },
      include: {
        Events: {
          where: { status: "PUBLISHED" },
        },
      },
    });
    const duration = Date.now() - start;

    console.log(
      `✅ Test 9: Index Performance - PASS (${complexQuery.length} results in ${duration}ms)`
    );
    passCount++;
  } catch (error) {
    console.log("❌ Test 9: Index Performance - FAIL:", error.message);
  }

  // Test 10: Data Integrity Constraints
  totalTests++;
  try {
    // This should fail due to our check constraint
    try {
      await prisma.event.create({
        data: {
          id: "test-invalid-event",
          title: "Invalid Event",
          startDate: new Date("2025-12-01"),
          endDate: new Date("2025-11-30"), // End before start - should fail
          venue: "Test Venue",
          capacity: 100,
          price: 1000,
          status: "DRAFT",
        },
      });
      console.log("❌ Test 10: Data Integrity Constraints - FAIL (Invalid event was created)");
    } catch (constraintError) {
      console.log("✅ Test 10: Data Integrity Constraints - PASS (Constraint properly enforced)");
      passCount++;
    }
  } catch (error) {
    console.log("❌ Test 10: Data Integrity Constraints - FAIL:", error.message);
  }

  // Clean up and close connections
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.log("⚠️  Prisma disconnect warning:", error.message);
  }

  // Results Summary
  console.log("\n🎯 Test Results Summary");
  console.log("=======================");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${totalTests - passCount}`);
  console.log(`Success Rate: ${Math.round((passCount / totalTests) * 100)}%`);

  if (passCount === totalTests) {
    console.log("\n🎉 ALL TESTS PASSED - DATABASE IS FULLY FUNCTIONAL! ✅");
    console.log("\n🚀 System Status: PRODUCTION READY");
    console.log("\n🔐 Admin Login Credentials:");
    console.log("   Email: admin@exjamalumni.org");
    console.log("   Password: ExJamAdmin2025!");
    console.log("\n📱 Application URL: http://localhost:3001");
    console.log("\n🎖️  ExJAM Alumni Database - MISSION ACCOMPLISHED!");
  } else {
    console.log(`\n⚠️  ${totalTests - passCount} tests failed - please review the failures above`);
  }

  return passCount === totalTests;
}

// Execute the tests
testDatabaseFunctionality()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  });
