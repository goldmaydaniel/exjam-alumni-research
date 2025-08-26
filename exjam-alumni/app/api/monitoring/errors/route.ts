import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { Validator, CommonSchemas } from "@/lib/validation";
import { z } from "zod";

// Error report schema
const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  url: z.string().url().optional(),
  userAgent: z.string().optional(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  level: z.enum(["error", "warn", "info"]).default("error"),
  metadata: z.record(z.any()).optional(),
});

const ErrorQuerySchema = z.object({
  level: z.enum(["error", "warn", "info", "all"]).default("all"),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default("50"),
  offset: z.string().transform(Number).pipe(z.number().int().min(0)).default("0"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// In-memory error storage (in production, use a database)
const errorLogs: Array<{
  id: string;
  timestamp: Date;
  level: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  metadata?: Record<string, any>;
}> = [];

let logId = 1;

// POST - Report an error
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = Validator.validate(ErrorReportSchema, body, "error-report");

    if (!validation.success) {
      logger.warn("Invalid error report received", "monitoring", { errors: validation.errors });
      return NextResponse.json(
        { error: "Invalid error report", details: validation.errors },
        { status: 400 }
      );
    }

    const errorData = validation.data!;
    const errorEntry = {
      id: (logId++).toString(),
      timestamp: errorData.timestamp ? new Date(errorData.timestamp) : new Date(),
      level: errorData.level,
      message: errorData.message,
      stack: errorData.stack,
      url: errorData.url,
      userAgent: errorData.userAgent || request.headers.get("user-agent") || undefined,
      userId: errorData.userId,
      metadata: {
        ...errorData.metadata,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        referer: request.headers.get("referer"),
      },
    };

    // Store the error
    errorLogs.push(errorEntry);

    // Keep only last 1000 errors in memory
    if (errorLogs.length > 1000) {
      errorLogs.splice(0, errorLogs.length - 1000);
    }

    // Log to our system
    logger.error(`Client Error: ${errorData.message}`, undefined, "client-error", errorEntry);

    return NextResponse.json({ success: true, errorId: errorEntry.id });
  } catch (error) {
    logger.error("Failed to process error report", error as Error, "monitoring");
    return NextResponse.json({ error: "Failed to process error report" }, { status: 500 });
  }
}

// GET - Retrieve error logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    const validation = Validator.validate(ErrorQuerySchema, queryData, "error-query");
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    const { level, limit, offset, from, to } = validation.data!;

    // Filter errors
    let filteredErrors = errorLogs;

    if (level !== "all") {
      filteredErrors = filteredErrors.filter((error) => error.level === level);
    }

    if (from) {
      const fromDate = new Date(from);
      filteredErrors = filteredErrors.filter((error) => error.timestamp >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      filteredErrors = filteredErrors.filter((error) => error.timestamp <= toDate);
    }

    // Sort by timestamp (newest first)
    filteredErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginate
    const paginatedErrors = filteredErrors.slice(offset, offset + limit);

    const response = {
      errors: paginatedErrors,
      total: filteredErrors.length,
      limit,
      offset,
      hasMore: offset + limit < filteredErrors.length,
    };

    logger.info(
      `Error logs retrieved: ${paginatedErrors.length}/${filteredErrors.length}`,
      "monitoring"
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Failed to retrieve error logs", error as Error, "monitoring");
    return NextResponse.json({ error: "Failed to retrieve error logs" }, { status: 500 });
  }
}

// DELETE - Clear error logs (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // In a real app, you would check for admin authentication here
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clearedCount = errorLogs.length;
    errorLogs.splice(0, errorLogs.length);

    logger.info(`Error logs cleared: ${clearedCount} entries`, "monitoring");

    return NextResponse.json({ success: true, clearedCount });
  } catch (error) {
    logger.error("Failed to clear error logs", error as Error, "monitoring");
    return NextResponse.json({ error: "Failed to clear error logs" }, { status: 500 });
  }
}
