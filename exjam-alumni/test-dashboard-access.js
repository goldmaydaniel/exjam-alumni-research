#!/usr/bin/env node

/**
 * Test dashboard access after login
 */

async function testDashboardAccess() {
  console.log("\n🔍 Testing Dashboard Access After Login\n");

  const baseUrl = "http://localhost:3001";

  // Step 1: Login first
  console.log("Step 1: Logging in...");
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "demo@exjamalumni.org",
      password: "Demo123456!",
    }),
  });

  const loginData = await loginResponse.json();

  if (!loginResponse.ok || !loginData.session) {
    console.error("❌ Login failed!");
    return false;
  }

  console.log("✅ Login successful");
  console.log("🔐 Session token received");

  // Step 2: Test dashboard page access
  console.log("\nStep 2: Testing dashboard page access...");

  try {
    // Test the dashboard page with the session cookie
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        Cookie: `sb-yzrzjagkkycmdwuhrvww-auth-token=${JSON.stringify({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token,
          expires_at: loginData.session.expires_at,
        })}`,
      },
    });

    console.log("📊 Dashboard Response Status:", dashboardResponse.status);

    if (dashboardResponse.ok) {
      console.log("✅ Dashboard access granted");

      // Check if we get the actual dashboard content
      const html = await dashboardResponse.text();
      const isDashboard = html.includes("dashboard") || html.includes("Welcome");

      if (isDashboard) {
        console.log("✅ Dashboard content verified");
      } else {
        console.log("⚠️ Dashboard page loaded but content unclear");
      }
    } else if (dashboardResponse.status === 401) {
      console.error("❌ Dashboard access denied - Unauthorized");
    } else if (dashboardResponse.status === 302 || dashboardResponse.status === 307) {
      console.log("↩️ Dashboard redirected (likely to login)");
    } else {
      console.error("❌ Unexpected dashboard response:", dashboardResponse.status);
    }
  } catch (error) {
    console.error("❌ Error accessing dashboard:", error.message);
    return false;
  }

  // Step 3: Test API endpoints with auth
  console.log("\nStep 3: Testing authenticated API endpoints...");

  const endpoints = ["/api/events", "/api/registrations", "/api/user/profile"];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${loginData.session.access_token}`,
        },
      });

      console.log(`  ${endpoint}: ${response.status} ${response.ok ? "✅" : "❌"}`);
    } catch (error) {
      console.log(`  ${endpoint}: ❌ Error - ${error.message}`);
    }
  }

  return true;
}

// Run the test
testDashboardAccess().then((success) => {
  if (success) {
    console.log("\n🎉 Dashboard access test completed!\n");
  } else {
    console.log("\n💥 Dashboard access test failed!\n");
  }
});
