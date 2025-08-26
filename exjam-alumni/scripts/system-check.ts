#!/usr/bin/env npx tsx

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { logger } from "../lib/logger";

interface SystemCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string[];
}

class SystemChecker {
  private checks: SystemCheck[] = [];

  private addCheck(
    name: string,
    status: "pass" | "fail" | "warn",
    message: string,
    details?: string[]
  ): void {
    this.checks.push({ name, status, message, details });

    const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
    console.log(`${icon} ${name}: ${message}`);

    if (details && details.length > 0) {
      details.forEach((detail) => console.log(`   - ${detail}`));
    }
  }

  async runAllChecks(): Promise<void> {
    console.log("🔍 Running comprehensive system checks...\\n");

    // 1. Check required files
    this.checkRequiredFiles();

    // 2. Check dependencies
    this.checkDependencies();

    // 3. Check build files
    this.checkBuildFiles();

    // 4. Check server status
    await this.checkServerStatus();

    // 5. Check static files
    this.checkStaticFiles();

    // 6. Check environment
    this.checkEnvironment();

    // 7. Check ports
    this.checkPorts();

    this.printSummary();
  }

  private checkRequiredFiles(): void {
    const requiredFiles = [
      "package.json",
      "next.config.js",
      "tailwind.config.ts",
      "tsconfig.json",
      "app/layout.tsx",
      "app/globals.css",
      "app/page.tsx",
    ];

    const missingFiles = requiredFiles.filter((file) => !existsSync(file));

    if (missingFiles.length === 0) {
      this.addCheck("Required Files", "pass", "All required files present");
    } else {
      this.addCheck("Required Files", "fail", "Missing required files", missingFiles);
    }
  }

  private checkDependencies(): void {
    try {
      const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
      const requiredDeps = ["next", "react", "react-dom", "typescript", "tailwindcss"];
      const missingDeps = requiredDeps.filter(
        (dep) => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
      );

      if (missingDeps.length === 0) {
        this.addCheck("Dependencies", "pass", "All core dependencies present");
      } else {
        this.addCheck("Dependencies", "fail", "Missing dependencies", missingDeps);
      }
    } catch (error) {
      this.addCheck("Dependencies", "fail", "Could not read package.json");
    }
  }

  private checkBuildFiles(): void {
    const buildFiles = [".next", ".next/cache", ".next/static"];

    const missingBuildFiles = buildFiles.filter((file) => !existsSync(file));

    if (missingBuildFiles.length === 0) {
      this.addCheck("Build Files", "pass", "Build files present");
    } else {
      this.addCheck(
        "Build Files",
        "warn",
        "Some build files missing - this is normal for first run",
        missingBuildFiles
      );
    }
  }

  private async checkServerStatus(): Promise<void> {
    try {
      const response = await fetch("http://localhost:3000/", { method: "HEAD" });
      if (response.ok) {
        this.addCheck("Server Status", "pass", "Server responding correctly");
      } else {
        this.addCheck("Server Status", "fail", `Server returned ${response.status}`);
      }
    } catch (error) {
      this.addCheck("Server Status", "fail", "Server not reachable");
    }
  }

  private checkStaticFiles(): void {
    const staticDirs = ["public", "public/images", "public/images/events"];

    const missingDirs = staticDirs.filter((dir) => !existsSync(dir));

    if (missingDirs.length === 0) {
      this.addCheck("Static Files", "pass", "Static directories present");
    } else {
      this.addCheck("Static Files", "warn", "Some static directories missing", missingDirs);
    }

    // Check for logo files
    const logoFiles = ["public/exjam-logo.svg", "public/afms-logo.png"];
    const missingLogos = logoFiles.filter((file) => !existsSync(file));

    if (missingLogos.length === 0) {
      this.addCheck("Logo Files", "pass", "Logo files present");
    } else {
      this.addCheck("Logo Files", "warn", "Some logo files missing", missingLogos);
    }
  }

  private checkEnvironment(): void {
    const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length === 0) {
      this.addCheck("Environment Variables", "pass", "Required environment variables set");
    } else {
      this.addCheck(
        "Environment Variables",
        "fail",
        "Missing environment variables",
        missingEnvVars
      );
    }
  }

  private checkPorts(): void {
    try {
      // Check if port 3000 is in use
      execSync("lsof -ti:3000", { stdio: "pipe" });
      this.addCheck("Port 3000", "pass", "Port 3000 is in use (server running)");
    } catch (error) {
      this.addCheck("Port 3000", "fail", "Port 3000 is not in use (server not running)");
    }
  }

  private printSummary(): void {
    console.log("\\n" + "=".repeat(50));
    console.log("📊 SYSTEM CHECK SUMMARY");
    console.log("=".repeat(50));

    const passed = this.checks.filter((c) => c.status === "pass").length;
    const failed = this.checks.filter((c) => c.status === "fail").length;
    const warnings = this.checks.filter((c) => c.status === "warn").length;

    console.log(`\\n✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    if (failed === 0) {
      console.log("\\n🎉 System is healthy!");
      console.log("\\n💡 If you are still seeing browser errors:");
      console.log("   - Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)");
      console.log("   - Disable browser extensions temporarily");
      console.log("   - Try incognito/private browsing mode");
      console.log("   - Check browser developer console for specific errors");
    } else {
      console.log("\\n⚠️  System has issues that need attention.");
      console.log("\\n🔧 Suggested fixes:");

      this.checks
        .filter((c) => c.status === "fail")
        .forEach((check) => {
          console.log(`   - ${check.name}: ${check.message}`);
          if (check.details) {
            check.details.forEach((detail) => console.log(`     • ${detail}`));
          }
        });
    }

    console.log("\\n🌐 Server URLs:");
    console.log("   - Local: http://localhost:3000");
    console.log("   - Network: http://10.0.0.219:3000");
    console.log("   - Monitoring: http://localhost:3000/admin/monitoring");
  }
}

// Run checks if executed directly
if (require.main === module) {
  const checker = new SystemChecker();
  checker.runAllChecks().catch((error) => {
    console.error("❌ System check failed:", error);
    process.exit(1);
  });
}

export { SystemChecker };
