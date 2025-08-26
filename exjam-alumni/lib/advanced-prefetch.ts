import { queryClient } from "./react-query";
import { optimizedPrisma } from "./database-optimization";

// Intelligent prefetching system
export class AdvancedPrefetcher {
  private static prefetchQueue: Map<string, Promise<any>> = new Map();
  private static userBehaviorPattern: Map<string, any> = new Map();
  private static routePredictions: Map<string, string[]> = new Map();

  // Initialize behavior tracking
  static init() {
    if (typeof window === "undefined") return;

    this.trackUserBehavior();
    this.setupIntersectionObserver();
    this.setupRoutePredictor();
  }

  // Track user behavior patterns
  private static trackUserBehavior() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const behavior = this.userBehaviorPattern.get(userId) || {
      visitedRoutes: [],
      commonPaths: [],
      timeSpent: {},
      clickPatterns: [],
      deviceInfo: this.getDeviceInfo(),
    };

    // Track route visits
    const currentPath = window.location.pathname;
    behavior.visitedRoutes.push({
      path: currentPath,
      timestamp: Date.now(),
      referrer: document.referrer,
    });

    // Analyze common patterns
    this.analyzePatterns(behavior);
    this.userBehaviorPattern.set(userId, behavior);
  }

  private static analyzePatterns(behavior: any) {
    const pathCounts: { [key: string]: number } = {};

    behavior.visitedRoutes.forEach((visit: any) => {
      pathCounts[visit.path] = (pathCounts[visit.path] || 0) + 1;
    });

    // Find most common paths
    behavior.commonPaths = Object.entries(pathCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([path]) => path);
  }

  // Setup intersection observer for link prefetching
  private static setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.href;

            if (href && this.shouldPrefetch(href)) {
              this.prefetchRoute(href);
            }
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    // Observe all links
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      observer.observe(link);
    });

    // Setup mutation observer for new links
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const links = element.querySelectorAll('a[href^="/"]');
            links.forEach((link) => observer.observe(link));
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // AI-powered route prediction
  private static setupRoutePredictor() {
    // Machine learning-like route prediction based on patterns
    const routeTransitions: { [key: string]: { [key: string]: number } } = {};

    const userId = this.getCurrentUserId();
    const behavior = this.userBehaviorPattern.get(userId);

    if (behavior?.visitedRoutes) {
      for (let i = 0; i < behavior.visitedRoutes.length - 1; i++) {
        const from = behavior.visitedRoutes[i].path;
        const to = behavior.visitedRoutes[i + 1].path;

        if (!routeTransitions[from]) routeTransitions[from] = {};
        routeTransitions[from][to] = (routeTransitions[from][to] || 0) + 1;
      }
    }

    // Generate predictions
    Object.keys(routeTransitions).forEach((from) => {
      const transitions = routeTransitions[from];
      const sortedRoutes = Object.entries(transitions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([route]) => route);

      this.routePredictions.set(from, sortedRoutes);
    });
  }

  // Smart prefetching based on user intent
  static async predictivePreload() {
    const currentPath = window.location.pathname;
    const userId = this.getCurrentUserId();

    // Get predicted next routes
    const predictions = this.routePredictions.get(currentPath) || [];
    const behaviorPredictions = this.getBehaviorBasedPredictions(userId);
    const timeBased = this.getTimeBasedPredictions();

    const allPredictions = [...predictions, ...behaviorPredictions, ...timeBased];

    // Prefetch with priority
    const prefetchPromises = allPredictions
      .slice(0, 3)
      .map((route, index) => this.prefetchRoute(route, index === 0 ? "high" : "low"));

    return Promise.allSettled(prefetchPromises);
  }

  private static getBehaviorBasedPredictions(userId: string): string[] {
    const behavior = this.userBehaviorPattern.get(userId);
    if (!behavior) return [];

    const hour = new Date().getHours();

    // Time-based predictions
    if (hour >= 9 && hour <= 17) {
      // Work hours
      return ["/events", "/dashboard"];
    } else if (hour >= 18 && hour <= 22) {
      // Evening
      return ["/events", "/profile"];
    }

    return behavior.commonPaths.slice(0, 2);
  }

  private static getTimeBasedPredictions(): string[] {
    const day = new Date().getDay();
    const hour = new Date().getHours();

    // Weekend predictions
    if (day === 0 || day === 6) {
      return ["/events"];
    }

    // Lunch time
    if (hour >= 12 && hour <= 14) {
      return ["/events", "/dashboard"];
    }

    return [];
  }

  // Prefetch route with priority
  static async prefetchRoute(route: string, priority: "high" | "low" = "low") {
    try {
      // Avoid duplicate prefetches
      if (this.prefetchQueue.has(route)) {
        return this.prefetchQueue.get(route);
      }

      const prefetchPromise = this.performPrefetch(route, priority);
      this.prefetchQueue.set(route, prefetchPromise);

      // Clean up after completion
      prefetchPromise.finally(() => {
        setTimeout(() => {
          this.prefetchQueue.delete(route);
        }, 30000); // Keep for 30 seconds
      });

      return prefetchPromise;
    } catch (error) {
      console.warn(`Failed to prefetch route ${route}:`, error);
    }
  }

  private static async performPrefetch(route: string, priority: "high" | "low") {
    const promises: Promise<any>[] = [];

    // Prefetch page component
    if (typeof window !== "undefined" && (window as any).next?.router) {
      promises.push((window as any).next.router.prefetch(route));
    }

    // Prefetch data based on route
    promises.push(this.prefetchRouteData(route));

    // For high priority, also prefetch critical resources
    if (priority === "high") {
      promises.push(this.prefetchCriticalResources(route));
    }

    await Promise.allSettled(promises);
  }

  private static async prefetchRouteData(route: string) {
    // Prefetch data based on route patterns
    if (route.startsWith("/events")) {
      if (route === "/events") {
        await queryClient.prefetchQuery({
          queryKey: ["events", {}],
          queryFn: () => optimizedPrisma.getEventsOptimized({}),
        });
      } else if (route.match(/\/events\/(.+)/)) {
        const eventId = route.split("/")[2];
        if (eventId) {
          await queryClient.prefetchQuery({
            queryKey: ["events", eventId],
            queryFn: () =>
              optimizedPrisma.event.findUnique({
                where: { id: eventId },
                include: { _count: { select: { registrations: true } } },
              }),
          });
        }
      }
    } else if (route === "/dashboard") {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ["dashboard", "stats"],
          queryFn: () => optimizedPrisma.getDashboardAnalytics(),
        }),
        queryClient.prefetchQuery({
          queryKey: ["registrations"],
          queryFn: () => this.getCurrentUserRegistrations(),
        }),
      ]);
    } else if (route === "/profile") {
      const userId = this.getCurrentUserId();
      if (userId) {
        await queryClient.prefetchQuery({
          queryKey: ["users", userId],
          queryFn: () => optimizedPrisma.getUserWithRegistrationsOptimized(userId),
        });
      }
    }
  }

  private static async prefetchCriticalResources(route: string) {
    // Prefetch critical images and assets
    const criticalAssets = this.getCriticalAssets(route);

    const prefetchPromises = criticalAssets.map((asset) => {
      return new Promise((resolve) => {
        if (asset.endsWith(".jpg") || asset.endsWith(".png") || asset.endsWith(".webp")) {
          const img = new Image();
          img.onload = () => resolve(asset);
          img.onerror = () => resolve(asset);
          img.src = asset;
        } else {
          const link = document.createElement("link");
          link.rel = "prefetch";
          link.href = asset;
          document.head.appendChild(link);
          resolve(asset);
        }
      });
    });

    await Promise.allSettled(prefetchPromises);
  }

  private static getCriticalAssets(route: string): string[] {
    const assets: { [key: string]: string[] } = {
      "/events": ["/images/events/hero.webp", "/_next/static/css/events.css"],
      "/dashboard": ["/images/dashboard/analytics.webp", "/_next/static/css/dashboard.css"],
      "/profile": ["/_next/static/css/profile.css"],
    };

    return assets[route] || [];
  }

  // Memory management for prefetched data
  static manageMemory() {
    // Clear old prefetch promises
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    this.prefetchQueue.forEach((promise, route) => {
      if (promise && typeof promise.then === "function") {
        // Check if promise is old (this is a simplified check)
        // In a real implementation, you'd track creation time
        setTimeout(() => {
          this.prefetchQueue.delete(route);
        }, maxAge);
      }
    });

    // Clear old behavior data
    const maxBehaviorAge = 24 * 60 * 60 * 1000; // 24 hours
    this.userBehaviorPattern.forEach((behavior, userId) => {
      behavior.visitedRoutes = behavior.visitedRoutes.filter(
        (visit: any) => now - visit.timestamp < maxBehaviorAge
      );
    });
  }

  // Utility methods
  private static shouldPrefetch(href: string): boolean {
    // Don't prefetch external links or API routes
    if (href.includes("://") && !href.includes(window.location.origin)) {
      return false;
    }

    if (href.startsWith("/api/")) {
      return false;
    }

    // Don't prefetch if already in queue
    if (this.prefetchQueue.has(href)) {
      return false;
    }

    return true;
  }

  private static getCurrentUserId(): string | null {
    // Get user ID from auth context or localStorage
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (error) {
      // Silent fail
    }
    return null;
  }

  private static getDeviceInfo() {
    if (typeof navigator === "undefined") return {};

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType || "unknown",
      memory: (performance as any).memory?.usedJSMemory || 0,
    };
  }

  private static async getCurrentUserRegistrations() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    return optimizedPrisma.registration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            venue: true,
          },
        },
        ticket: {
          select: {
            ticketNumber: true,
            checkedIn: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

// React hooks for prefetching
export function usePrefetch() {
  const prefetchRoute = React.useCallback((route: string, priority?: "high" | "low") => {
    return AdvancedPrefetcher.prefetchRoute(route, priority);
  }, []);

  const predictivePreload = React.useCallback(() => {
    return AdvancedPrefetcher.predictivePreload();
  }, []);

  // Auto-prefetch on component mount
  React.useEffect(() => {
    predictivePreload();
  }, [predictivePreload]);

  return { prefetchRoute, predictivePreload };
}

// Initialize prefetching system
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    AdvancedPrefetcher.init();

    // Clean up memory every 5 minutes
    setInterval(
      () => {
        AdvancedPrefetcher.manageMemory();
      },
      5 * 60 * 1000
    );
  });
}
