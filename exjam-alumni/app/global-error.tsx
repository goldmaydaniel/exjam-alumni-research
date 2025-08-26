"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-6">
                <AlertTriangle className="h-16 w-16 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">Something went wrong!</h1>
              <p className="leading-relaxed text-gray-600">
                We encountered an unexpected error. Our technical team has been notified and is
                working on a fix.
              </p>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === "development" && (
              <div className="rounded-lg bg-gray-100 p-4 text-left">
                <p className="break-all font-mono text-sm text-gray-800">{error.message}</p>
                {error.digest && (
                  <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 rounded-2xl border bg-white p-6 shadow-lg">
              <Button onClick={reset} className="w-full justify-start" size="lg">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button asChild variant="outline" className="w-full justify-start" size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Link>
              </Button>
            </div>

            {/* Support Info */}
            <div className="space-y-1 text-sm text-gray-500">
              <p>Need immediate assistance?</p>
              <Link
                href="/contact"
                className="font-medium text-red-600 transition-colors hover:text-red-800"
              >
                Contact Technical Support
              </Link>
            </div>

            {/* Brand Footer */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-xs text-gray-400">© 2025 The ExJAM Association</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
