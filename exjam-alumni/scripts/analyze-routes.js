#!/usr/bin/env node

/**
 * Route Analysis Script
 * Analyzes all pages in the app directory and categorizes them
 */

const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "../app");

// Route categories
const routes = {
  public: [],
  auth: [],
  dashboard: [],
  admin: [],
  api: [],
  duplicates: [],
  testing: [],
  unused: [],
};

// Patterns for categorization
const patterns = {
  // Public routes
  public: /^\/(page\.tsx|about|events|contact|not-found\.tsx|global-error\.tsx)$/,

  // Auth routes
  auth: /^\/(auth|login|register|signup|create-account|forgot-password|reset-password|admin-login|api-login)/,

  // Dashboard/user routes
  dashboard: /^\/(dashboard|profile|badge|payment|alumni|connections|messages|membership)/,

  // Admin routes
  admin: /^\/admin/,

  // API routes
  api: /^\/api/,

  // Testing/setup routes
  testing: /^\/(test-|setup-|debug)/,

  // Known duplicates
  duplicates: /\/(enhanced-|simple-|backup|unified-|realtime-)/,
};

function analyzeDirectory(dirPath, basePath = "") {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other non-route directories
      if (!item.startsWith(".") && item !== "node_modules") {
        analyzeDirectory(itemPath, relativePath);
      }
    } else if (item === "page.tsx" || item === "route.ts") {
      categorizeRoute(relativePath.replace(/\/(page\.tsx|route\.ts)$/, "") || "/");
    } else if (
      item.endsWith(".tsx") &&
      (item === "not-found.tsx" || item === "global-error.tsx" || item === "layout.tsx")
    ) {
      categorizeRoute(relativePath);
    }
  }
}

function categorizeRoute(routePath) {
  const route = routePath.startsWith("/") ? routePath : "/" + routePath;

  // Check each pattern
  if (patterns.testing.test(route)) {
    routes.testing.push(route);
  } else if (patterns.duplicates.test(route)) {
    routes.duplicates.push(route);
  } else if (patterns.api.test(route)) {
    routes.api.push(route);
  } else if (patterns.admin.test(route)) {
    routes.admin.push(route);
  } else if (patterns.auth.test(route)) {
    routes.auth.push(route);
  } else if (patterns.dashboard.test(route)) {
    routes.dashboard.push(route);
  } else if (patterns.public.test(route)) {
    routes.public.push(route);
  } else {
    routes.unused.push(route);
  }
}

// Analyze routes
console.log("🔍 Analyzing route structure...\n");
analyzeDirectory(appDir);

// Generate report
console.log("📊 ROUTE ANALYSIS REPORT");
console.log("========================\n");

Object.entries(routes).forEach(([category, routeList]) => {
  if (routeList.length > 0) {
    const emoji = {
      public: "🌐",
      auth: "🔐",
      dashboard: "👤",
      admin: "👑",
      api: "🔌",
      duplicates: "🔄",
      testing: "🧪",
      unused: "❓",
    }[category];

    console.log(`${emoji} ${category.toUpperCase()} (${routeList.length})`);
    routeList.sort().forEach((route) => console.log(`   ${route}`));
    console.log();
  }
});

// Summary statistics
const totalRoutes = Object.values(routes).flat().length;
const coreRoutes =
  routes.public.length + routes.auth.length + routes.dashboard.length + routes.admin.length;
const bloat = routes.duplicates.length + routes.testing.length + routes.unused.length;

console.log("📈 SUMMARY");
console.log("==========");
console.log(`Total Routes: ${totalRoutes}`);
console.log(`Core Routes: ${coreRoutes}`);
console.log(`Route Bloat: ${bloat} (${Math.round((bloat / totalRoutes) * 100)}%)`);
console.log(`API Endpoints: ${routes.api.length}`);

// Recommendations
console.log("\n🎯 RECOMMENDATIONS");
console.log("==================");

if (routes.duplicates.length > 0) {
  console.log("🔄 CONSOLIDATE DUPLICATES:");
  routes.duplicates.forEach((route) => console.log(`   - Remove: ${route}`));
}

if (routes.testing.length > 0) {
  console.log("\n🧪 REMOVE TESTING ROUTES:");
  routes.testing.forEach((route) => console.log(`   - Remove: ${route}`));
}

if (routes.unused.length > 0) {
  console.log("\n❓ REVIEW UNUSED ROUTES:");
  routes.unused.forEach((route) => console.log(`   - Review: ${route}`));
}

console.log(
  `\n✅ Recommended final structure: ${coreRoutes} core routes + ${routes.api.length} API endpoints`
);
