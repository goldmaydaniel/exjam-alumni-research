/**
 * User Activity Tracking System
 * Comprehensive activity logging and analytics for user behavior
 */

export interface ActivityEvent {
  id: string;
  userId: string;
  sessionId: string;
  type: ActivityType;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  duration?: number;
  page?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number];
  };
}

export type ActivityType =
  | "navigation"
  | "interaction"
  | "auth"
  | "content"
  | "social"
  | "system"
  | "error"
  | "performance";

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  interactions: number;
  device: DeviceInfo;
  location: GeolocationInfo;
  exitPage?: string;
  bounced: boolean;
}

export interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  screenResolution: string;
  userAgent: string;
}

export interface GeolocationInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  coordinates?: [number, number];
  timezone: string;
}

/**
 * Activity Tracker Service
 */
export class ActivityTracker {
  private static instance: ActivityTracker;
  private queue: ActivityEvent[] = [];
  private sessionId: string | null = null;
  private userId: string | null = null;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private isEnabled = true;

  private constructor() {
    this.initializeSession();
    this.setupFlushTimer();
    this.setupEventListeners();
  }

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  /**
   * Initialize user session
   */
  setUser(userId: string): void {
    this.userId = userId;
    this.sessionId = this.generateSessionId();

    this.track("auth", "session_start", {
      userId,
      sessionId: this.sessionId,
    });
  }

  /**
   * Track an activity event
   */
  track(
    type: ActivityType,
    action: string,
    metadata: Record<string, any> = {},
    resource?: string,
    resourceId?: string
  ): void {
    if (!this.isEnabled || !this.sessionId) return;

    const event: ActivityEvent = {
      id: this.generateEventId(),
      userId: this.userId || "anonymous",
      sessionId: this.sessionId,
      type,
      action,
      resource,
      resourceId,
      metadata: {
        ...metadata,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      page: window.location.pathname,
    };

    this.queue.push(event);

    // Flush immediately for critical events
    if (this.isCriticalEvent(type, action)) {
      this.flush();
    } else if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track page navigation
   */
  trackPageView(page: string, title?: string): void {
    this.track("navigation", "page_view", {
      page,
      title: title || document.title,
      referrer: document.referrer,
      loadTime: performance.now(),
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(element: string, action: string, metadata: Record<string, any> = {}): void {
    this.track("interaction", action, {
      element,
      ...metadata,
      timestamp: performance.now(),
    });
  }

  /**
   * Track content engagement
   */
  trackContentEngagement(
    contentId: string,
    contentType: string,
    engagement: {
      timeSpent?: number;
      scrollDepth?: number;
      interactions?: number;
      completed?: boolean;
    }
  ): void {
    this.track(
      "content",
      "engagement",
      {
        contentId,
        contentType,
        ...engagement,
      },
      "content",
      contentId
    );
  }

  /**
   * Track errors
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    this.track("error", "javascript_error", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: {
    loadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
  }): void {
    this.track("performance", "page_metrics", metrics);
  }

  /**
   * Track social interactions
   */
  trackSocial(action: string, target: string, metadata: Record<string, any> = {}): void {
    this.track("social", action, {
      target,
      ...metadata,
    });
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;

    if (!enabled && this.queue.length > 0) {
      this.flush();
    }
  }

  /**
   * Manually flush events
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error("Failed to send activity events:", error);
      // Re-queue events on failure (with limit to prevent memory issues)
      if (this.queue.length < 100) {
        this.queue.unshift(...events.slice(-50));
      }
    }
  }

  /**
   * Get current session info
   */
  getSession(): { sessionId: string | null; userId: string | null } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  // Private methods
  private initializeSession(): void {
    this.sessionId = this.generateSessionId();
  }

  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private setupEventListeners(): void {
    // Track page unload
    window.addEventListener("beforeunload", () => {
      this.track("navigation", "page_unload", {
        timeOnPage: performance.now(),
      });
      this.flush();
    });

    // Track visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.track("navigation", "page_hidden");
      } else {
        this.track("navigation", "page_visible");
      }
    });

    // Track errors
    window.addEventListener("error", (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(new Error(event.reason), {
        type: "unhandled_promise_rejection",
      });
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout | null = null;

    window.addEventListener("scroll", () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;

        // Debounce scroll tracking
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.track("interaction", "scroll", {
            depth: maxScrollDepth,
            maxDepth: scrollDepth,
          });
        }, 1000);
      }
    });

    // Track clicks
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const id = target.id;
      const className = target.className;

      this.trackInteraction(tagName, "click", {
        id: id || undefined,
        className: className || undefined,
        text: target.textContent?.slice(0, 100) || undefined,
        x: event.clientX,
        y: event.clientY,
      });
    });
  }

  private async sendEvents(events: ActivityEvent[]): Promise<void> {
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string {
    // This would normally come from server-side headers
    return "client"; // Placeholder
  }

  private isCriticalEvent(type: ActivityType, action: string): boolean {
    return (
      (type === "auth" && ["login", "logout", "session_start"].includes(action)) ||
      type === "error" ||
      (type === "system" && action === "crash")
    );
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

/**
 * Convenience functions for common tracking scenarios
 */

// Export singleton instance
export const activityTracker = ActivityTracker.getInstance();

// Convenience methods
export const trackPageView = (page: string, title?: string) =>
  activityTracker.trackPageView(page, title);

export const trackClick = (element: string, metadata?: Record<string, any>) =>
  activityTracker.trackInteraction(element, "click", metadata);

export const trackFormSubmit = (
  formName: string,
  success: boolean,
  metadata?: Record<string, any>
) => activityTracker.trackInteraction("form", "submit", { formName, success, ...metadata });

export const trackSearch = (query: string, results: number, metadata?: Record<string, any>) =>
  activityTracker.trackInteraction("search", "query", { query, results, ...metadata });

export const trackDownload = (fileName: string, fileType: string, metadata?: Record<string, any>) =>
  activityTracker.track("interaction", "download", { fileName, fileType, ...metadata });

export const trackShare = (platform: string, content: string, metadata?: Record<string, any>) =>
  activityTracker.trackSocial("share", content, { platform, ...metadata });

export const trackVideoPlay = (videoId: string, duration: number, metadata?: Record<string, any>) =>
  activityTracker.trackContentEngagement(videoId, "video", { timeSpent: duration, ...metadata });

// React Hook for easy integration
export function useActivityTracker(userId?: string) {
  const [tracker] = useState(() => ActivityTracker.getInstance());

  useEffect(() => {
    if (userId) {
      tracker.setUser(userId);
    }
  }, [userId, tracker]);

  useEffect(() => {
    // Auto-track page views in React
    trackPageView(window.location.pathname);
  }, []);

  return {
    track: tracker.track.bind(tracker),
    trackPageView: tracker.trackPageView.bind(tracker),
    trackInteraction: tracker.trackInteraction.bind(tracker),
    trackError: tracker.trackError.bind(tracker),
    trackPerformance: tracker.trackPerformance.bind(tracker),
    trackContentEngagement: tracker.trackContentEngagement.bind(tracker),
    trackSocial: tracker.trackSocial.bind(tracker),
    flush: tracker.flush.bind(tracker),
    setEnabled: tracker.setEnabled.bind(tracker),
  };
}
