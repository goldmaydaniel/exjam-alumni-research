#!/usr/bin/env npx tsx

import { execSync } from "child_process";
import { logger } from "../lib/logger";
import { validateEnvironment } from "../lib/validation";

interface ValidationResult {
  name: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  duration: number;
}

class ProjectValidator {
  private results: ValidationResult[] = [];

  async runValidation(name: string, command: string): Promise<ValidationResult> {
    const startTime = Date.now();
    const result: ValidationResult = {
      name,
      success: false,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      logger.info(`Running validation: ${name}`, "validator");

      const output = execSync(command, {
        encoding: "utf-8",
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });

      result.success = true;
      result.duration = Date.now() - startTime;

      // Parse output for warnings
      const lines = output.split("\\n");
      const warningLines = lines.filter((line) => line.includes("warning") || line.includes("⚠"));
      result.warnings = warningLines;

      logger.info(`✅ ${name} passed (${result.duration}ms)`, "validator");
    } catch (error: any) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors = error.stdout ? error.stdout.split("\\n").filter(Boolean) : [error.message];

      logger.error(`❌ ${name} failed (${result.duration}ms)`, error, "validator");
    }

    this.results.push(result);
    return result;
  }

  async validateAll(): Promise<void> {
    console.log("🔍 Starting comprehensive project validation...\\n");

    // 1. Environment validation
    console.log("📋 Environment Variables...");
    try {
      const env = validateEnvironment();
      this.results.push({
        name: "Environment Variables",
        success: !!env,
        errors: env ? [] : ["Environment validation failed"],
        warnings: [],
        duration: 0,
      });
      console.log("✅ Environment variables validated\\n");
    } catch (error) {
      console.log("❌ Environment validation failed\\n");
    }

    // 2. TypeScript type checking
    console.log("🔧 TypeScript Type Checking...");
    await this.runValidation("TypeScript", "npx tsc --noEmit");

    // 3. ESLint code quality
    console.log("🔍 ESLint Code Quality...");
    await this.runValidation("ESLint", "npx eslint . --ext .ts,.tsx --max-warnings 50");

    // 4. Next.js build test
    console.log("🏗️ Next.js Build Test...");
    await this.runValidation("Next.js Build", "npx next build --no-lint");

    // 5. Prisma schema validation
    console.log("🗄️ Database Schema...");
    await this.runValidation("Prisma Schema", "npx prisma validate");

    // 6. Package security audit
    console.log("🔒 Security Audit...");
    await this.runValidation("Security Audit", "npm audit --audit-level moderate");

    // 7. Dependencies check
    console.log("📦 Dependencies Check...");
    await this.runValidation("Dependencies", "npm ls --depth=0");

    this.printResults();
  }

  private printResults(): void {
    console.log("\\n" + "=".repeat(60));
    console.log("📊 VALIDATION SUMMARY");
    console.log("=".repeat(60));

    const passed = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`\\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${totalWarnings}`);
    console.log(`🚨 Errors: ${totalErrors}`);

    console.log("\\n📋 Detailed Results:");
    console.log("-".repeat(40));

    for (const result of this.results) {
      const status = result.success ? "✅" : "❌";
      const duration = result.duration > 0 ? ` (${result.duration}ms)` : "";
      console.log(`${status} ${result.name}${duration}`);

      if (result.warnings.length > 0) {
        console.log(`   ⚠️  ${result.warnings.length} warnings`);
      }

      if (result.errors.length > 0) {
        console.log(`   🚨 ${result.errors.length} errors`);
        if (process.env.VERBOSE) {
          result.errors.slice(0, 3).forEach((error) => {
            console.log(`      - ${error.substring(0, 100)}...`);
          });
        }
      }
    }

    if (failed === 0) {
      console.log("\\n🎉 All validations passed! Your project is ready for deployment.");
    } else {
      console.log("\\n⚠️  Some validations failed. Please review the errors above.");
    }

    console.log("\\n💡 Tips:");
    console.log("- Run with VERBOSE=true for detailed error messages");
    console.log("- Use `npm run fix-lint` to automatically fix common issues");
    console.log("- Check the monitoring dashboard at /admin/monitoring for runtime errors");
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ProjectValidator();
  validator.validateAll().catch((error) => {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  });
}

export { ProjectValidator };
