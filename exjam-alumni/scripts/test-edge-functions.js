#!/usr/bin/env node

const fetch = require("node-fetch");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const testConfig = {
  baseUrl: `${SUPABASE_URL}/functions/v1`,
  headers: {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
  serviceHeaders: {
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
};

async function testFunction(name, endpoint, method = "GET", body = null, useServiceKey = false) {
  console.log(`\\n🧪 Testing ${name}...`);

  try {
    const headers = useServiceKey ? testConfig.serviceHeaders : testConfig.headers;
    const options = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(`${testConfig.baseUrl}/${endpoint}`, options);
    const data = await response.text();

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(jsonData, null, 2));

    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      return true;
    } else {
      console.log(`❌ ${name} - FAILED`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 Testing Supabase Edge Functions\\n");
  console.log("Base URL:", testConfig.baseUrl);

  const results = [];

  // Test 1: Analytics (GET)
  results.push(await testFunction("Analytics - Get Stats", "analytics", "GET", null, true));

  // Test 2: Check-in Status (GET)
  results.push(
    await testFunction(
      "Check-in - Get Status",
      "check-in?ticketId=EXJAM2025-12345",
      "GET",
      null,
      true
    )
  );

  // Test 3: Sync User Data - Get Stats
  results.push(
    await testFunction("Sync User Data - Get Stats", "sync-user-data", "GET", null, true)
  );

  // Test 4: Send Notification (POST)
  results.push(
    await testFunction("Send Notification - Email Test", "send-notification", "POST", {
      type: "email",
      recipient: "test@example.com",
      template: "registration-confirmation",
      data: {
        firstName: "Test",
        lastName: "User",
        ticketId: "TEST-12345",
        amount: "50000",
        badgeUrl: "https://example.com/badge",
      },
    })
  );

  // Test 5: Generate Badge (POST)
  results.push(
    await testFunction(
      "Generate Badge - Test",
      "generate-badge",
      "POST",
      {
        registrationId: "test-id-12345",
      },
      true
    )
  );

  // Test 6: Payment Webhook (POST) - Test validation
  results.push(
    await testFunction("Payment Webhook - Test", "payment-webhook", "POST", {
      event: "charge.success",
      data: {
        reference: "test-ref-12345",
        amount: 5000000,
        status: "success",
      },
    })
  );

  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log("\\n📊 Test Results Summary:");
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);

  if (passed === total) {
    console.log("\\n🎉 All tests passed!");
  } else {
    console.log("\\n⚠️  Some tests failed. Check the logs above for details.");
  }

  process.exit(passed === total ? 0 : 1);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\\n👋 Test interrupted");
  process.exit(1);
});

runTests().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});
