#!/usr/bin/env tsx

/**
 * Environment Variable Validation Script
 * Run this script to validate your environment configuration
 *
 * Usage:
 *   npm run validate-env
 *   or
 *   tsx scripts/validate-env.ts
 */

import { config } from "dotenv";
import { checkServiceConfiguration } from "../lib/env";

// Load environment variables
config({ path: ".env" });
config({ path: ".env.local" });

console.log("🔍 ExJAM Alumni - Environment Validation");
console.log("==========================================\n");

async function validateEnv() {
  try {
    // Import env to trigger validation
    const { env } = await import("../lib/env");

    console.log("✅ Environment variables are valid!\n");

    // Check service configuration
    const serviceCheck = checkServiceConfiguration();

    if (serviceCheck.allConfigured) {
      console.log("🎉 All services are properly configured!");
      console.log(`✨ Configured services: ${serviceCheck.configured.join(", ")}`);
    } else {
      console.log(`⚠️  Some services need attention: ${serviceCheck.missing.join(", ")}`);
    }

    console.log("\n📋 Environment Summary:");
    console.log(`  • Database: ${env.DATABASE_URL ? "✅ Connected" : "❌ Not configured"}`);
    console.log(`  • Email: ${env.RESEND_API_KEY ? "✅ Configured" : "❌ Not configured"}`);
    console.log(`  • Payment: ${env.PAYSTACK_SECRET_KEY ? "✅ Configured" : "❌ Not configured"}`);
    console.log(`  • Auth: ${env.JWT_SECRET ? "✅ Configured" : "❌ Not configured"}`);
    console.log(`  • App URL: ${env.NEXT_PUBLIC_APP_URL}`);
    console.log(`  • Environment: ${env.NODE_ENV}`);

    if (env.NODE_ENV === "production") {
      console.log("\n🚀 Production Environment Checks:");

      const productionChecks = [
        {
          name: "JWT Secret Security",
          pass:
            env.JWT_SECRET !==
            "your-super-secret-jwt-key-minimum-32-characters-long-change-in-production",
          message: "JWT_SECRET should be changed from default value",
        },
        {
          name: "Paystack Production Keys",
          pass: env.PAYSTACK_SECRET_KEY?.startsWith("sk_live_"),
          message: "Consider using production Paystack keys (sk_live_...)",
        },
        {
          name: "HTTPS URLs",
          pass: env.NEXT_PUBLIC_APP_URL?.startsWith("https://"),
          message: "Production URLs should use HTTPS",
        },
      ];

      productionChecks.forEach((check) => {
        if (check.pass) {
          console.log(`  ✅ ${check.name}`);
        } else {
          console.log(`  ⚠️  ${check.name}: ${check.message}`);
        }
      });
    }

    console.log("\n🔧 Next Steps:");
    console.log("  1. Start your development server: npm run dev");
    console.log("  2. Run database migrations: npx prisma migrate dev");
    console.log("  3. Test email functionality: Visit /test-email endpoint");
    console.log("  4. Test payment: Complete a registration flow");

    process.exit(0);
  } catch (error) {
    console.error("❌ Environment validation failed!");
    console.error("Please fix the above issues and try again.\n");
    process.exit(1);
  }
}

// Call the async function
validateEnv();
