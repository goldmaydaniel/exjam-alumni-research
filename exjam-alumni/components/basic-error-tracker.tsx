"use client";

import { useEffect } from "react";

// Simple client-side error tracking hook
export function useBasicErrorTracking() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleError = (event: ErrorEvent) => {
      console.error("Application Error:", {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });

      // Simple fetch to monitoring API without dependencies
      const errorData = {
        message: event.message,
        level: "error",
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      // Non-blocking error report
      fetch("/api/monitoring/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorData),
      }).catch(() => {
        // Fail silently - don't let error reporting cause more errors
      });
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);
}

// Basic error display component
export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "500px",
          padding: "40px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          backgroundColor: "#f8fafc",
        }}
      >
        <h2 style={{ color: "#1f2937", marginBottom: "16px" }}>Something went wrong</h2>
        <p style={{ color: "#6b7280", marginBottom: "24px" }}>
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          Try Again
        </button>
        {process.env.NODE_ENV === "development" && (
          <details style={{ marginTop: "20px", textAlign: "left" }}>
            <summary style={{ cursor: "pointer", color: "#6b7280" }}>
              Error Details (Dev Only)
            </summary>
            <pre
              style={{
                fontSize: "12px",
                color: "#dc2626",
                overflow: "auto",
                marginTop: "8px",
                padding: "12px",
                backgroundColor: "#fef2f2",
                borderRadius: "4px",
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
