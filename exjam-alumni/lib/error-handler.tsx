import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements APIError {
  public statusCode: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", headers?: Record<string, string>) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { headers });
  }
}

export class PaymentError extends AppError {
  constructor(message: string = "Payment processing failed", details?: any) {
    super(message, 402, "PAYMENT_ERROR", details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = "External service unavailable", details?: any) {
    super(`${service}: ${message}`, 502, "EXTERNAL_SERVICE_ERROR", { service, ...details });
  }
}

/**
 * Global error handler for API routes
 */
export function handleAPIError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Handle known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(process.env.NODE_ENV === "development" && { details: error.details }),
      },
      {
        status: error.statusCode,
        headers: error.details?.headers || {},
      }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: "Database validation error",
        code: "DATABASE_VALIDATION_ERROR",
        ...(process.env.NODE_ENV === "development" && { details: error.message }),
      },
      { status: 400 }
    );
  }

  // Handle other known error types
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON in request body",
        code: "INVALID_JSON",
      },
      { status: 400 }
    );
  }

  // Handle network/fetch errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return NextResponse.json(
      {
        success: false,
        error: "External service unavailable",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 502 }
    );
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development" ? error.message : "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  // Fallback for unknown error types
  return NextResponse.json(
    {
      success: false,
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): NextResponse {
  switch (error.code) {
    case "P2002": // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(", ") || "field";
      return NextResponse.json(
        {
          success: false,
          error: `A record with this ${field} already exists`,
          code: "DUPLICATE_ENTRY",
          field,
        },
        { status: 409 }
      );

    case "P2025": // Record not found
      return NextResponse.json(
        {
          success: false,
          error: "Record not found",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );

    case "P2003": // Foreign key constraint violation
      return NextResponse.json(
        {
          success: false,
          error: "Related record not found",
          code: "FOREIGN_KEY_ERROR",
        },
        { status: 400 }
      );

    case "P2014": // Required relation missing
      return NextResponse.json(
        {
          success: false,
          error: "Required related record is missing",
          code: "REQUIRED_RELATION_MISSING",
        },
        { status: 400 }
      );

    case "P1008": // Connection timeout
      return NextResponse.json(
        {
          success: false,
          error: "Database connection timeout",
          code: "DATABASE_TIMEOUT",
        },
        { status: 503 }
      );

    default:
      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred",
          code: "DATABASE_ERROR",
          ...(process.env.NODE_ENV === "development" && {
            details: error.message,
            prismaCode: error.code,
          }),
        },
        { status: 500 }
      );
  }
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T extends any[], R>(handler: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Wrapper for async operations with error handling
 */
export async function safeAsync<T>(operation: () => Promise<T>, fallback?: T): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error("Safe async operation failed:", error);
    return fallback ?? null;
  }
}

/**
 * Log error details for monitoring
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : "";

  if (error instanceof AppError) {
    console.error(`${timestamp} ${contextStr} AppError:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }

  // In production, you would send this to a monitoring service
  // like Sentry, LogRocket, or similar
}

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
        <p className="mt-2 text-sm text-gray-500">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "We're sorry, but something unexpected happened. Please try again."}
        </p>
        <button
          onClick={resetError}
          className="mt-4 inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);
