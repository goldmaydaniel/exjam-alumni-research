#!/usr/bin/env node

const fetch = require("node-fetch");
require("dotenv").config({ path: ".env.local" });

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log("🧪 Testing API Routes Integration...\n");
console.log("Base URL:", BASE_URL);

async function testAPI(name, endpoint, method = "GET", body = null, headers = {}) {
  console.log(`\n🔍 Testing ${name}...`);

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    console.log(`Status: ${response.status}`);

    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${name} - SUCCESS`);
      if (jsonData.raw) {
        console.log(`Response: [${data.length} characters]`);
      } else {
        console.log(`Response:`, JSON.stringify(jsonData, null, 2));
      }
      return true;
    } else {
      console.log(`❌ ${name} - FAILED`);
      console.log(`Response:`, JSON.stringify(jsonData, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR:`, error.message);
    return false;
  }
}

async function runTests() {
  const results = [];

  // Test 1: Test Badge Generation
  results.push(await testAPI("Badge - Test Generation", "/api/badge/test", "GET"));

  // Test 2: Analytics (without auth - should fail)
  results.push(await testAPI("Analytics - Unauthorized Access", "/api/analytics/dashboard", "GET"));

  // Test 3: Check-in Status (without auth - should fail)
  results.push(
    await testAPI("Check-in - Unauthorized Access", "/api/checkin/qr?ticketId=TEST-12345", "GET")
  );

  // Test 4: Notification Send (without auth - should fail)
  results.push(
    await testAPI("Notifications - Unauthorized Access", "/api/notifications/send", "POST", {
      type: "email",
      recipient: "test@example.com",
      template: "registration-confirmation",
      data: { firstName: "Test", lastName: "User" },
    })
  );

  // Test 5: Badge Download (should fail - no registration)
  results.push(
    await testAPI("Badge - Download Invalid ID", "/api/badge/invalid-id/download", "GET")
  );

  // Test 6: Paystack Webhook (should fail - no signature)
  results.push(
    await testAPI("Paystack Webhook - No Signature", "/api/webhooks/paystack", "POST", {
      event: "charge.success",
      data: { reference: "test-ref", amount: 5000000 },
    })
  );

  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log("\n📊 API Routes Test Summary:");
  console.log(`✅ Expected Results: ${passed}/${total}`);
  console.log(`❌ Unexpected Results: ${total - passed}/${total}`);

  console.log("\n📝 Test Notes:");
  console.log("• Badge test generation should work (public endpoint)");
  console.log("• Auth-protected endpoints should return 401 Unauthorized");
  console.log("• Invalid requests should return appropriate error codes");
  console.log("• Webhook endpoints should validate signatures");

  console.log("\n🎯 Next Steps:");
  console.log("1. Start the development server: npm run dev");
  console.log("2. Test with authenticated requests");
  console.log("3. Integrate with frontend components");
  console.log("4. Set up proper webhook URLs");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Tests interrupted");
  process.exit(1);
});

runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
