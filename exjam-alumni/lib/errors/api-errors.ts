/**
 * Comprehensive API Error System
 * Provides structured error handling with proper HTTP status codes and error codes
 */

export enum ErrorCode {
  // Authentication Errors (1000-1999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS', 
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Validation Errors (2000-2999)  
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Resource Errors (3000-3999)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  
  // Business Logic Errors (4000-4999)
  EVENT_FULL = 'EVENT_FULL',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_CAPACITY = 'INSUFFICIENT_CAPACITY',
  
  // Rate Limiting (5000-5999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // External Service Errors (6000-6999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR = 'PAYMENT_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',
  
  // System Errors (7000-7999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorDetails {
  field?: string;
  value?: any;
  constraint?: string;
  expected?: string;
  received?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: ErrorDetails[];
  public readonly timestamp: string;
  public readonly path?: string;
  public readonly userId?: string;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetails[],
    path?: string,
    userId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.path = path;
    this.userId = userId;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        path: this.path,
        details: this.details,
      }
    };
  }
}

// Predefined error factories
export const createError = {
  // Authentication Errors
  unauthorized: (message = 'Authentication required', path?: string): ApiError =>
    new ApiError(401, ErrorCode.UNAUTHORIZED, message, undefined, path),
    
  invalidCredentials: (message = 'Invalid credentials provided', path?: string): ApiError =>
    new ApiError(401, ErrorCode.INVALID_CREDENTIALS, message, undefined, path),
    
  forbidden: (message = 'Insufficient permissions', path?: string): ApiError =>
    new ApiError(403, ErrorCode.INSUFFICIENT_PERMISSIONS, message, undefined, path),
    
  // Validation Errors
  validation: (details: ErrorDetails[], message = 'Validation failed', path?: string): ApiError =>
    new ApiError(400, ErrorCode.VALIDATION_ERROR, message, details, path),
    
  invalidInput: (field: string, value: any, expected: string, path?: string): ApiError =>
    new ApiError(400, ErrorCode.INVALID_INPUT, `Invalid ${field}: expected ${expected}`, 
      [{ field, value, expected }], path),
      
  missingField: (field: string, path?: string): ApiError =>
    new ApiError(400, ErrorCode.MISSING_REQUIRED_FIELD, `Missing required field: ${field}`,
      [{ field, constraint: 'required' }], path),
      
  // Resource Errors
  notFound: (resource: string, identifier?: string, path?: string): ApiError => {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    return new ApiError(404, ErrorCode.NOT_FOUND, message, undefined, path);
  },
  
  alreadyExists: (resource: string, field: string, value: any, path?: string): ApiError =>
    new ApiError(409, ErrorCode.ALREADY_EXISTS, `${resource} with ${field} '${value}' already exists`,
      [{ field, value, constraint: 'unique' }], path),
      
  conflict: (message: string, details?: ErrorDetails[], path?: string): ApiError =>
    new ApiError(409, ErrorCode.CONFLICT, message, details, path),
    
  // Business Logic Errors  
  eventFull: (eventId: string, path?: string): ApiError =>
    new ApiError(400, ErrorCode.EVENT_FULL, 'Event is at full capacity',
      [{ field: 'eventId', value: eventId }], path),
      
  alreadyRegistered: (eventId: string, userId: string, path?: string): ApiError =>
    new ApiError(409, ErrorCode.ALREADY_REGISTERED, 'User is already registered for this event',
      [{ field: 'eventId', value: eventId }, { field: 'userId', value: userId }], path),
      
  registrationClosed: (eventId: string, path?: string): ApiError =>
    new ApiError(400, ErrorCode.REGISTRATION_CLOSED, 'Registration for this event is closed',
      [{ field: 'eventId', value: eventId }], path),
      
  paymentRequired: (amount: number, currency = 'NGN', path?: string): ApiError =>
    new ApiError(402, ErrorCode.PAYMENT_REQUIRED, `Payment of ${amount} ${currency} required`,
      [{ field: 'amount', value: amount }, { field: 'currency', value: currency }], path),
      
  // Rate Limiting
  rateLimitExceeded: (limit: number, windowMs: number, path?: string): ApiError =>
    new ApiError(429, ErrorCode.RATE_LIMIT_EXCEEDED, 
      `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      [{ field: 'limit', value: limit }, { field: 'window', value: windowMs }], path),
      
  // External Services
  externalServiceError: (service: string, message: string, path?: string): ApiError =>
    new ApiError(503, ErrorCode.EXTERNAL_SERVICE_ERROR, 
      `External service error (${service}): ${message}`,
      [{ field: 'service', value: service }], path),
      
  emailServiceError: (message: string, path?: string): ApiError =>
    new ApiError(503, ErrorCode.EMAIL_SERVICE_ERROR, `Email service error: ${message}`, undefined, path),
    
  // System Errors
  internalError: (message = 'Internal server error', path?: string, userId?: string): ApiError =>
    new ApiError(500, ErrorCode.INTERNAL_SERVER_ERROR, message, undefined, path, userId),
    
  databaseError: (operation: string, error: string, path?: string): ApiError =>
    new ApiError(500, ErrorCode.DATABASE_ERROR, `Database error during ${operation}: ${error}`,
      [{ field: 'operation', value: operation }], path),
      
  serviceUnavailable: (service: string, path?: string): ApiError =>
    new ApiError(503, ErrorCode.SERVICE_UNAVAILABLE, `Service ${service} is currently unavailable`,
      [{ field: 'service', value: service }], path),
};

// Error type guards
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isPrismaError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function isZodError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && 
         (error as any).name === 'ZodError';
}

// Error conversion utilities
export function handlePrismaError(error: any, path?: string): ApiError {
  switch (error.code) {
    case 'P2002': // Unique constraint failed
      const target = error.meta?.target?.[0] || 'field';
      return createError.alreadyExists('Record', target, 'duplicate value', path);
      
    case 'P2025': // Record not found
      return createError.notFound('Record', undefined, path);
      
    case 'P2003': // Foreign key constraint failed
      return createError.validation([{
        field: error.meta?.field_name || 'reference',
        constraint: 'foreign_key'
      }], 'Invalid reference', path);
      
    case 'P2021': // Table does not exist
      return createError.internalError('Database configuration error', path);
      
    default:
      return createError.databaseError('unknown operation', error.message, path);
  }
}

export function handleZodError(error: any, path?: string): ApiError {
  const details: ErrorDetails[] = error.errors.map((err: any) => ({
    field: err.path.join('.'),
    value: err.received,
    expected: err.expected,
    constraint: err.code,
  }));
  
  return createError.validation(details, 'Input validation failed', path);
}

// Global error handler utility
export function handleUnknownError(error: unknown, path?: string, userId?: string): ApiError {
  if (isApiError(error)) {
    return error;
  }
  
  if (isPrismaError(error)) {
    return handlePrismaError(error, path);
  }
  
  if (isZodError(error)) {
    return handleZodError(error, path);
  }
  
  // Handle specific error types
  if (error instanceof Error) {
    if (error.name === 'ValidationError') {
      return createError.validation([], error.message, path);
    }
    
    if (error.name === 'CastError') {
      return createError.invalidInput('id', (error as any).value, 'valid ObjectId', path);
    }
    
    return createError.internalError(error.message, path, userId);
  }
  
  // Unknown error type
  return createError.internalError('An unexpected error occurred', path, userId);
}