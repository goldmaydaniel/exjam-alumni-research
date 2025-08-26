"use client";

import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface ErrorUIProps {
  error?: Error | null;
  title?: string;
  description?: string;
  showRefresh?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  showSupport?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function ErrorUI({
  error,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  showRefresh = true,
  showHome = true,
  showBack = false,
  showSupport = false,
  onRetry,
  className = "",
}: ErrorUIProps) {
  const isNetworkError =
    error?.message?.toLowerCase().includes("network") ||
    error?.message?.toLowerCase().includes("fetch");
  const isAuthError =
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("forbidden");

  const getErrorType = () => {
    if (isNetworkError) return "Network Error";
    if (isAuthError) return "Authentication Error";
    return "Application Error";
  };

  const getErrorColor = () => {
    if (isNetworkError) return "text-orange-600";
    if (isAuthError) return "text-yellow-600";
    return "text-red-600";
  };

  const getErrorIcon = () => {
    if (isNetworkError) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    if (isAuthError) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getErrorSuggestion = () => {
    if (isNetworkError) {
      return "Please check your internet connection and try again.";
    }
    if (isAuthError) {
      return "Your session may have expired. Please sign in again.";
    }
    return "This appears to be a technical issue. Please try refreshing the page.";
  };

  return (
    <div className={`flex min-h-[400px] items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className={`font-medium ${getErrorColor()}`}>{getErrorType()}</p>
                  <p className="text-sm text-muted-foreground">{getErrorSuggestion()}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showRefresh && onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}

            {showRefresh && !onRetry && (
              <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            )}

            {showHome && (
              <Button variant="outline" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            )}

            {showBack && (
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>

          {showSupport && (
            <div className="mt-6 border-t pt-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">Still having trouble?</p>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/contact" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          )}

          {/* Development error details */}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 rounded-lg bg-red-50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-red-800">
                Debug Information (Development Only)
              </summary>
              <div className="mt-2 font-mono text-xs text-red-700">
                <div className="break-all">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    <strong>Stack:</strong> {error.stack}
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error components
export function NetworkErrorUI({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorUI
      title="Connection Problem"
      description="Unable to connect to our servers. Please check your internet connection."
      error={new Error("Network error")}
      onRetry={onRetry}
      showSupport={true}
    />
  );
}

export function AuthErrorUI() {
  return (
    <ErrorUI
      title="Authentication Required"
      description="You need to sign in to access this page."
      error={new Error("Authentication error")}
      showRefresh={false}
      showHome={true}
    />
  );
}

export function NotFoundErrorUI({
  title = "Page Not Found",
  description = "The page you're looking for doesn't exist or has been moved.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <ErrorUI
      title={title}
      description={description}
      showRefresh={false}
      showHome={true}
      showBack={true}
    />
  );
}

// Hook for consistent error handling
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`[Error${context ? ` in ${context}` : ""}]:`, error);

    // You can add error reporting service here
    // Example: Sentry.captureException(error);
  };

  return { handleError };
}
