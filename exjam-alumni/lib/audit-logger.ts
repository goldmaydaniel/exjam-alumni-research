import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export interface AuditLogData {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || null,
        changes: data.changes || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging should be non-blocking
  }
}

/**
 * Extract IP address and user agent from request
 */
export function extractRequestInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || req.ip || "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}

/**
 * Common audit actions
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED: "PASSWORD_RESET_COMPLETED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",

  // User Management
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_ACTIVATED: "USER_ACTIVATED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",

  // Event Management
  EVENT_CREATED: "EVENT_CREATED",
  EVENT_UPDATED: "EVENT_UPDATED",
  EVENT_DELETED: "EVENT_DELETED",
  EVENT_PUBLISHED: "EVENT_PUBLISHED",
  EVENT_CANCELLED: "EVENT_CANCELLED",

  // Registration Management
  REGISTRATION_CREATED: "REGISTRATION_CREATED",
  REGISTRATION_UPDATED: "REGISTRATION_UPDATED",
  REGISTRATION_CANCELLED: "REGISTRATION_CANCELLED",
  REGISTRATION_CONFIRMED: "REGISTRATION_CONFIRMED",

  // Payment Management
  PAYMENT_INITIATED: "PAYMENT_INITIATED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",

  // Check-in Management
  TICKET_CHECKED_IN: "TICKET_CHECKED_IN",
  TICKET_GENERATED: "TICKET_GENERATED",

  // Admin Actions
  BULK_USER_UPDATE: "BULK_USER_UPDATE",
  DATA_EXPORT: "DATA_EXPORT",
  SETTINGS_CHANGED: "SETTINGS_CHANGED",

  // System Events
  SYSTEM_BACKUP: "SYSTEM_BACKUP",
  SYSTEM_MAINTENANCE: "SYSTEM_MAINTENANCE",
} as const;

/**
 * Entity types for audit logging
 */
export const AUDIT_ENTITIES = {
  USER: "User",
  EVENT: "Event",
  REGISTRATION: "Registration",
  PAYMENT: "Payment",
  TICKET: "Ticket",
  SYSTEM: "System",
  SETTINGS: "Settings",
} as const;

/**
 * Middleware function to automatically log API actions
 */
export function withAuditLog(action: string, entity: string, userId?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0] as NextRequest;
      const { ipAddress, userAgent } = extractRequestInfo(req);

      try {
        const result = await originalMethod.apply(this, args);

        // Log successful action
        await logAuditEvent({
          userId,
          action,
          entity,
          ipAddress,
          userAgent,
        });

        return result;
      } catch (error) {
        // Log failed action
        await logAuditEvent({
          userId,
          action: `${action}_FAILED`,
          entity,
          ipAddress,
          userAgent,
          changes: { error: error instanceof Error ? error.message : String(error) },
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper functions for common audit scenarios
 */
export class AuditLogger {
  static async logLogin(userId: string, req: NextRequest, success: boolean = true) {
    const { ipAddress, userAgent } = extractRequestInfo(req);

    await logAuditEvent({
      userId,
      action: success ? AUDIT_ACTIONS.LOGIN : AUDIT_ACTIONS.LOGIN_FAILED,
      entity: AUDIT_ENTITIES.USER,
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  static async logUserCreated(
    createdUserId: string,
    adminUserId?: string,
    changes?: any,
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId: adminUserId,
      action: AUDIT_ACTIONS.USER_CREATED,
      entity: AUDIT_ENTITIES.USER,
      entityId: createdUserId,
      changes,
      ...requestInfo,
    });
  }

  static async logUserUpdated(
    updatedUserId: string,
    adminUserId?: string,
    changes?: any,
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId: adminUserId,
      action: AUDIT_ACTIONS.USER_UPDATED,
      entity: AUDIT_ENTITIES.USER,
      entityId: updatedUserId,
      changes,
      ...requestInfo,
    });
  }

  static async logEventCreated(
    eventId: string,
    organizerId: string,
    eventData: any,
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId: organizerId,
      action: AUDIT_ACTIONS.EVENT_CREATED,
      entity: AUDIT_ENTITIES.EVENT,
      entityId: eventId,
      changes: eventData,
      ...requestInfo,
    });
  }

  static async logPayment(
    paymentId: string,
    userId: string,
    action: string,
    data: any,
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId,
      action,
      entity: AUDIT_ENTITIES.PAYMENT,
      entityId: paymentId,
      changes: data,
      ...requestInfo,
    });
  }

  static async logRegistration(
    registrationId: string,
    userId: string,
    action: string,
    data?: any,
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId,
      action,
      entity: AUDIT_ENTITIES.REGISTRATION,
      entityId: registrationId,
      changes: data,
      ...requestInfo,
    });
  }

  static async logBulkOperation(
    adminUserId: string,
    action: string,
    affectedIds: string[],
    req?: NextRequest
  ) {
    const requestInfo = req ? extractRequestInfo(req) : {};

    await logAuditEvent({
      userId: adminUserId,
      action,
      entity: AUDIT_ENTITIES.USER,
      changes: {
        affectedCount: affectedIds.length,
        affectedIds,
      },
      ...requestInfo,
    });
  }
}

/**
 * Query audit logs with filtering
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entity) where.entity = filters.entity;
  if (filters.entityId) where.entityId = filters.entityId;

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) where.timestamp.gte = filters.startDate;
    if (filters.endDate) where.timestamp.lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
