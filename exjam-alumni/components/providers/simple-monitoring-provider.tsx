"use client";

import React, { useEffect } from "react";

interface SimpleMonitoringProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function SimpleMonitoringProvider({ children, userId }: SimpleMonitoringProviderProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Simple error tracking
    const handleError = (event: ErrorEvent) => {
      console.error("App Error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Send to monitoring API if available
      fetch("/api/monitoring/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: event.message,
          level: "error",
          stack: event.error?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId,
        }),
      }).catch(() => {
        // Fail silently if monitoring API is not available
      });
    };

    // Add error listener
    window.addEventListener("error", handleError);

    // Cleanup
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [userId]);

  return <>{children}</>;
}

// Simple error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SimpleErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">Something went wrong</h2>
              <p className="text-gray-600">Please refresh the page to try again.</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
