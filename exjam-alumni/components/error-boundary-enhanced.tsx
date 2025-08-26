"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Send error to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${error.message} | ${errorInfo.componentStack}`,
        fatal: false,
      });
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} retry={this.retry} />;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We encountered an unexpected error. Don't worry, we're working to fix it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm">
                  <p className="font-semibold text-red-800 mb-2">Error Details:</p>
                  <p className="text-red-700 font-mono text-xs break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <Button onClick={this.retry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/contact'} 
                  className="w-full text-sm"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 mt-6">
                If this problem persists, please contact our support team.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// React Hook Error Boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Application Error:', error);
    setError(error);

    // Log to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }, []);

  return { error, resetError, handleError };
}

// Enhanced Error Boundary with more features
export default function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
}

// Specific fallback for API errors
export function APIErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isDatabaseError = error.message.includes('database') || error.message.includes('connection');

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {isNetworkError ? 'Connection Issue' : isDatabaseError ? 'Service Temporarily Unavailable' : 'Loading Error'}
      </h3>
      
      <p className="mb-6 text-gray-600">
        {isNetworkError 
          ? 'Please check your internet connection and try again.'
          : isDatabaseError 
            ? 'Our services are temporarily unavailable. Please try again in a moment.'
            : 'We encountered an issue loading this content.'
        }
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={retry} size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        
        <Button variant="outline" onClick={() => window.location.reload()} size="sm">
          Refresh Page
        </Button>
      </div>
    </div>
  );
}