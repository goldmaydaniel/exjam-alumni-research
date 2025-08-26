import { NextResponse } from "next/server";

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

export function errorResponse(error: string, status: number = 500, details?: any): NextResponse {
  const response: APIResponse = {
    success: false,
    error,
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

export function validationErrorResponse(details: any): NextResponse {
  return errorResponse("Validation error", 400, details);
}

export function unauthorizedResponse(message: string = "Unauthorized"): NextResponse {
  return errorResponse(message, 401);
}

export function notFoundResponse(message: string = "Resource not found"): NextResponse {
  return errorResponse(message, 404);
}

export function rateLimitResponse(message: string = "Rate limit exceeded"): NextResponse {
  return errorResponse(message, 429);
}

export function serverErrorResponse(message: string = "Internal server error"): NextResponse {
  return errorResponse(message, 500);
}
