import { NextRequest, NextResponse } from "next/server";

interface RequestLog {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  userId?: string;
}

export class RequestLogger {
  private static logs: RequestLog[] = [];
  private static maxLogs = 1000;

  static log(entry: RequestLog) {
    // Add to logs
    this.logs.unshift(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === "development") {
      const duration = entry.duration ? `${entry.duration}ms` : "pending";
      const status = entry.status ? `${entry.status}` : "pending";
      const ip = entry.ip || "unknown";

      console.log(`${entry.method} ${entry.url} - ${status} - ${duration} - ${ip}`);

      if (entry.error) {
        console.error(`Error: ${entry.error}`);
      }
    }
  }

  static getLogs(limit: number = 100): RequestLog[] {
    return this.logs.slice(0, limit);
  }

  static getLogsByUser(userId: string, limit: number = 50): RequestLog[] {
    return this.logs.filter((log) => log.userId === userId).slice(0, limit);
  }

  static clearLogs() {
    this.logs = [];
  }
}

export function withRequestLogging<T>(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    // Extract request info
    const method = req.method;
    const url = req.url;
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || req.ip || undefined;

    // Extract user ID from auth header if present
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.userId || payload.sub;
      } catch {
        // Invalid token, ignore
      }
    }

    const logEntry: RequestLog = {
      method,
      url,
      userAgent,
      ip,
      startTime,
      userId,
    };

    try {
      const response = await handler(req);

      // Log successful completion
      logEntry.endTime = Date.now();
      logEntry.duration = logEntry.endTime - startTime;
      logEntry.status = response.status;

      RequestLogger.log(logEntry);

      // Add request ID header
      response.headers.set(
        "X-Request-ID",
        `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`
      );

      return response;
    } catch (error: any) {
      // Log error
      logEntry.endTime = Date.now();
      logEntry.duration = logEntry.endTime - startTime;
      logEntry.error = error.message || "Unknown error";
      logEntry.status = error.status || 500;

      RequestLogger.log(logEntry);

      throw error;
    }
  };
}

// Security helper to detect suspicious activity
export class SecurityMonitor {
  private static suspiciousPatterns = [
    /(\.\.\/)|(\.\.\\)/, // Directory traversal
    /<script[^>]*>/i, // XSS attempts
    /union.*select/i, // SQL injection
    /(\-\-|\/\*).*(\*\/|$)/, // SQL comments
    /eval\s*\(/i, // Code injection
  ];

  static isSuspiciousRequest(req: NextRequest): boolean {
    const url = req.url;
    const userAgent = req.headers.get("user-agent") || "";

    // Check URL for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        return true;
      }
    }

    // Check for excessive request size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      // 10MB
      return true;
    }

    return false;
  }

  static async logSuspiciousActivity(req: NextRequest, reason: string) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      req.ip ||
      "unknown";

    const suspiciousLog = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent: req.headers.get("user-agent"),
      url: req.url,
      method: req.method,
      reason,
      headers: Object.fromEntries(req.headers.entries()),
    };

    console.warn("🚨 Suspicious activity detected:", suspiciousLog);

    // In production, you might want to:
    // - Send to security monitoring service
    // - Temporarily block the IP
    // - Send alerts to administrators
  }
}

export function withSecurityMonitoring<T>(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (SecurityMonitor.isSuspiciousRequest(req)) {
      await SecurityMonitor.logSuspiciousActivity(req, "Suspicious patterns detected");

      // Optionally block the request
      return NextResponse.json({ error: "Request blocked" }, { status: 403 });
    }

    return handler(req);
  };
}
