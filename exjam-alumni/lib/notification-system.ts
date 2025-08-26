import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export enum NotificationType {
  EVENT_REMINDER = "EVENT_REMINDER",
  PAYMENT_CONFIRMATION = "PAYMENT_CONFIRMATION",
  REGISTRATION_CONFIRMED = "REGISTRATION_CONFIRMED",
  EVENT_CANCELLED = "EVENT_CANCELLED",
  EVENT_UPDATED = "EVENT_UPDATED",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  ADMIN_MESSAGE = "ADMIN_MESSAGE",
}

/**
 * Create and send notification
 */
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || null,
        read: false,
        createdAt: new Date(),
      },
    });

    // Also send email for important notifications
    if (shouldSendEmail(data.type)) {
      await sendEmailNotification(data);
    }

    // In the future, could also send push notifications, SMS, etc.
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Bulk create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<NotificationData, "userId">
): Promise<void> {
  try {
    const notifications = userIds.map((userId) => ({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
      read: false,
      createdAt: new Date(),
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Send emails in batches to avoid overwhelming the email service
    if (shouldSendEmail(notification.type)) {
      for (const userId of userIds) {
        await sendEmailNotification({ ...notification, userId });
      }
    }
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
) {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  try {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Failed to get user notifications:", error);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      hasMore: false,
    };
  }
}

/**
 * Delete old notifications to keep database clean
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
  } catch (error) {
    console.error("Failed to cleanup old notifications:", error);
  }
}

/**
 * Determine if notification type should trigger an email
 */
function shouldSendEmail(type: NotificationType): boolean {
  const emailTypes = [
    NotificationType.EVENT_REMINDER,
    NotificationType.PAYMENT_CONFIRMATION,
    NotificationType.REGISTRATION_CONFIRMED,
    NotificationType.EVENT_CANCELLED,
    NotificationType.EVENT_UPDATED,
    NotificationType.ADMIN_MESSAGE,
  ];

  return emailTypes.includes(type);
}

/**
 * Send email notification
 */
async function sendEmailNotification(data: NotificationData): Promise<void> {
  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, firstName: true },
    });

    if (!user) {
      console.error("User not found for notification:", data.userId);
      return;
    }

    // Send email based on notification type
    await sendEmail({
      to: user.email,
      subject: data.title,
      html: generateEmailTemplate(data, user.firstName || "User"),
    });
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

/**
 * Generate email template for notification
 */
function generateEmailTemplate(data: NotificationData, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ExJAM Alumni - ${data.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">ExJAM Alumni</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #6366f1; margin-top: 0;">${data.title}</h2>
          
          <p>Hello ${userName},</p>
          
          <p style="font-size: 16px; line-height: 1.6;">${data.message}</p>
          
          ${
            data.data?.actionUrl
              ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.data.actionUrl}" 
                 style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ${data.data.actionText || "View Details"}
              </a>
            </div>
          `
              : ""
          }
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            This notification was sent by ExJAM Alumni Event System.<br>
            If you no longer wish to receive these notifications, you can update your preferences in your account settings.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
          © 2025 ExJAM Alumni Association. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper class for common notification scenarios
 */
export class NotificationService {
  static async notifyEventReminder(
    userId: string,
    eventTitle: string,
    eventDate: string,
    eventId: string
  ) {
    await createNotification({
      userId,
      type: NotificationType.EVENT_REMINDER,
      title: `Reminder: ${eventTitle}`,
      message: `Don't forget! You have registered for "${eventTitle}" on ${new Date(eventDate).toLocaleDateString()}.`,
      data: {
        eventId,
        actionUrl: `/events/${eventId}`,
        actionText: "View Event Details",
      },
    });
  }

  static async notifyPaymentConfirmation(
    userId: string,
    eventTitle: string,
    amount: number,
    reference: string
  ) {
    await createNotification({
      userId,
      type: NotificationType.PAYMENT_CONFIRMATION,
      title: `Payment Confirmed - ${eventTitle}`,
      message: `Your payment of ₦${amount.toLocaleString()} for "${eventTitle}" has been confirmed. Your ticket has been generated and sent to your email.`,
      data: {
        amount,
        reference,
        actionUrl: "/dashboard",
        actionText: "View Ticket",
      },
    });
  }

  static async notifyRegistrationConfirmed(userId: string, eventTitle: string, eventId: string) {
    await createNotification({
      userId,
      type: NotificationType.REGISTRATION_CONFIRMED,
      title: `Registration Confirmed - ${eventTitle}`,
      message: `Your registration for "${eventTitle}" has been confirmed. We look forward to seeing you at the event!`,
      data: {
        eventId,
        actionUrl: "/dashboard",
        actionText: "View Registration",
      },
    });
  }

  static async notifyEventCancelled(userIds: string[], eventTitle: string, reason?: string) {
    await createBulkNotifications(userIds, {
      type: NotificationType.EVENT_CANCELLED,
      title: `Event Cancelled - ${eventTitle}`,
      message: `Unfortunately, "${eventTitle}" has been cancelled. ${reason || "We apologize for any inconvenience."} Refunds will be processed automatically.`,
      data: {
        actionUrl: "/dashboard",
        actionText: "View Dashboard",
      },
    });
  }

  static async notifyEventUpdated(
    userIds: string[],
    eventTitle: string,
    changes: string[],
    eventId: string
  ) {
    const changesText =
      changes.length > 0
        ? `Changes: ${changes.join(", ")}`
        : "Please check the event details for updates.";

    await createBulkNotifications(userIds, {
      type: NotificationType.EVENT_UPDATED,
      title: `Event Updated - ${eventTitle}`,
      message: `"${eventTitle}" has been updated. ${changesText}`,
      data: {
        eventId,
        changes,
        actionUrl: `/events/${eventId}`,
        actionText: "View Updated Details",
      },
    });
  }

  static async notifySystemAnnouncement(userIds: string[], title: string, message: string) {
    await createBulkNotifications(userIds, {
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: `System Announcement: ${title}`,
      message,
      data: {
        actionUrl: "/dashboard",
        actionText: "Go to Dashboard",
      },
    });
  }

  static async notifyAdminMessage(
    userId: string,
    title: string,
    message: string,
    fromAdmin: string
  ) {
    await createNotification({
      userId,
      type: NotificationType.ADMIN_MESSAGE,
      title: `Message from Admin: ${title}`,
      message: `${message}\n\n- ${fromAdmin}`,
      data: {
        fromAdmin,
        actionUrl: "/dashboard",
        actionText: "Go to Dashboard",
      },
    });
  }
}
