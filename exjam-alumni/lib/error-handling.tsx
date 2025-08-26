import toast from "react-hot-toast";

export class AppError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface ErrorWithRetry {
  error: Error;
  retry: () => void;
  cancel: () => void;
}

// Error types with user-friendly messages
export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: "Unable to connect. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  SERVER_ERROR: "Server error occurred. Please try again later.",

  // Auth errors
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to access this resource.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  INVALID_CREDENTIALS: "Invalid email or password.",

  // Validation errors
  VALIDATION_ERROR: "Please check your input and try again.",
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",

  // Resource errors
  NOT_FOUND: "The requested resource was not found.",
  ALREADY_EXISTS: "This resource already exists.",
  CONFLICT: "A conflict occurred. Please refresh and try again.",

  // Payment errors
  PAYMENT_FAILED: "Payment processing failed. Please try again.",
  INSUFFICIENT_FUNDS: "Insufficient funds for this transaction.",
  CARD_DECLINED: "Your card was declined. Please try another payment method.",

  // File errors
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE: "Invalid file type. Please upload a supported format.",
  UPLOAD_FAILED: "File upload failed. Please try again.",

  // Generic
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  MAINTENANCE: "System is under maintenance. Please try again later.",
};

// Error handler with retry logic
export class ErrorHandler {
  private static retryQueue = new Map<string, RetryConfig>();

  static handle(
    error: any,
    options: {
      showToast?: boolean;
      context?: string;
      retry?: () => Promise<void>;
      fallback?: () => void;
    } = {}
  ) {
    const { showToast = true, context, retry, fallback } = options;

    // Parse error
    const errorInfo = this.parseError(error);

    // Log error
    this.logError(errorInfo, context);

    // Show user notification
    if (showToast) {
      this.showErrorNotification(errorInfo, retry);
    }

    // Execute fallback if provided
    if (fallback) {
      fallback();
    }

    return errorInfo;
  }

  private static parseError(error: any): ErrorInfo {
    // Network error
    if (error.name === "NetworkError" || !navigator.onLine) {
      return {
        message: ErrorMessages.NETWORK_ERROR,
        code: "NETWORK_ERROR",
        canRetry: true,
      };
    }

    // Timeout error
    if (error.name === "TimeoutError") {
      return {
        message: ErrorMessages.TIMEOUT_ERROR,
        code: "TIMEOUT",
        canRetry: true,
      };
    }

    // HTTP error responses
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          return {
            message: data?.message || ErrorMessages.UNAUTHORIZED,
            code: "UNAUTHORIZED",
            canRetry: false,
          };
        case 403:
          return {
            message: data?.message || ErrorMessages.FORBIDDEN,
            code: "FORBIDDEN",
            canRetry: false,
          };
        case 404:
          return {
            message: data?.message || ErrorMessages.NOT_FOUND,
            code: "NOT_FOUND",
            canRetry: false,
          };
        case 409:
          return {
            message: data?.message || ErrorMessages.CONFLICT,
            code: "CONFLICT",
            canRetry: true,
          };
        case 422:
          return {
            message: data?.message || ErrorMessages.VALIDATION_ERROR,
            code: "VALIDATION_ERROR",
            canRetry: false,
            details: data?.errors,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            message: data?.message || ErrorMessages.SERVER_ERROR,
            code: "SERVER_ERROR",
            canRetry: true,
          };
        default:
          return {
            message: data?.message || ErrorMessages.UNKNOWN_ERROR,
            code: "UNKNOWN",
            canRetry: true,
          };
      }
    }

    // App errors
    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code || "APP_ERROR",
        canRetry: false,
        details: error.details,
      };
    }

    // Generic errors
    return {
      message: error.message || ErrorMessages.UNKNOWN_ERROR,
      code: "UNKNOWN",
      canRetry: true,
    };
  }

  private static logError(errorInfo: ErrorInfo, context?: string) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      context,
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", errorLog);
    }

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && window.Sentry) {
      window.Sentry.captureException(new Error(errorInfo.message), {
        extra: errorLog,
      });
    }

    // Store in local storage for debugging
    const errors = JSON.parse(localStorage.getItem("app-errors") || "[]");
    errors.push(errorLog);
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.shift();
    }
    localStorage.setItem("app-errors", JSON.stringify(errors));
  }

  private static showErrorNotification(errorInfo: ErrorInfo, retry?: () => Promise<void>) {
    if (errorInfo.canRetry && retry) {
      // Show toast with retry option
      toast.error(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium">{errorInfo.message}</p>
              {errorInfo.details && (
                <p className="mt-1 text-sm opacity-90">{JSON.stringify(errorInfo.details)}</p>
              )}
            </div>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                toast.loading("Retrying...");
                try {
                  await retry();
                  toast.dismiss();
                  toast.success("Success!");
                } catch (error) {
                  toast.dismiss();
                  this.handle(error, { showToast: true });
                }
              }}
              className="rounded-md bg-white px-3 py-1 text-red-600 transition-colors hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ),
        {
          duration: 6000,
        }
      );
    } else {
      // Show simple error toast
      toast.error(errorInfo.message, {
        duration: 4000,
      });
    }
  }

  // Exponential backoff retry
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: number;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const { maxAttempts = 3, delay = 1000, backoff = 2, onRetry } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          throw error;
        }

        if (onRetry) {
          onRetry(attempt, error);
        }

        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw lastError;
  }
}

interface ErrorInfo {
  message: string;
  code: string;
  canRetry: boolean;
  details?: any;
}

interface RetryConfig {
  fn: () => Promise<void>;
  attempts: number;
  maxAttempts: number;
}

// Global window error handler
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    ErrorHandler.handle(event.reason, {
      context: "Unhandled Promise Rejection",
    });
  });

  window.addEventListener("error", (event) => {
    ErrorHandler.handle(event.error, {
      context: "Global Error",
    });
  });
}

// API error interceptor
export function createApiClient(baseURL: string) {
  const client = {
    async request(url: string, options: RequestInit = {}) {
      const timeout = 30000; // 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseURL}${url}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw {
            response: {
              status: response.status,
              data: await response.json().catch(() => ({})),
            },
          };
        }

        return await response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          throw new Error("Request timeout");
        }

        throw error;
      }
    },

    get(url: string) {
      return this.request(url, { method: "GET" });
    },

    post(url: string, data?: any) {
      return this.request(url, {
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      });
    },

    put(url: string, data?: any) {
      return this.request(url, {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      });
    },

    delete(url: string) {
      return this.request(url, { method: "DELETE" });
    },
  };

  return client;
}

// React Error Boundary wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return class WithErrorBoundary extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      ErrorHandler.handle(error, {
        context: `React Error Boundary: ${Component.name}`,
        showToast: true,
      });
    }

    render() {
      if (this.state.hasError && fallback) {
        const FallbackComponent = fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            reset={() => this.setState({ hasError: false })}
          />
        );
      }

      return <Component {...this.props} />;
    }
  };
}
