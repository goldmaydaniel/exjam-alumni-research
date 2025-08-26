// Notification service that can work as Edge Function or API route
import { Resend } from "resend";

interface NotificationRequest {
  type: "email" | "sms" | "push";
  recipient: string;
  template: string;
  data?: Record<string, any>;
  metadata?: {
    eventId?: string;
    userId?: string;
    priority?: "low" | "medium" | "high";
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  "registration-confirmation": {
    subject: "Welcome to EXJAM PG Conference 2025! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">EXJAM Association</h1>
          <p style="color: #e5e7eb; margin: 5px 0;">Strive to Excel</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #1e40af;">Registration Confirmed! ✅</h2>
          
          <p>Dear <strong>{{firstName}} {{lastName}}</strong>,</p>
          
          <p>Thank you for registering for the <strong>President General's Conference 2025 - Maiden Flight</strong>!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Event Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>📅 <strong>Date:</strong> November 28-30, 2025</li>
              <li>📍 <strong>Venue:</strong> NAF Conference Centre, Abuja</li>
              <li>🎫 <strong>Ticket ID:</strong> {{ticketId}}</li>
              <li>💰 <strong>Amount Paid:</strong> ₦{{amount}}</li>
            </ul>
          </div>
          
          <p>Your digital badge and QR code are attached to this email. Please bring this on the day of the event.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{badgeUrl}}" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Badge
            </a>
          </div>
          
          <p>We look forward to seeing you at this historic gathering!</p>
          
          <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            Best regards,<br>
            <strong>The EXJAM Association</strong><br>
            Ex-Junior Airmen • AFMS Jos<br>
            <a href="mailto:info@exjam.org.ng">info@exjam.org.ng</a>
          </p>
        </div>
      </div>
    `,
    text: `
      EXJAM Association - Registration Confirmed!
      
      Dear {{firstName}} {{lastName}},
      
      Thank you for registering for the President General's Conference 2025 - Maiden Flight!
      
      Event Details:
      Date: November 28-30, 2025
      Venue: NAF Conference Centre, Abuja
      Ticket ID: {{ticketId}}
      Amount Paid: ₦{{amount}}
      
      Your digital badge: {{badgeUrl}}
      
      We look forward to seeing you at this historic gathering!
      
      Best regards,
      The EXJAM Association
      Ex-Junior Airmen • AFMS Jos
      info@exjam.org.ng
    `,
  },

  "event-reminder": {
    subject: "PG Conference 2025 - Event Reminder 📅",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚨 Event Reminder</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2>Don't Forget - PG Conference 2025!</h2>
          
          <p>Dear <strong>{{firstName}}</strong>,</p>
          
          <p>This is a reminder that the <strong>President General's Conference 2025</strong> is coming up in <strong>{{daysUntil}} days</strong>!</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">📍 NAF Conference Centre, Abuja</p>
            <p style="margin: 5px 0 0 0;">📅 November 28-30, 2025</p>
          </div>
          
          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Your digital badge (QR code)</li>
            <li>Government-issued ID</li>
            <li>Comfortable clothing</li>
            <li>Notepad for sessions</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{badgeUrl}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Badge
            </a>
          </div>
        </div>
      </div>
    `,
  },

  "payment-confirmation": {
    subject: "Payment Confirmed - EXJAM PG Conference 2025 💳",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmed</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #059669;">Payment Successful! ✅</h2>
          
          <p>Dear <strong>{{firstName}} {{lastName}}</strong>,</p>
          
          <p>Your payment for the President General's Conference 2025 has been successfully processed.</p>
          
          <div style="background: #f0f9f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Payment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li>💰 <strong>Amount:</strong> ₦{{amount}}</li>
              <li>🧾 <strong>Reference:</strong> {{paymentReference}}</li>
              <li>📅 <strong>Date:</strong> {{paymentDate}}</li>
              <li>💳 <strong>Method:</strong> {{paymentMethod}}</li>
            </ul>
          </div>
          
          <p>Your registration is now complete. You can download your badge using the link below.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{badgeUrl}}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Badge
            </a>
          </div>
        </div>
      </div>
    `,
  },
};

export class NotificationService {
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendNotification(
    request: NotificationRequest
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (request.type === "email") {
        return await this.sendEmail(request);
      } else if (request.type === "sms") {
        return { success: false, error: "SMS notifications not yet implemented" };
      } else if (request.type === "push") {
        return { success: false, error: "Push notifications not yet implemented" };
      } else {
        return { success: false, error: `Unsupported notification type: ${request.type}` };
      }
    } catch (error) {
      console.error("Notification service error:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private async sendEmail(
    request: NotificationRequest
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.resend) {
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const emailTemplate = EMAIL_TEMPLATES[request.template];
    if (!emailTemplate) {
      return { success: false, error: `Email template '${request.template}' not found` };
    }

    // Replace template variables
    let html = emailTemplate.html;
    let text = emailTemplate.text || "";
    let subject = emailTemplate.subject;

    if (request.data) {
      Object.entries(request.data).forEach(([key, value]) => {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        html = html.replace(placeholder, String(value));
        text = text.replace(placeholder, String(value));
        subject = subject.replace(placeholder, String(value));
      });
    }

    try {
      const result = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "EXJAM Association <onboarding@resend.dev>",
        to: [request.recipient],
        subject,
        html,
        text: text || undefined,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, id: result.data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Email send failed",
      };
    }
  }

  // Helper methods for common notifications
  async sendRegistrationConfirmation(data: {
    recipient: string;
    firstName: string;
    lastName: string;
    ticketId: string;
    amount: string;
    badgeUrl: string;
  }) {
    return this.sendNotification({
      type: "email",
      recipient: data.recipient,
      template: "registration-confirmation",
      data,
    });
  }

  async sendPaymentConfirmation(data: {
    recipient: string;
    firstName: string;
    lastName: string;
    amount: string;
    paymentReference: string;
    paymentDate: string;
    paymentMethod: string;
    badgeUrl: string;
  }) {
    return this.sendNotification({
      type: "email",
      recipient: data.recipient,
      template: "payment-confirmation",
      data,
    });
  }

  async sendEventReminder(data: {
    recipient: string;
    firstName: string;
    daysUntil: number;
    badgeUrl: string;
  }) {
    return this.sendNotification({
      type: "email",
      recipient: data.recipient,
      template: "event-reminder",
      data,
    });
  }
}
