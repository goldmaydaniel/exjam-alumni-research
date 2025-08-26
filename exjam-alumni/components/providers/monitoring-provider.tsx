"use client";

import React, { useEffect } from "react";
import { clientErrorTracker } from "@/lib/client-error-tracker";
import { logger } from "@/lib/logger";

interface MonitoringProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function MonitoringProvider({ children, userId }: MonitoringProviderProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Initialize client-side error tracking
    clientErrorTracker.initialize(userId);

    // Track page load performance
    const startTime = performance.now();

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;

      if (loadTime > 3000) {
        clientErrorTracker.warn("Slow page load detected", {
          loadTime: Math.round(loadTime),
          url: window.location.href,
        });
      }

      clientErrorTracker.info("Page loaded successfully", {
        loadTime: Math.round(loadTime),
        url: window.location.href,
      });
    };

    // Check if already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    // Monitor console errors in development
    let originalConsoleError: typeof console.error;
    if (process.env.NODE_ENV === "development") {
      originalConsoleError = console.error;
      console.error = (...args) => {
        originalConsoleError(...args);

        // Report console errors to monitoring system
        const message = args
          .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
          .join(" ");

        clientErrorTracker.error(`Console Error: ${message}`, {
          type: "console-error",
          args: args.map((arg) => String(arg)),
        });
      };
    }

    // Cleanup function
    return () => {
      window.removeEventListener("load", handleLoad);
      if (originalConsoleError) {
        console.error = originalConsoleError;
      }
    };
  }, [userId]);

  return <>{children}</>;
}

// Hook for manual error tracking in components
export function useMonitoring() {
  return {
    trackError: clientErrorTracker.error.bind(clientErrorTracker),
    trackWarning: clientErrorTracker.warn.bind(clientErrorTracker),
    trackInfo: clientErrorTracker.info.bind(clientErrorTracker),
    trackUserAction: clientErrorTracker.trackUserAction.bind(clientErrorTracker),
    trackApiError: clientErrorTracker.trackApiError.bind(clientErrorTracker),
    trackValidationError: clientErrorTracker.trackValidationError.bind(clientErrorTracker),
  };
}

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 100) {
        // Warn if component takes more than 100ms
        clientErrorTracker.warn(`Slow component render: ${componentName}`, {
          renderTime: Math.round(renderTime),
          component: componentName,
        });
      }
    };
  }, [componentName]);
}
