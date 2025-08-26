"use client";

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from "web-vitals";

// Advanced performance profiling and real-time optimization
export class PerformanceProfiler {
  private static metrics: Map<string, Metric[]> = new Map();
  private static customMetrics: Map<string, number[]> = new Map();
  private static performanceEntries: PerformanceEntry[] = [];
  private static isProfilingActive = false;
  private static observers: PerformanceObserver[] = [];

  static init() {
    if (typeof window === "undefined" || this.isProfilingActive) return;

    this.isProfilingActive = true;
    this.initCoreWebVitals();
    this.initCustomMetrics();
    this.initPerformanceObservers();
    this.initRealTimeOptimization();
    this.setupReporting();
  }

  // Core Web Vitals monitoring
  private static initCoreWebVitals() {
    const handleMetric = (metric: Metric) => {
      console.log(`${metric.name}: ${metric.value}ms (${metric.rating})`);

      const existing = this.metrics.get(metric.name) || [];
      existing.push(metric);
      this.metrics.set(metric.name, existing);

      // Real-time optimization based on metrics
      this.optimizeBasedOnMetric(metric);

      // Send to analytics
      this.sendMetricToAnalytics(metric);
    };

    getCLS(handleMetric);
    getFID(handleMetric);
    getFCP(handleMetric);
    getLCP(handleMetric);
    getTTFB(handleMetric);
  }

  // Custom application metrics
  private static initCustomMetrics() {
    // Component render time tracking
    this.trackMetric("component-renders", 0);
    this.trackMetric("api-calls", 0);
    this.trackMetric("image-loads", 0);
    this.trackMetric("user-interactions", 0);

    // Memory usage tracking
    this.startMemoryTracking();

    // Network performance tracking
    this.startNetworkTracking();
  }

  // Performance observers for detailed insights
  private static initPerformanceObservers() {
    // Navigation timing
    if ("PerformanceObserver" in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.performanceEntries.push(entry);

          if (entry.entryType === "navigation") {
            this.analyzeNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });

      try {
        navObserver.observe({ entryTypes: ["navigation"] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn("Navigation observer not supported");
      }

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.analyzeResourceTiming(entry);
        });
      });

      try {
        resourceObserver.observe({ entryTypes: ["resource"] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn("Resource observer not supported");
      }

      // Long tasks detection
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn("Long task detected:", {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });
          this.optimizeForLongTasks();
        });
      });

      try {
        longTaskObserver.observe({ entryTypes: ["longtask"] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn("Long task observer not supported");
      }

      // Layout shift detection
      const layoutShiftObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.value > 0.1) {
            console.warn("Significant layout shift detected:", entry);
            this.preventLayoutShifts();
          }
        });
      });

      try {
        layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.warn("Layout shift observer not supported");
      }
    }
  }

  // Real-time performance optimization
  private static initRealTimeOptimization() {
    // Monitor device capabilities
    this.adaptToDeviceCapabilities();

    // Monitor network conditions
    this.adaptToNetworkConditions();

    // Monitor battery status
    this.adaptToBatteryStatus();
  }

  // Metric tracking and analysis
  static trackMetric(name: string, value: number, metadata?: any) {
    const existing = this.customMetrics.get(name) || [];
    existing.push(value);

    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.shift();
    }

    this.customMetrics.set(name, existing);

    // Log performance budget violations
    this.checkPerformanceBudget(name, value);
  }

  static startTimer(name: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.trackMetric(name, duration);
      return duration;
    };
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();

    return fn().finally(() => {
      const duration = performance.now() - start;
      this.trackMetric(name, duration);
    });
  }

  // Component-specific profiling
  static profileComponent(componentName: string) {
    const start = performance.now();
    let renderCount = 0;

    return {
      onRender: () => {
        renderCount++;
        const duration = performance.now() - start;
        this.trackMetric(`${componentName}-render`, duration);
      },

      onUnmount: () => {
        const totalDuration = performance.now() - start;
        this.trackMetric(`${componentName}-lifetime`, totalDuration);
        this.trackMetric(`${componentName}-render-count`, renderCount);
      },
    };
  }

  // Analysis methods
  private static analyzeNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      "dns-lookup": entry.domainLookupEnd - entry.domainLookupStart,
      "tcp-connect": entry.connectEnd - entry.connectStart,
      "ssl-handshake": entry.requestStart - entry.secureConnectionStart,
      "server-response": entry.responseStart - entry.requestStart,
      "dom-processing": entry.domContentLoadedEventStart - entry.responseEnd,
      "resource-loading": entry.loadEventStart - entry.domContentLoadedEventEnd,
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.trackMetric(name, value);
      }
    });
  }

  private static analyzeResourceTiming(entry: PerformanceEntry) {
    const resourceEntry = entry as PerformanceResourceTiming;

    // Identify slow resources
    if (resourceEntry.duration > 1000) {
      console.warn("Slow resource detected:", {
        name: resourceEntry.name,
        duration: resourceEntry.duration,
        size: resourceEntry.transferSize,
      });

      this.optimizeSlowResource(resourceEntry);
    }

    // Track by resource type
    const url = new URL(resourceEntry.name);
    const extension = url.pathname.split(".").pop()?.toLowerCase();

    const resourceType = this.getResourceType(extension || "");
    this.trackMetric(`resource-${resourceType}`, resourceEntry.duration);
  }

  private static getResourceType(extension: string): string {
    const types: { [key: string]: string } = {
      js: "javascript",
      css: "stylesheet",
      png: "image",
      jpg: "image",
      jpeg: "image",
      gif: "image",
      svg: "image",
      webp: "image",
      avif: "image",
      woff: "font",
      woff2: "font",
      ttf: "font",
    };

    return types[extension] || "other";
  }

  // Optimization strategies
  private static optimizeBasedOnMetric(metric: Metric) {
    switch (metric.name) {
      case "LCP":
        if (metric.value > 2500) {
          this.optimizeLargestContentfulPaint();
        }
        break;

      case "FID":
        if (metric.value > 100) {
          this.optimizeFirstInputDelay();
        }
        break;

      case "CLS":
        if (metric.value > 0.1) {
          this.preventLayoutShifts();
        }
        break;

      case "FCP":
        if (metric.value > 1800) {
          this.optimizeFirstContentfulPaint();
        }
        break;
    }
  }

  private static optimizeLargestContentfulPaint() {
    // Preload LCP candidates
    const lcpCandidates = document.querySelectorAll("img, h1, h2, p");
    lcpCandidates.forEach((element, index) => {
      if (index < 3) {
        // Top 3 candidates
        if (element.tagName === "IMG") {
          (element as HTMLImageElement).loading = "eager";
        }
      }
    });

    // Reduce image quality for faster loading
    this.reduceImageQuality();
  }

  private static optimizeFirstInputDelay() {
    // Break up long tasks
    this.scheduleWithYield();

    // Defer non-critical JavaScript
    this.deferNonCriticalScripts();
  }

  private static preventLayoutShifts() {
    // Add explicit dimensions to images without them
    const images = document.querySelectorAll("img:not([width]):not([height])");
    images.forEach((img) => {
      if (img.clientWidth > 0) {
        img.setAttribute("width", img.clientWidth.toString());
        img.setAttribute("height", img.clientHeight.toString());
      }
    });

    // Add min-height to containers
    const containers = document.querySelectorAll("[data-dynamic-content]");
    containers.forEach((container) => {
      if (!container.style.minHeight) {
        container.style.minHeight = "100px";
      }
    });
  }

  private static optimizeFirstContentfulPaint() {
    // Inline critical CSS
    this.inlineCriticalCSS();

    // Prefetch key resources
    this.prefetchCriticalResources();
  }

  // Device and network adaptation
  private static adaptToDeviceCapabilities() {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    if (deviceMemory < 4 || hardwareConcurrency < 4) {
      // Low-end device optimizations
      this.enableLowEndDeviceMode();
    }
  }

  private static adaptToNetworkConditions() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
        this.enableSlowNetworkMode();
      }

      if (connection.saveData) {
        this.enableDataSaverMode();
      }
    }
  }

  private static adaptToBatteryStatus() {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (battery.level < 0.2 || battery.charging === false) {
          this.enablePowerSaveMode();
        }
      });
    }
  }

  // Optimization implementations
  private static optimizeForLongTasks() {
    // Implement task scheduling with yielding
    this.scheduleWithYield();
  }

  private static optimizeSlowResource(resource: PerformanceResourceTiming) {
    const url = new URL(resource.name);

    // For images, suggest compression
    if (url.pathname.match(/\.(png|jpg|jpeg)$/)) {
      console.warn(`Consider optimizing image: ${url.pathname}`);
    }

    // For scripts, suggest code splitting
    if (url.pathname.endsWith(".js")) {
      console.warn(`Consider code splitting for: ${url.pathname}`);
    }
  }

  private static scheduleWithYield() {
    // Implement cooperative scheduling
    (window as any).scheduler = (window as any).scheduler || {
      postTask: (callback: Function, options: any = {}) => {
        const { priority = "user-visible" } = options;

        if (priority === "background") {
          setTimeout(callback, 0);
        } else {
          requestIdleCallback(() => callback(), { timeout: 1000 });
        }
      },
    };
  }

  // Performance modes
  private static enableLowEndDeviceMode() {
    document.documentElement.classList.add("low-end-device");

    // Reduce animations
    document.documentElement.style.setProperty("--animation-duration", "0s");

    // Disable unnecessary features
    this.disableNonCriticalFeatures();
  }

  private static enableSlowNetworkMode() {
    document.documentElement.classList.add("slow-network");

    // Reduce image quality
    this.reduceImageQuality();

    // Defer non-critical resources
    this.deferNonCriticalResources();
  }

  private static enableDataSaverMode() {
    document.documentElement.classList.add("data-saver");

    // Disable autoplay videos
    const videos = document.querySelectorAll("video[autoplay]");
    videos.forEach((video) => {
      (video as HTMLVideoElement).autoplay = false;
    });

    // Compress images more aggressively
    this.aggressiveImageCompression();
  }

  private static enablePowerSaveMode() {
    document.documentElement.classList.add("power-save");

    // Reduce CPU-intensive operations
    this.reduceAnimations();
    this.throttleUpdates();
  }

  // Helper methods for optimizations
  private static reduceImageQuality() {
    // This would typically be handled by image processing service
    console.log("Reducing image quality for better performance");
  }

  private static inlineCriticalCSS() {
    // This would inline above-the-fold CSS
    console.log("Inlining critical CSS");
  }

  private static prefetchCriticalResources() {
    const criticalResources = ["/api/events", "/_next/static/css/critical.css"];

    criticalResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  private static deferNonCriticalScripts() {
    const scripts = document.querySelectorAll("script:not([data-critical])");
    scripts.forEach((script) => {
      (script as HTMLScriptElement).defer = true;
    });
  }

  private static disableNonCriticalFeatures() {
    // Disable animations, fancy transitions, etc.
    const style = document.createElement("style");
    style.textContent = `
      * {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `;
    document.head.appendChild(style);
  }

  private static deferNonCriticalResources() {
    // Defer loading of non-critical resources
    const nonCritical = document.querySelectorAll("[data-non-critical]");
    nonCritical.forEach((element) => {
      if (element.tagName === "IMG") {
        (element as HTMLImageElement).loading = "lazy";
      }
    });
  }

  private static aggressiveImageCompression() {
    // This would use more aggressive compression settings
    console.log("Applying aggressive image compression");
  }

  private static reduceAnimations() {
    document.documentElement.style.setProperty("--animation-duration", "0.1s");
  }

  private static throttleUpdates() {
    // Throttle DOM updates and re-renders
    console.log("Throttling updates for power saving");
  }

  // Memory tracking
  private static startMemoryTracking() {
    const trackMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        this.trackMetric("memory-used", memory.usedJSMemory);
        this.trackMetric("memory-total", memory.totalJSMemory);
      }
    };

    // Track every 30 seconds
    setInterval(trackMemory, 30000);
  }

  // Network tracking
  private static startNetworkTracking() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      const trackNetwork = () => {
        this.trackMetric("network-downlink", connection.downlink || 0);
        this.trackMetric("network-rtt", connection.rtt || 0);
      };

      connection.addEventListener("change", trackNetwork);
      trackNetwork(); // Initial measurement
    }
  }

  // Performance budget checking
  private static checkPerformanceBudget(metric: string, value: number) {
    const budgets: { [key: string]: number } = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      FCP: 1800,
      "component-render": 16.67, // 60fps
      "api-call": 1000,
      "image-load": 3000,
    };

    const budget = budgets[metric];
    if (budget && value > budget) {
      console.warn(`Performance budget exceeded for ${metric}:`, {
        value,
        budget,
        exceededBy: value - budget,
      });
    }
  }

  // Reporting
  private static setupReporting() {
    // Send metrics every 30 seconds
    setInterval(() => {
      this.sendPerformanceReport();
    }, 30000);

    // Send report on page unload
    window.addEventListener("beforeunload", () => {
      this.sendPerformanceReport(true);
    });
  }

  private static sendPerformanceReport(isUnload: boolean = false) {
    const report = this.generateReport();

    if (isUnload && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics/performance", JSON.stringify(report));
    } else {
      fetch("/api/analytics/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
        keepalive: true,
      }).catch(console.warn);
    }
  }

  private static sendMetricToAnalytics(metric: Metric) {
    // Send individual metrics for real-time monitoring
    const data = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    fetch("/api/analytics/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {}); // Silent fail
  }

  // Report generation
  static generateReport() {
    const webVitalsMetrics: { [key: string]: any } = {};
    this.metrics.forEach((values, name) => {
      const latest = values[values.length - 1];
      webVitalsMetrics[name] = {
        value: latest.value,
        rating: latest.rating,
        samples: values.length,
      };
    });

    const customMetricsReport: { [key: string]: any } = {};
    this.customMetrics.forEach((values, name) => {
      if (values.length > 0) {
        customMetricsReport[name] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          samples: values.length,
        };
      }
    });

    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      webVitals: webVitalsMetrics,
      customMetrics: customMetricsReport,
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo(),
    };
  }

  private static getDeviceInfo() {
    return {
      deviceMemory: (navigator as any).deviceMemory || "unknown",
      hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
      platform: navigator.platform,
      language: navigator.language,
    };
  }

  private static getNetworkInfo() {
    if ("connection" in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      };
    }
    return {};
  }

  // Cleanup
  static cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.customMetrics.clear();
    this.performanceEntries = [];
    this.isProfilingActive = false;
  }
}

// React hooks for performance profiling
export function usePerformanceProfiler(componentName: string) {
  React.useEffect(() => {
    if (!PerformanceProfiler.isProfilingActive) {
      PerformanceProfiler.init();
    }

    const profiler = PerformanceProfiler.profileComponent(componentName);
    profiler.onRender();

    return () => {
      profiler.onUnmount();
    };
  }, [componentName]);

  const trackMetric = React.useCallback(
    (name: string, value: number) => {
      PerformanceProfiler.trackMetric(`${componentName}-${name}`, value);
    },
    [componentName]
  );

  const startTimer = React.useCallback(
    (name: string) => {
      return PerformanceProfiler.startTimer(`${componentName}-${name}`);
    },
    [componentName]
  );

  return { trackMetric, startTimer };
}
