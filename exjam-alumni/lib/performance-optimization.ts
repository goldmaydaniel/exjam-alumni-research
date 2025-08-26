import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from "react";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static observers = new Map<string, PerformanceObserver>();

  static startMeasure(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      this.metrics.get(name)!.push(duration);

      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }

  static getAverageTime(name: string): number {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) return 0;

    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  static observeLCP(callback?: (entry: any) => void) {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (callback) {
        callback(lastEntry);
      }

      console.log("LCP:", lastEntry.startTime);
    });

    observer.observe({ type: "largest-contentful-paint", buffered: true });
    this.observers.set("lcp", observer);
  }

  static observeFID(callback?: (entry: any) => void) {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (callback) {
          callback(entry);
        }
        console.log("FID:", entry.processingStart - entry.startTime);
      });
    });

    observer.observe({ type: "first-input", buffered: true });
    this.observers.set("fid", observer);
  }

  static observeCLS(callback?: (entry: any) => void) {
    if (typeof window === "undefined") return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          if (callback) {
            callback({ value: clsValue });
          }
          console.log("CLS:", clsValue);
        }
      });
    });

    observer.observe({ type: "layout-shift", buffered: true });
    this.observers.set("cls", observer);
  }

  static cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Memoization utilities
export const createMemoSelector = <TProps, TResult>(
  selector: (props: TProps) => TResult,
  deps?: (props: TProps) => any[]
) => {
  const cache = new Map();

  return (props: TProps): TResult => {
    const key = deps ? JSON.stringify(deps(props)) : JSON.stringify(props);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = selector(props);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

// Enhanced memo with deep comparison
export const deepMemo = <P extends object>(
  Component: React.ComponentType<P>,
  customComparator?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(
    Component,
    customComparator ||
      ((prevProps, nextProps) => {
        return JSON.stringify(prevProps) === JSON.stringify(nextProps);
      })
  );
};

// Optimized list rendering
export const useVirtualizedList = <T>(items: T[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length - 1
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
};

// Debounced hooks - temporarily disabled due to build issues
// export const useDebounce = <T>(value: T, delay: number): T => {
//   const [debouncedValue, setDebouncedValue] = useState<T>(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// export const useDebouncedCallback = <T extends (...args: any[]) => any>(
//   callback: T,
//   delay: number
// ): T => {
//   const timeoutRef = useRef<NodeJS.Timeout>();

//   const debouncedCallback = useCallback((...args: Parameters<T>) => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//     }

//     timeoutRef.current = setTimeout(() => {
//       callback(...args);
//     }, delay);
//   }, [callback, delay]);

//   useEffect(() => {
//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current);
//       }
//     };
//   }, []);

//   return debouncedCallback as T;
// };

// Throttled hooks - temporarily disabled due to build issues
// export const useThrottle = <T>(value: T, delay: number): T => {
//   const [throttledValue, setThrottledValue] = useState<T>(value);
//   const lastExecuted = useRef<number>(Date.now());

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       const now = Date.now();
//       if (now >= lastExecuted.current + delay) {
//         setThrottledValue(value);
//         lastExecuted.current = now;
//       }
//     }, delay - (Date.now() - lastExecuted.current));

//     return () => {
//       clearTimeout(handler);
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return throttledValue;
// };

// Image optimization utilities
export const useProgressiveImage = (lowQualitySrc: string, highQualitySrc: string) => {
  const [src, setSrc] = useState(lowQualitySrc);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => {
      setSrc(highQualitySrc);
      setLoading(false);
    };
  }, [highQualitySrc]);

  return { src, loading };
};

export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(url));
          resolve();
        };
        img.onerror = () => resolve(); // Still resolve on error
        img.src = url;
      });
    };

    Promise.all(imageUrls.map(loadImage));
  }, [imageUrls]);

  return loadedImages;
};

// Bundle splitting utilities - temporarily disabled due to build issues
// export const createLazyComponent = <T extends React.ComponentType<any>>(
//   importFn: () => Promise<{ default: T }>,
//   fallback?: React.ComponentType
// ) => {
//   const LazyComponent = React.lazy(importFn);
//
//   return (props: React.ComponentProps<T>) => {
//     return (
//       <React.Suspense fallback={fallback ? <fallback {...props} /> : <div>Loading...</div>}>
//         <LazyComponent {...props} />
//       </React.Suspense>
//     );
//   };
// };

// Memory optimization - temporarily disabled due to build issues
// export const useMemoryOptimizedState = <T>(
//   initialValue: T,
//   maxHistorySize: number = 10
// ) => {
//   const [value, setValue] = useState<T>(initialValue);
//   const history = useRef<T[]>([initialValue]);

//   const setOptimizedValue = useCallback((newValue: T | ((prev: T) => T)) => {
//     setValue(prevValue => {
//       const nextValue = typeof newValue === 'function'
//         ? (newValue as (prev: T) => T)(prevValue)
//         : newValue;

//       // Update history
//       history.current.push(nextValue);
//       if (history.current.length > maxHistorySize) {
//         history.current.shift();
//       }

//       return nextValue;
//     });
//   }, [maxHistorySize]);

//   const undo = useCallback(() => {
//     if (history.current.length > 1) {
//       history.current.pop();
//       const previousValue = history.current[history.current.length - 1];
//       setValue(previousValue);
//     }
//   }, []);

//   return [value, setOptimizedValue, undo, history.current.length > 1] as const;
// };

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options]);

  return [setNode, entry] as const;
};

// Performance HOC - temporarily disabled due to build issues
// export const withPerformanceMonitoring = <P extends object>(
//   Component: React.ComponentType<P>,
//   componentName: string
// ) => {
//   return memo((props: P) => {
//     useEffect(() => {
//       const endMeasure = PerformanceMonitor.startMeasure(`${componentName}-render`);
//       return endMeasure;
//     });

//     return <Component {...props} />;
//   });
// };

// Resource prefetching
export const usePrefetch = () => {
  const prefetchedResources = useRef(new Set<string>());

  const prefetchResource = useCallback((url: string, as: string = "fetch") => {
    if (prefetchedResources.current.has(url)) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = as;
    document.head.appendChild(link);

    prefetchedResources.current.add(url);
  }, []);

  const prefetchComponent = useCallback((importFn: () => Promise<any>) => {
    // Prefetch the component module
    importFn();
  }, []);

  return { prefetchResource, prefetchComponent };
};

// Bundle analysis
export const getBundleStats = () => {
  if (typeof window === "undefined") return null;

  return {
    totalScripts: document.scripts.length,
    totalStylesheets: document.styleSheets.length,
    memoryUsage: (performance as any).memory
      ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      : null,
    timing: performance.timing,
  };
};
