const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Performance testing suite
class PerformanceTester {
  constructor() {
    this.results = {};
    this.thresholds = {
      bundleSize: {
        total: 1024 * 1024, // 1MB
        js: 800 * 1024, // 800KB
        css: 200 * 1024, // 200KB
      },
      loadTime: {
        fcp: 1800, // First Contentful Paint: 1.8s
        lcp: 2500, // Largest Contentful Paint: 2.5s
        fid: 100, // First Input Delay: 100ms
        cls: 0.1, // Cumulative Layout Shift: 0.1
        ttfb: 600, // Time to First Byte: 600ms
      },
    };
  }

  // Run bundle analysis
  async analyzeBundleSize() {
    console.log("🔍 Analyzing bundle size...");

    return new Promise((resolve, reject) => {
      const env = { ...process.env, ANALYZE: "true" };

      exec("npm run build", { env }, (error, stdout, stderr) => {
        if (error) {
          console.error("Bundle build failed:", error);
          reject(error);
          return;
        }

        // Parse build output to extract size information
        const buildStatsPath = path.join(process.cwd(), ".next/static");

        try {
          const stats = this.getBundleStats(buildStatsPath);
          this.results.bundleSize = stats;

          console.log("📦 Bundle Analysis Results:");
          console.log(`  Total JS: ${this.formatBytes(stats.jsSize)}`);
          console.log(`  Total CSS: ${this.formatBytes(stats.cssSize)}`);
          console.log(`  Total Size: ${this.formatBytes(stats.totalSize)}`);

          // Check against thresholds
          this.checkBundleThresholds(stats);
          resolve(stats);
        } catch (parseError) {
          console.error("Failed to parse bundle stats:", parseError);
          reject(parseError);
        }
      });
    });
  }

  // Get bundle statistics
  getBundleStats(buildPath) {
    const stats = {
      jsSize: 0,
      cssSize: 0,
      totalSize: 0,
      files: [],
    };

    const scanDirectory = (dirPath) => {
      if (!fs.existsSync(dirPath)) return;

      const files = fs.readdirSync(dirPath);

      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else {
          const size = stat.size;
          stats.totalSize += size;

          if (file.endsWith(".js")) {
            stats.jsSize += size;
          } else if (file.endsWith(".css")) {
            stats.cssSize += size;
          }

          stats.files.push({
            name: file,
            size: size,
            path: filePath,
          });
        }
      });
    };

    scanDirectory(buildPath);
    return stats;
  }

  // Check bundle size against thresholds
  checkBundleThresholds(stats) {
    const issues = [];

    if (stats.totalSize > this.thresholds.bundleSize.total) {
      issues.push(
        `Total bundle size (${this.formatBytes(stats.totalSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize.total)})`
      );
    }

    if (stats.jsSize > this.thresholds.bundleSize.js) {
      issues.push(
        `JS bundle size (${this.formatBytes(stats.jsSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize.js)})`
      );
    }

    if (stats.cssSize > this.thresholds.bundleSize.css) {
      issues.push(
        `CSS bundle size (${this.formatBytes(stats.cssSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize.css)})`
      );
    }

    if (issues.length > 0) {
      console.log("\n⚠️  Bundle Size Issues:");
      issues.forEach((issue) => console.log(`  - ${issue}`));
      console.log("\n💡 Consider code splitting, tree shaking, or removing unused dependencies");
    } else {
      console.log("\n✅ Bundle sizes are within acceptable thresholds");
    }
  }

  // Test Lighthouse performance
  async testLighthouse(url = "http://localhost:3000") {
    console.log("🚦 Running Lighthouse performance audit...");

    return new Promise((resolve, reject) => {
      const lighthouseCmd = `npx lighthouse ${url} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless" --only-categories=performance`;

      exec(lighthouseCmd, (error, stdout, stderr) => {
        if (error) {
          console.error("Lighthouse test failed:", error);
          reject(error);
          return;
        }

        try {
          const reportPath = path.join(process.cwd(), "lighthouse-report.json");
          const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

          const metrics = this.parseLighthouseMetrics(report);
          this.results.lighthouse = metrics;

          console.log("🚦 Lighthouse Results:");
          console.log(`  Performance Score: ${metrics.performanceScore}/100`);
          console.log(`  First Contentful Paint: ${metrics.fcp}ms`);
          console.log(`  Largest Contentful Paint: ${metrics.lcp}ms`);
          console.log(`  First Input Delay: ${metrics.fid}ms`);
          console.log(`  Cumulative Layout Shift: ${metrics.cls}`);

          this.checkLighthouseThresholds(metrics);
          resolve(metrics);
        } catch (parseError) {
          console.error("Failed to parse Lighthouse report:", parseError);
          reject(parseError);
        }
      });
    });
  }

  // Parse Lighthouse metrics
  parseLighthouseMetrics(report) {
    const audits = report.audits;

    return {
      performanceScore: Math.round(report.categories.performance.score * 100),
      fcp: audits["first-contentful-paint"]?.numericValue || 0,
      lcp: audits["largest-contentful-paint"]?.numericValue || 0,
      fid: audits["first-input-delay"]?.numericValue || 0,
      cls: audits["cumulative-layout-shift"]?.numericValue || 0,
      ttfb: audits["time-to-first-byte"]?.numericValue || 0,
      speedIndex: audits["speed-index"]?.numericValue || 0,
      totalBlockingTime: audits["total-blocking-time"]?.numericValue || 0,
    };
  }

  // Check Lighthouse metrics against thresholds
  checkLighthouseThresholds(metrics) {
    const issues = [];

    if (metrics.fcp > this.thresholds.loadTime.fcp) {
      issues.push(
        `First Contentful Paint (${metrics.fcp}ms) exceeds threshold (${this.thresholds.loadTime.fcp}ms)`
      );
    }

    if (metrics.lcp > this.thresholds.loadTime.lcp) {
      issues.push(
        `Largest Contentful Paint (${metrics.lcp}ms) exceeds threshold (${this.thresholds.loadTime.lcp}ms)`
      );
    }

    if (metrics.fid > this.thresholds.loadTime.fid) {
      issues.push(
        `First Input Delay (${metrics.fid}ms) exceeds threshold (${this.thresholds.loadTime.fid}ms)`
      );
    }

    if (metrics.cls > this.thresholds.loadTime.cls) {
      issues.push(
        `Cumulative Layout Shift (${metrics.cls}) exceeds threshold (${this.thresholds.loadTime.cls})`
      );
    }

    if (issues.length > 0) {
      console.log("\n⚠️  Performance Issues:");
      issues.forEach((issue) => console.log(`  - ${issue}`));
      console.log(
        "\n💡 Consider optimizing images, reducing bundle size, or implementing lazy loading"
      );
    } else {
      console.log("\n✅ All Core Web Vitals are within acceptable thresholds");
    }
  }

  // Test API performance
  async testApiPerformance() {
    console.log("🔌 Testing API performance...");

    const endpoints = ["/api/events", "/api/auth/profile", "/api/registrations", "/api/analytics"];

    const results = [];

    for (const endpoint of endpoints) {
      const url = `http://localhost:3000${endpoint}`;
      console.log(`  Testing ${endpoint}...`);

      try {
        const start = Date.now();
        const response = await fetch(url, {
          headers: {
            Authorization: "Bearer test-token", // You might need to adjust this
          },
        });
        const duration = Date.now() - start;

        results.push({
          endpoint,
          duration,
          status: response.status,
          ok: response.ok,
        });

        console.log(`    ${endpoint}: ${duration}ms (${response.status})`);
      } catch (error) {
        console.error(`    ${endpoint}: Failed -`, error.message);
        results.push({
          endpoint,
          duration: -1,
          status: 0,
          ok: false,
          error: error.message,
        });
      }
    }

    this.results.apiPerformance = results;
    return results;
  }

  // Generate comprehensive report
  generateReport() {
    const reportPath = path.join(process.cwd(), "performance-report.json");
    const htmlReportPath = path.join(process.cwd(), "performance-report.html");

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      thresholds: this.thresholds,
      summary: this.generateSummary(),
    };

    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`\n📊 Performance report saved:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);

    return report;
  }

  // Generate summary
  generateSummary() {
    const summary = {
      overallScore: "UNKNOWN",
      criticalIssues: 0,
      warnings: 0,
      passed: 0,
    };

    // Calculate based on results
    if (this.results.lighthouse) {
      const score = this.results.lighthouse.performanceScore;
      if (score >= 90) summary.overallScore = "EXCELLENT";
      else if (score >= 70) summary.overallScore = "GOOD";
      else if (score >= 50) summary.overallScore = "NEEDS_IMPROVEMENT";
      else summary.overallScore = "POOR";
    }

    return summary;
  }

  // Generate HTML report
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>EXJAM Alumni - Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .metric { display: inline-block; margin: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .score { font-size: 2em; font-weight: bold; }
        .good { color: #22c55e; }
        .warning { color: #f59e0b; }
        .critical { color: #ef4444; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .table th { background-color: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>EXJAM Alumni Performance Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    ${
      this.results.lighthouse
        ? `
    <h2>Core Web Vitals</h2>
    <div class="metric">
        <div class="score ${report.results.lighthouse.performanceScore >= 90 ? "good" : report.results.lighthouse.performanceScore >= 70 ? "warning" : "critical"}">
            ${report.results.lighthouse.performanceScore}/100
        </div>
        <div>Performance Score</div>
    </div>
    <div class="metric">
        <div class="score ${report.results.lighthouse.fcp <= 1800 ? "good" : "warning"}">
            ${report.results.lighthouse.fcp}ms
        </div>
        <div>First Contentful Paint</div>
    </div>
    <div class="metric">
        <div class="score ${report.results.lighthouse.lcp <= 2500 ? "good" : "warning"}">
            ${report.results.lighthouse.lcp}ms
        </div>
        <div>Largest Contentful Paint</div>
    </div>
    `
        : ""
    }
    
    ${
      this.results.bundleSize
        ? `
    <h2>Bundle Size Analysis</h2>
    <table class="table">
        <tr><th>Asset Type</th><th>Size</th><th>Status</th></tr>
        <tr>
            <td>JavaScript</td>
            <td>${this.formatBytes(report.results.bundleSize.jsSize)}</td>
            <td class="${report.results.bundleSize.jsSize <= this.thresholds.bundleSize.js ? "good" : "warning"}">
                ${report.results.bundleSize.jsSize <= this.thresholds.bundleSize.js ? "✅ Good" : "⚠️ Large"}
            </td>
        </tr>
        <tr>
            <td>CSS</td>
            <td>${this.formatBytes(report.results.bundleSize.cssSize)}</td>
            <td class="${report.results.bundleSize.cssSize <= this.thresholds.bundleSize.css ? "good" : "warning"}">
                ${report.results.bundleSize.cssSize <= this.thresholds.bundleSize.css ? "✅ Good" : "⚠️ Large"}
            </td>
        </tr>
        <tr>
            <td>Total</td>
            <td>${this.formatBytes(report.results.bundleSize.totalSize)}</td>
            <td class="${report.results.bundleSize.totalSize <= this.thresholds.bundleSize.total ? "good" : "warning"}">
                ${report.results.bundleSize.totalSize <= this.thresholds.bundleSize.total ? "✅ Good" : "⚠️ Large"}
            </td>
        </tr>
    </table>
    `
        : ""
    }
</body>
</html>`;
  }

  // Utility methods
  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Run all tests
  async runAll() {
    console.log("🚀 Starting comprehensive performance test suite...\n");

    try {
      await this.analyzeBundleSize();
      console.log("");

      // Only run API and Lighthouse tests if server is running
      try {
        await this.testApiPerformance();
        console.log("");
        await this.testLighthouse();
      } catch (error) {
        console.log("⚠️  Skipping live tests (server not running)");
      }

      const report = this.generateReport();

      console.log("\n🎉 Performance testing complete!");
      console.log(`Overall Score: ${report.summary.overallScore}`);

      return report;
    } catch (error) {
      console.error("Performance test failed:", error);
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAll();
}

module.exports = PerformanceTester;
