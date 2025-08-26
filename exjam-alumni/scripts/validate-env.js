#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required environment variables are set before starting the application
 */

const fs = require("fs");
const path = require("path");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Required environment variables
const requiredVars = {
  // Database
  DATABASE_URL: {
    description: "PostgreSQL database connection string",
    example: "postgresql://user:password@localhost:5432/exjam_alumni",
    validate: (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
  },

  // Authentication
  JWT_SECRET: {
    description: "Secret key for JWT token signing (min 32 characters)",
    example: "your-super-secret-jwt-key-minimum-32-characters",
    validate: (value) =>
      value.length >= 32 &&
      value !== "your-super-secret-jwt-key-minimum-32-characters-long-change-in-production",
  },

  // Email Service
  RESEND_API_KEY: {
    description: "Resend API key for sending emails",
    example: "re_1234567890abcdef",
    validate: (value) => value.startsWith("re_"),
  },

  // Payment Processing
  PAYSTACK_SECRET_KEY: {
    description: "Paystack secret key for payment processing",
    example: "sk_test_1234567890abcdef",
    validate: (value) => value.startsWith("sk_"),
  },
  PAYSTACK_PUBLIC_KEY: {
    description: "Paystack public key for client-side integration",
    example: "pk_test_1234567890abcdef",
    validate: (value) => value.startsWith("pk_"),
  },

  // Application URLs
  NEXT_PUBLIC_APP_URL: {
    description: "Public URL of the application",
    example: "https://exjamalumni.org",
    validate: (value) => value.startsWith("http://") || value.startsWith("https://"),
  },
};

// Optional environment variables
const optionalVars = {
  DIRECT_URL: "Direct database connection for migrations",
  NEXT_PUBLIC_URL: "Alternative public URL configuration",
  NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anonymous key",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key",
  NODE_ENV: "Node environment (development/production/test)",
  SKIP_ENV_VALIDATION: "Skip environment validation (true/false)",
};

function validateEnvironment() {
  // Check if validation should be skipped
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    console.log(`${colors.cyan}⚠️  Environment validation skipped${colors.reset}\n`);
    return;
  }

  console.log(`${colors.cyan}🔍 Validating Environment Variables...${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;
  const errors = [];
  const warnings = [];

  // Check required variables
  console.log(`${colors.blue}Required Variables:${colors.reset}`);
  for (const [varName, config] of Object.entries(requiredVars)) {
    const value = process.env[varName];

    if (!value) {
      hasErrors = true;
      errors.push(`  ${colors.red}✗${colors.reset} ${varName}: Not set`);
      console.log(
        `  ${colors.red}✗${colors.reset} ${varName}: ${colors.red}Not set${colors.reset}`
      );
      console.log(`    ${colors.yellow}→ ${config.description}${colors.reset}`);
      console.log(`    ${colors.cyan}Example: ${config.example}${colors.reset}`);
    } else if (config.validate && !config.validate(value)) {
      hasErrors = true;
      errors.push(`  ${colors.red}✗${colors.reset} ${varName}: Invalid format`);
      console.log(
        `  ${colors.red}✗${colors.reset} ${varName}: ${colors.red}Invalid format${colors.reset}`
      );
      console.log(`    ${colors.yellow}→ ${config.description}${colors.reset}`);
      console.log(`    ${colors.cyan}Example: ${config.example}${colors.reset}`);
    } else {
      console.log(
        `  ${colors.green}✓${colors.reset} ${varName}: ${colors.green}Set${colors.reset}`
      );
    }
  }

  // Check optional variables
  console.log(`\n${colors.blue}Optional Variables:${colors.reset}`);
  for (const [varName, description] of Object.entries(optionalVars)) {
    const value = process.env[varName];

    if (!value) {
      hasWarnings = true;
      warnings.push(`  ${colors.yellow}⚠${colors.reset} ${varName}: Not set`);
      console.log(
        `  ${colors.yellow}⚠${colors.reset} ${varName}: ${colors.yellow}Not set${colors.reset}`
      );
      console.log(`    ${colors.cyan}→ ${description}${colors.reset}`);
    } else {
      console.log(
        `  ${colors.green}✓${colors.reset} ${varName}: ${colors.green}Set${colors.reset}`
      );
    }
  }

  // Check for .env file
  console.log(`\n${colors.blue}Environment Files:${colors.reset}`);
  const envFiles = [".env", ".env.local", ".env.production"];
  let foundEnvFile = false;

  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ${colors.green}✓${colors.reset} ${file}: Found`);
      foundEnvFile = true;
    }
  }

  if (!foundEnvFile) {
    console.log(`  ${colors.yellow}⚠${colors.reset} No .env file found`);
    warnings.push("No .env file found");
  }

  // Summary
  console.log(`\n${colors.cyan}${"=".repeat(50)}${colors.reset}`);

  if (hasErrors) {
    console.log(`\n${colors.red}❌ Environment Validation Failed${colors.reset}`);
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    errors.forEach((error) => console.log(error));
    console.log(`\n${colors.yellow}💡 Tips:${colors.reset}`);
    console.log("  1. Copy .env.example to .env");
    console.log("  2. Fill in all required variables");
    console.log("  3. Check the documentation for setup instructions");
    console.log(`\n${colors.cyan}📚 See .env.example for the required format${colors.reset}\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`\n${colors.yellow}⚠️  Environment Validation Passed with Warnings${colors.reset}`);
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    warnings.forEach((warning) => console.log(warning));
    console.log(`\n${colors.green}✅ All required variables are set${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}✅ Environment Validation Passed${colors.reset}`);
    console.log(
      `${colors.green}All environment variables are properly configured!${colors.reset}\n`
    );
  }

  // Production-specific checks
  if (process.env.NODE_ENV === "production") {
    console.log(`${colors.magenta}🚀 Production Environment Checks:${colors.reset}`);

    // Check for test keys in production
    const testKeyWarnings = [];
    if (process.env.PAYSTACK_SECRET_KEY?.includes("test")) {
      testKeyWarnings.push("  ⚠️  Using test Paystack keys in production");
    }
    if (process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
      testKeyWarnings.push("  ⚠️  Using localhost URL in production");
    }

    if (testKeyWarnings.length > 0) {
      console.log(`${colors.yellow}Warnings:${colors.reset}`);
      testKeyWarnings.forEach((warning) =>
        console.log(`${colors.yellow}${warning}${colors.reset}`)
      );
    } else {
      console.log(`  ${colors.green}✓ Production configuration looks good${colors.reset}`);
    }
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  // Load .env file if it exists
  try {
    require("dotenv").config();
  } catch (e) {
    // dotenv might not be installed, that's okay
  }

  validateEnvironment();
}

module.exports = { validateEnvironment };
