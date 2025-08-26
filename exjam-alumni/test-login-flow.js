#!/usr/bin/env node

/**
 * Test script to verify login functionality
 */

async function testLogin() {
  console.log("\n🔍 Testing Login Flow\n");

  const baseUrl = "http://localhost:3001";
  const loginEndpoint = `${baseUrl}/api/auth/login`;

  // Test credentials
  const credentials = {
    email: "demo@exjamalumni.org",
    password: "Demo123456!",
  };

  console.log("📧 Testing with:", credentials.email);
  console.log("🔑 Password:", "***hidden***");
  console.log("\n📡 Sending login request to:", loginEndpoint);

  try {
    const response = await fetch(loginEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    console.log("\n📊 Response Status:", response.status);
    console.log("📦 Response Data:", JSON.stringify(data, null, 2));

    if (response.ok && data.user) {
      console.log("\n✅ Login Successful!");
      console.log("👤 User:", data.user.email);
      console.log("🎭 Role:", data.user.role);
      console.log("🆔 ID:", data.user.id);

      // Test dashboard access with the session
      if (data.session) {
        console.log("\n🔐 Session created successfully");
        console.log("📅 Expires:", new Date(data.session.expires_at * 1000).toLocaleString());
      }

      return true;
    } else {
      console.error("\n❌ Login Failed!");
      console.error("Error:", data.error || "Unknown error");
      return false;
    }
  } catch (error) {
    console.error("\n🚨 Request Failed!");
    console.error("Error:", error.message);
    return false;
  }
}

// Run the test
testLogin().then((success) => {
  if (success) {
    console.log("\n🎉 All tests passed!\n");
    process.exit(0);
  } else {
    console.log("\n💥 Tests failed!\n");
    process.exit(1);
  }
});
