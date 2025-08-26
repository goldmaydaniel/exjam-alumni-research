// Advanced memory management and garbage collection
export class MemoryManager {
  private static memoryThreshold = 100 * 1024 * 1024; // 100MB
  private static cleanupInterval: NodeJS.Timer | null = null;
  private static memoryLeakDetector: Map<string, WeakRef<any>> = new Map();
  private static componentCache: Map<string, any> = new Map();
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static queryCache: Map<string, { data: any; timestamp: number }> = new Map();

  static init() {
    if (typeof window === "undefined") return;

    this.startMemoryMonitoring();
    this.setupPerformanceObserver();
    this.setupUnloadCleanup();
    this.startPeriodicCleanup();
  }

  // Monitor memory usage and trigger cleanup when needed
  private static startMemoryMonitoring() {
    const checkMemory = () => {
      const memoryInfo = this.getMemoryInfo();

      if (memoryInfo.usedJSMemory > this.memoryThreshold) {
        console.warn("High memory usage detected:", memoryInfo);
        this.aggressiveCleanup();
      }

      // Log memory stats in development
      if (process.env.NODE_ENV === "development") {
        console.log("Memory usage:", {
          used: this.formatBytes(memoryInfo.usedJSMemory),
          total: this.formatBytes(memoryInfo.totalJSMemory),
          limit: this.formatBytes(memoryInfo.jsMemoryLimit),
        });
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);

    // Also check on visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkMemory();
      }
    });
  }

  // Setup performance observer to detect memory leaks
  private static setupPerformanceObserver() {
    if (!("PerformanceObserver" in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "measure" && entry.name.includes("memory")) {
          if (entry.duration > 1000) {
            // Slow memory operations
            console.warn("Slow memory operation detected:", entry);
          }
        }
      });
    });

    observer.observe({ entryTypes: ["measure"] });
  }

  // Clean up on page unload
  private static setupUnloadCleanup() {
    window.addEventListener("beforeunload", () => {
      this.fullCleanup();
    });

    // Also clean up when page becomes hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.partialCleanup();
      }
    });
  }

  // Periodic cleanup every 2 minutes
  private static startPeriodicCleanup() {
    this.cleanupInterval = setInterval(
      () => {
        this.routineCleanup();
      },
      2 * 60 * 1000
    );
  }

  // Different levels of cleanup

  // Routine cleanup - runs periodically
  static routineCleanup() {
    this.cleanupExpiredCache();
    this.cleanupUnusedImages();
    this.cleanupDeadReferences();
    this.forceGarbageCollection();
  }

  // Partial cleanup - when page becomes hidden
  static partialCleanup() {
    this.routineCleanup();
    this.cleanupComponentCache();
    this.cleanupLargeObjects();
  }

  // Aggressive cleanup - when memory is low
  static aggressiveCleanup() {
    this.partialCleanup();
    this.clearAllCaches();
    this.forceGarbageCollection();

    // Also clean up React Query cache
    if (typeof window !== "undefined" && (window as any).queryClient) {
      (window as any).queryClient.clear();
    }
  }

  // Full cleanup - on page unload
  static fullCleanup() {
    this.clearAllCaches();
    this.cleanupEventListeners();
    this.cleanupWorkers();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Specific cleanup methods

  private static cleanupExpiredCache() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    this.queryCache.forEach((value, key) => {
      if (now - value.timestamp > maxAge) {
        this.queryCache.delete(key);
      }
    });
  }

  private static cleanupUnusedImages() {
    this.imageCache.forEach((img, key) => {
      if (!document.body.contains(img) && !img.complete) {
        this.imageCache.delete(key);
      }
    });
  }

  private static cleanupDeadReferences() {
    this.memoryLeakDetector.forEach((weakRef, key) => {
      if (!weakRef.deref()) {
        this.memoryLeakDetector.delete(key);
      }
    });
  }

  private static cleanupComponentCache() {
    // Clear component cache, keeping only recently used
    const recentThreshold = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    this.componentCache.forEach((component, key) => {
      if (component.lastAccessed && now - component.lastAccessed > recentThreshold) {
        this.componentCache.delete(key);
      }
    });
  }

  private static cleanupLargeObjects() {
    // Find and clean up large objects
    const cleanupTargets = ["imageCache", "componentCache", "queryCache"];

    cleanupTargets.forEach((target) => {
      const cache = (this as any)[target] as Map<string, any>;
      if (cache && cache.size > 50) {
        // If cache is too large
        const entries = Array.from(cache.entries());
        entries.slice(25).forEach(([key]) => cache.delete(key)); // Keep only first 25
      }
    });
  }

  private static clearAllCaches() {
    this.componentCache.clear();
    this.imageCache.clear();
    this.queryCache.clear();
    this.memoryLeakDetector.clear();
  }

  private static cleanupEventListeners() {
    // Remove global event listeners
    const events = ["scroll", "resize", "mousemove", "touchmove"];
    events.forEach((event) => {
      // This is a simplified cleanup - in practice, you'd track listeners
      document.removeEventListener(event, () => {});
      window.removeEventListener(event, () => {});
    });
  }

  private static cleanupWorkers() {
    // Terminate any remaining web workers
    if (typeof window !== "undefined" && (window as any).workers) {
      (window as any).workers.forEach((worker: Worker) => {
        worker.terminate();
      });
    }
  }

  private static forceGarbageCollection() {
    // Force garbage collection if available (only in development with flags)
    if (typeof window !== "undefined" && (window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {
        // Silently fail if not available
      }
    }

    // Alternative: create memory pressure to trigger GC
    const pressure = new Array(1000000).fill(0);
    setTimeout(() => {
      pressure.length = 0;
    }, 0);
  }

  // Memory monitoring utilities

  static getMemoryInfo() {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSMemory: memory.usedJSMemory,
        totalJSMemory: memory.totalJSMemory,
        jsMemoryLimit: memory.jsMemoryLimit,
      };
    }

    return {
      usedJSMemory: 0,
      totalJSMemory: 0,
      jsMemoryLimit: 0,
    };
  }

  static getCacheStats() {
    return {
      componentCache: this.componentCache.size,
      imageCache: this.imageCache.size,
      queryCache: this.queryCache.size,
      memoryLeaks: this.memoryLeakDetector.size,
    };
  }

  // Cache management methods

  static addToComponentCache(key: string, component: any) {
    this.componentCache.set(key, {
      component,
      lastAccessed: Date.now(),
    });

    // Limit cache size
    if (this.componentCache.size > 100) {
      const oldestKey = this.componentCache.keys().next().value;
      this.componentCache.delete(oldestKey);
    }
  }

  static getFromComponentCache(key: string) {
    const cached = this.componentCache.get(key);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.component;
    }
    return null;
  }

  static addToImageCache(src: string, img: HTMLImageElement) {
    this.imageCache.set(src, img);

    // Limit image cache
    if (this.imageCache.size > 50) {
      const oldestKey = this.imageCache.keys().next().value;
      this.imageCache.delete(oldestKey);
    }
  }

  static getFromImageCache(src: string): HTMLImageElement | null {
    return this.imageCache.get(src) || null;
  }

  static addToQueryCache(key: string, data: any) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  static getFromQueryCache(key: string) {
    const cached = this.queryCache.get(key);
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }

    this.queryCache.delete(key);
    return null;
  }

  // Memory leak detection
  static trackObject(key: string, obj: any) {
    this.memoryLeakDetector.set(key, new WeakRef(obj));
  }

  static checkForLeaks(): string[] {
    const leaks: string[] = [];

    this.memoryLeakDetector.forEach((weakRef, key) => {
      const obj = weakRef.deref();
      if (obj && this.isLikelyLeak(obj)) {
        leaks.push(key);
      }
    });

    return leaks;
  }

  private static isLikelyLeak(obj: any): boolean {
    // Simple heuristics for detecting memory leaks
    if (obj instanceof HTMLElement && !document.contains(obj)) {
      return true;
    }

    if (obj && typeof obj === "object" && Object.keys(obj).length > 100) {
      return true; // Large objects might be leaks
    }

    return false;
  }

  // Utility methods
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // React hooks for memory management
  static useMemoryOptimization() {
    React.useEffect(() => {
      // Clean up on component unmount
      return () => {
        this.routineCleanup();
      };
    }, []);

    const monitorMemory = React.useCallback(() => {
      return this.getMemoryInfo();
    }, []);

    const forceCleanup = React.useCallback(() => {
      this.aggressiveCleanup();
    }, []);

    return { monitorMemory, forceCleanup };
  }
}

// Advanced compression utilities
export class CompressionManager {
  // Compress large objects before storing
  static compressObject(obj: any): string {
    const jsonString = JSON.stringify(obj);

    // Simple compression using repetition reduction
    const compressed = this.simpleCompress(jsonString);

    return compressed;
  }

  static decompressObject(compressed: string): any {
    const decompressed = this.simpleDecompress(compressed);
    return JSON.parse(decompressed);
  }

  private static simpleCompress(str: string): string {
    // Simple run-length encoding for repeated patterns
    let compressed = "";
    let count = 1;

    for (let i = 0; i < str.length; i++) {
      if (i < str.length - 1 && str[i] === str[i + 1]) {
        count++;
      } else {
        if (count > 1) {
          compressed += `${count}${str[i]}`;
        } else {
          compressed += str[i];
        }
        count = 1;
      }
    }

    return compressed;
  }

  private static simpleDecompress(compressed: string): string {
    let decompressed = "";
    let i = 0;

    while (i < compressed.length) {
      if (/\d/.test(compressed[i])) {
        let count = "";
        while (i < compressed.length && /\d/.test(compressed[i])) {
          count += compressed[i];
          i++;
        }
        const char = compressed[i];
        decompressed += char.repeat(parseInt(count));
        i++;
      } else {
        decompressed += compressed[i];
        i++;
      }
    }

    return decompressed;
  }

  // Compress images on the client side
  static compressImage(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve!, "image/jpeg", quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

// Initialize memory management
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    MemoryManager.init();
  });
}
