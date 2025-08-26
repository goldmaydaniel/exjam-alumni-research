import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from "web-vitals";

// Performance monitoring and reporting
export class PerformanceMonitor {
  private static metrics: Map<string, Metric> = new Map();
  private static reportingEndpoint = "/api/analytics/performance";

  static init() {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Collect Core Web Vitals
    getCLS(this.handleMetric.bind(this));
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this));
    getTTFB(this.handleMetric.bind(this));

    // Custom metrics
    this.measureCustomMetrics();

    // Report on page unload
    this.setupReporting();
  }

  private static handleMetric(metric: Metric) {
    console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
    this.metrics.set(metric.name, metric);

    // Send immediately for critical metrics
    if (metric.name === "LCP" || metric.name === "FID" || metric.name === "CLS") {
      this.reportMetric(metric);
    }
  }

  private static measureCustomMetrics() {
    // Measure React hydration time
    const hydrationStart = performance.mark("hydration-start");

    // Listen for React hydration completion
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        performance.mark("hydration-end");
        performance.measure("react-hydration", "hydration-start", "hydration-end");

        const hydrationMeasure = performance.getEntriesByName("react-hydration")[0];
        if (hydrationMeasure) {
          this.reportCustomMetric("hydration", hydrationMeasure.duration);
        }
      });
    }

    // Measure API response times
    this.interceptFetch();

    // Measure route changes (for Next.js)
    this.measureRouteChanges();
  }

  private static interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const start = performance.now();
      const url = typeof args[0] === "string" ? args[0] : args[0].url;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        // Only track API calls
        if (url.includes("/api/")) {
          this.reportCustomMetric("api-response-time", duration, {
            endpoint: url,
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.reportCustomMetric("api-error-time", duration, {
          endpoint: url,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    };
  }

  private static measureRouteChanges() {
    // Track Next.js route changes
    let routeChangeStart = 0;

    const handleRouteChangeStart = () => {
      routeChangeStart = performance.now();
    };

    const handleRouteChangeComplete = () => {
      if (routeChangeStart) {
        const duration = performance.now() - routeChangeStart;
        this.reportCustomMetric("route-change-time", duration);
        routeChangeStart = 0;
      }
    };

    // Next.js router events
    if (typeof window !== "undefined" && (window as any).__NEXT_DATA__) {
      const router = (window as any).next?.router;
      if (router) {
        router.events.on("routeChangeStart", handleRouteChangeStart);
        router.events.on("routeChangeComplete", handleRouteChangeComplete);
      }
    }
  }

  private static setupReporting() {
    // Send metrics before page unload
    window.addEventListener("beforeunload", () => {
      this.sendBatch();
    });

    // Send metrics periodically
    setInterval(() => {
      this.sendBatch();
    }, 30000); // Every 30 seconds

    // Send on visibility change (when user switches tabs)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.sendBatch();
      }
    });
  }

  private static async reportMetric(metric: Metric) {
    try {
      await fetch(this.reportingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "web-vital",
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      });
    } catch (error) {
      console.error("Failed to report metric:", error);
    }
  }

  private static reportCustomMetric(name: string, value: number, metadata?: any) {
    try {
      fetch(this.reportingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom-metric",
          name,
          value,
          metadata,
          timestamp: Date.now(),
          url: window.location.href,
        }),
        keepalive: true,
      }).catch(console.error);
    } catch (error) {
      console.error("Failed to report custom metric:", error);
    }
  }

  private static sendBatch() {
    const metricsArray = Array.from(this.metrics.values());
    if (metricsArray.length === 0) return;

    try {
      navigator.sendBeacon(
        this.reportingEndpoint,
        JSON.stringify({
          type: "batch",
          metrics: metricsArray,
          timestamp: Date.now(),
          url: window.location.href,
        })
      );

      // Clear sent metrics
      this.metrics.clear();
    } catch (error) {
      console.error("Failed to send metrics batch:", error);
    }
  }

  // Manual performance markers
  static mark(name: string) {
    if (typeof performance !== "undefined") {
      performance.mark(name);
    }
  }

  static measure(name: string, startMark: string, endMark?: string) {
    if (typeof performance !== "undefined") {
      try {
        const measure = endMark
          ? performance.measure(name, startMark, endMark)
          : performance.measure(name, startMark);

        const entry = performance.getEntriesByName(name)[0];
        if (entry) {
          this.reportCustomMetric(name, entry.duration);
        }

        return measure;
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
      }
    }
  }

  // Memory usage monitoring
  static getMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSMemory: memory.usedJSMemory,
        totalJSMemory: memory.totalJSMemory,
        jsMemoryLimit: memory.jsMemoryLimit,
      };
    }
    return null;
  }

  // Network information
  static getNetworkInfo() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  // Device information
  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    };
  }
}

// React Hook for performance monitoring
export function usePerformanceMonitor() {
  const measureComponentRender = (componentName: string) => {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      PerformanceMonitor.reportCustomMetric("component-render", duration, {
        component: componentName,
      });
    };
  };

  const measureAsyncOperation = async <T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - start;

      PerformanceMonitor.reportCustomMetric("async-operation", duration, {
        operation: name,
        status: "success",
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      PerformanceMonitor.reportCustomMetric("async-operation", duration, {
        operation: name,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  };

  return {
    measureComponentRender,
    measureAsyncOperation,
    mark: PerformanceMonitor.mark,
    measure: PerformanceMonitor.measure,
  };
}

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    "first-contentful-paint": 1800, // 1.8s
    "largest-contentful-paint": 2500, // 2.5s
    "first-input-delay": 100, // 100ms
    "cumulative-layout-shift": 0.1, // 0.1
    "total-blocking-time": 300, // 300ms
    "bundle-size": 500 * 1024, // 500KB
    "api-response-time": 1000, // 1s
  };

  static checkBudget(metric: string, value: number): boolean {
    const budget = this.budgets[metric as keyof typeof this.budgets];
    if (budget === undefined) return true;

    const withinBudget = value <= budget;

    if (!withinBudget) {
      console.warn(`Performance budget exceeded for ${metric}:`, {
        actual: value,
        budget,
        exceededBy: value - budget,
      });
    }

    return withinBudget;
  }

  static setBudget(metric: string, value: number) {
    (this.budgets as any)[metric] = value;
  }
}

// Initialize performance monitoring
if (typeof window !== "undefined") {
  // Wait for app to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => PerformanceMonitor.init(), 1000);
    });
  } else {
    setTimeout(() => PerformanceMonitor.init(), 1000);
  }
}
