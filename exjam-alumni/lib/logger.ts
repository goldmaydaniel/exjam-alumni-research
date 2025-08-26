import { NextRequest } from "next/server";

// Log levels
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: Error;
  stack?: string;
}

// Configuration
const LOG_CONFIG = {
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  enableDatabase: process.env.NODE_ENV === "production",
  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};

class Logger {
  private static instance: Logger;
  private requestId: string | null = null;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(LOG_CONFIG.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? `[${entry.context}]` : "";
    const requestId = entry.requestId ? `[${entry.requestId}]` : "";

    let logLine = `${timestamp} ${level} ${context}${requestId} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logLine += ` | Metadata: ${JSON.stringify(entry.metadata)}`;
    }

    if (entry.error) {
      logLine += ` | Error: ${entry.error.message}`;
      if (entry.stack) {
        logLine += `\\nStack: ${entry.stack}`;
      }
    }

    return logLine;
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    const formattedLog = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!LOG_CONFIG.enableDatabase) return;

    try {
      // In a real app, you would write to your database here
      // For now, we'll just store in memory or send to external service
      if (process.env.WEBHOOK_LOG_URL) {
        await fetch(process.env.WEBHOOK_LOG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      console.error("Failed to write log to database:", error);
    }
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      requestId: this.requestId || undefined,
      metadata,
      error,
      stack: error?.stack,
    };

    // Write to different outputs
    if (LOG_CONFIG.enableConsole) {
      await this.writeToConsole(entry);
    }

    if (LOG_CONFIG.enableDatabase) {
      await this.writeToDatabase(entry);
    }
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  // API-specific logging methods
  apiRequest(req: NextRequest, context?: string): void {
    const metadata = {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    };

    this.info(`API Request: ${req.method} ${req.url}`, context, metadata);
  }

  apiResponse(status: number, duration: number, context?: string): void {
    const metadata = { status, duration };
    const message = `API Response: ${status} (${duration}ms)`;

    if (status >= 400) {
      this.warn(message, context, metadata);
    } else {
      this.info(message, context, metadata);
    }
  }

  databaseQuery(query: string, duration: number, context?: string): void {
    const metadata = { query: query.substring(0, 100) + "...", duration };
    this.debug(`Database Query (${duration}ms)`, context, metadata);
  }

  authEvent(
    event: string,
    userId?: string,
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const logMetadata = { ...metadata, userId };
    this.info(`Auth Event: ${event}`, context, logMetadata);
  }

  securityEvent(
    event: string,
    severity: "low" | "medium" | "high",
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const logMetadata = { ...metadata, severity };
    const message = `Security Event: ${event}`;

    if (severity === "high") {
      this.error(message, undefined, context, logMetadata);
    } else if (severity === "medium") {
      this.warn(message, context, logMetadata);
    } else {
      this.info(message, context, logMetadata);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility function to generate request IDs
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware helper for request logging
export function withRequestLogging<T extends (...args: any[]) => any>(
  handler: T,
  context?: string
): T {
  return ((...args: any[]) => {
    const requestId = generateRequestId();
    logger.setRequestId(requestId);

    try {
      return handler(...args);
    } catch (error) {
      logger.error("Unhandled error in handler", error as Error, context);
      throw error;
    }
  }) as T;
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number;
  private context: string;

  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
    logger.debug(`Started: ${context}`);
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    logger.debug(`Completed: ${this.context} (${duration}ms)`, this.context, metadata);
    return duration;
  }

  static async measure<T>(
    context: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const monitor = new PerformanceMonitor(context);
    try {
      const result = await operation();
      monitor.end(metadata);
      return result;
    } catch (error) {
      logger.error(`Failed: ${context}`, error as Error, context, metadata);
      monitor.end({ ...metadata, error: true });
      throw error;
    }
  }
}
