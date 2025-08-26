import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ErrorResponse {
  error: string;
  details?: any;
  code?: string;
  timestamp: string;
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
  constructor(message: string = "Authentication failed", details?: any) {
    super(message, 401, "AUTH_ERROR", details);
    this.name = "AuthError";
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied", details?: any) {
    super(message, 403, "AUTHORIZATION_ERROR", details);
    this.name = "AuthorizationError";
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: any) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", details?: any) {
    super(message, 429, "RATE_LIMIT", details);
    this.name = "RateLimitError";
  }
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  console.error("Error occurred:", error);

  // Default error response
  let statusCode = 500;
  let message = "An unexpected error occurred";
  let code = "INTERNAL_ERROR";
  let details: any = undefined;

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || code;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    code = "VALIDATION_ERROR";
    details = error.flatten();
  } else if (error instanceof Error) {
    // Supabase errors
    if (error.message.includes("Invalid login credentials")) {
      statusCode = 401;
      message = "Invalid email or password";
      code = "INVALID_CREDENTIALS";
    } else if (error.message.includes("User already registered")) {
      statusCode = 400;
      message = "This email is already registered";
      code = "USER_EXISTS";
    } else if (error.message.includes("Email not confirmed")) {
      statusCode = 401;
      message = "Please verify your email before signing in";
      code = "EMAIL_NOT_VERIFIED";
    } else if (error.message.includes("JWT")) {
      statusCode = 401;
      message = "Session expired. Please sign in again";
      code = "SESSION_EXPIRED";
    } else if (error.message.includes("Database")) {
      statusCode = 500;
      message = "Database error occurred";
      code = "DATABASE_ERROR";
    } else {
      message = error.message;
    }
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  // Add details in development
  if (process.env.NODE_ENV === "development" && details) {
    errorResponse.details = details;
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T = any>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: "The email or password you entered is incorrect. Please try again.",
  EMAIL_NOT_VERIFIED: "Please check your email and verify your account before signing in.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again to continue.",
  UNAUTHORIZED: "You need to be signed in to access this resource.",
  FORBIDDEN: "You don't have permission to access this resource.",
  
  // Registration errors
  EMAIL_EXISTS: "An account with this email already exists. Please sign in or use a different email.",
  WEAK_PASSWORD: "Your password is too weak. Please choose a stronger password.",
  REGISTRATION_FAILED: "We couldn't create your account. Please try again.",
  
  // Validation errors
  INVALID_EMAIL: "Please enter a valid email address.",
  REQUIRED_FIELD: "This field is required.",
  INVALID_INPUT: "Please check your input and try again.",
  
  // Network errors
  NETWORK_ERROR: "Connection error. Please check your internet and try again.",
  TIMEOUT: "The request took too long. Please try again.",
  
  // Rate limiting
  RATE_LIMIT: "Too many attempts. Please wait a few minutes and try again.",
  
  // General errors
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
  NOT_FOUND: "The requested resource could not be found.",
  SERVER_ERROR: "A server error occurred. Our team has been notified.",
} as const;

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Map common error messages to user-friendly ones
    const message = error.message.toLowerCase();
    
    if (message.includes("invalid") && message.includes("credentials")) {
      return ErrorMessages.INVALID_CREDENTIALS;
    }
    if (message.includes("email") && message.includes("not confirmed")) {
      return ErrorMessages.EMAIL_NOT_VERIFIED;
    }
    if (message.includes("jwt") || message.includes("token")) {
      return ErrorMessages.SESSION_EXPIRED;
    }
    if (message.includes("already registered") || message.includes("already exists")) {
      return ErrorMessages.EMAIL_EXISTS;
    }
    if (message.includes("network") || message.includes("fetch")) {
      return ErrorMessages.NETWORK_ERROR;
    }
    if (message.includes("rate limit") || message.includes("too many")) {
      return ErrorMessages.RATE_LIMIT;
    }
    
    // Return the original message if no mapping found
    return error.message;
  }
  
  return ErrorMessages.SOMETHING_WENT_WRONG;
}