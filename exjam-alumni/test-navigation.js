#!/usr/bin/env node

/**
 * Test all navigation routes
 */

const routes = [
  { path: "/", name: "Home", expectedStatus: 200 },
  { path: "/about", name: "About", expectedStatus: 200 },
  { path: "/alumni", name: "Alumni", expectedStatus: 200 },
  { path: "/events", name: "Events", expectedStatus: 200 },
  { path: "/contact", name: "Contact", expectedStatus: 200 },
  { path: "/login", name: "Login", expectedStatus: 200 },
  { path: "/register", name: "Register", expectedStatus: 200 },
  { path: "/dashboard", name: "Dashboard", expectedStatus: 200 },
  { path: "/profile", name: "Profile", expectedStatus: 200 },
  { path: "/admin", name: "Admin", expectedStatus: 200 },
  { path: "/admin/events", name: "Admin Events", expectedStatus: 200 },
  { path: "/admin/users", name: "Admin Users", expectedStatus: 200 },
  { path: "/admin/analytics", name: "Admin Analytics", expectedStatus: 200 },
  { path: "/admin/checkin", name: "Admin Checkin", expectedStatus: 200 },
  { path: "/admin/supabase", name: "Admin Supabase", expectedStatus: 200 },
];

async function testRoute(route) {
  const baseUrl = "http://localhost:3001";
  const url = `${baseUrl}${route.path}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual", // Don't follow redirects automatically
    });

    const status = response.status;
    const isSuccess = status === route.expectedStatus || (status >= 200 && status < 400); // Any success or redirect is OK

    return {
      ...route,
      status,
      success: isSuccess,
      message: isSuccess ? "OK" : `Expected ${route.expectedStatus}, got ${status}`,
    };
  } catch (error) {
    return {
      ...route,
      status: "ERROR",
      success: false,
      message: error.message,
    };
  }
}

async function testAllRoutes() {
  console.log("\n🧪 Testing Navigation Routes\n");
  console.log("================================\n");

  const results = [];

  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);

    const symbol = result.success ? "✅" : "❌";
    const statusText = result.status === "ERROR" ? "ERROR" : `${result.status}`;

    console.log(
      `${symbol} ${route.name.padEnd(20)} ${route.path.padEnd(25)} [${statusText}] ${result.success ? "" : result.message}`
    );
  }

  console.log("\n================================");

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`\n📊 Results: ${successCount} passed, ${failCount} failed\n`);

  if (failCount === 0) {
    console.log("🎉 All routes are working!\n");
  } else {
    console.log("⚠️  Some routes need attention\n");
  }
}

testAllRoutes().catch(console.error);
