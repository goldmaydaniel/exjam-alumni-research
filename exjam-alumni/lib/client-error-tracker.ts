"use client";

import React from "react";

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  timestamp?: string;
  level: "error" | "warn" | "info";
  metadata?: Record<string, any>;
}

class ClientErrorTracker {
  private static instance: ClientErrorTracker;
  private userId?: string;
  private isInitialized = false;

  static getInstance(): ClientErrorTracker {
    if (!ClientErrorTracker.instance) {
      ClientErrorTracker.instance = new ClientErrorTracker();
    }
    return ClientErrorTracker.instance;
  }

  initialize(userId?: string): void {
    if (this.isInitialized || typeof window === "undefined") return;

    this.userId = userId;
    this.setupGlobalErrorHandlers();
    this.isInitialized = true;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle JavaScript errors
    window.addEventListener("error", (event) => {
      this.reportError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        level: "error",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: "javascript-error",
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        level: "error",
        metadata: {
          type: "unhandled-promise-rejection",
          reason: String(event.reason),
        },
      });
    });

    // Handle resource loading errors
    window.addEventListener(
      "error",
      (event) => {
        if (event.target !== window) {
          const target = event.target as any;
          this.reportError({
            message: `Resource loading error: ${target.src || target.href}`,
            url: window.location.href,
            level: "error",
            metadata: {
              type: "resource-error",
              tagName: target.tagName,
              src: target.src,
              href: target.href,
            },
          });
        }
      },
      true
    );

    // Monitor performance issues
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              const navEntry = entry as PerformanceNavigationTiming;
              if (navEntry.loadEventEnd - navEntry.loadEventStart > 5000) {
                this.reportError({
                  message: "Slow page load detected",
                  url: window.location.href,
                  level: "warn",
                  metadata: {
                    type: "performance-warning",
                    loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
                    domContentLoaded:
                      navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                  },
                });
              }
            }
          }
        });

        observer.observe({ entryTypes: ["navigation"] });
      } catch (error) {
        // PerformanceObserver not supported, skip
      }
    }
  }

  async reportError(
    errorData: Omit<ErrorReport, "userAgent" | "timestamp" | "userId">
  ): Promise<void> {
    try {
      const report: ErrorReport = {
        ...errorData,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.userId,
      };

      // Send to monitoring API
      await fetch("/api/monitoring/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      // Also log to console in development
      if (process.env.NODE_ENV === "development") {
        console.group(`🚨 Client Error [${report.level.toUpperCase()}]`);
        console.error("Message:", report.message);
        if (report.stack) console.error("Stack:", report.stack);
        if (report.metadata) console.error("Metadata:", report.metadata);
        console.groupEnd();
      }
    } catch (error) {
      // Fallback to console if reporting fails
      console.error("Failed to report error:", error);
      console.error("Original error:", errorData);
    }
  }

  // Public methods for manual error reporting
  error(message: string, metadata?: Record<string, any>): void {
    this.reportError({ message, level: "error", metadata });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.reportError({ message, level: "warn", metadata });
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.reportError({ message, level: "info", metadata });
  }

  // Track user interactions for context
  trackUserAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User Action: ${action}`, { type: "user-action", ...metadata });
  }

  // Track API errors
  trackApiError(
    endpoint: string,
    status: number,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.error(`API Error: ${endpoint} (${status})`, {
      type: "api-error",
      endpoint,
      status,
      message,
      ...metadata,
    });
  }

  // Track form validation errors
  trackValidationError(form: string, field: string, message: string): void {
    this.warn(`Validation Error: ${form}.${field}`, {
      type: "validation-error",
      form,
      field,
      message,
    });
  }
}

// Export singleton instance
export const clientErrorTracker = ClientErrorTracker.getInstance();

// React hook for easy integration
export function useErrorTracking(userId?: string) {
  React.useEffect(() => {
    clientErrorTracker.initialize(userId);
  }, [userId]);

  return {
    reportError: clientErrorTracker.reportError.bind(clientErrorTracker),
    error: clientErrorTracker.error.bind(clientErrorTracker),
    warn: clientErrorTracker.warn.bind(clientErrorTracker),
    info: clientErrorTracker.info.bind(clientErrorTracker),
    trackUserAction: clientErrorTracker.trackUserAction.bind(clientErrorTracker),
    trackApiError: clientErrorTracker.trackApiError.bind(clientErrorTracker),
    trackValidationError: clientErrorTracker.trackValidationError.bind(clientErrorTracker),
  };
}
