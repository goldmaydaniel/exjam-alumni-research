import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, recipient, template, data, metadata }: NotificationRequest = await req.json();

    // Validate request
    if (!type || !recipient || !template) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipient, template" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (type === "email") {
      const emailTemplate = EMAIL_TEMPLATES[template];
      if (!emailTemplate) {
        return new Response(JSON.stringify({ error: `Email template '${template}' not found` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Replace template variables
      let html = emailTemplate.html;
      let text = emailTemplate.text || "";
      let subject = emailTemplate.subject;

      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
          html = html.replace(placeholder, String(value));
          text = text.replace(placeholder, String(value));
          subject = subject.replace(placeholder, String(value));
        });
      }

      // Send email using Resend API
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EXJAM Association <onboarding@resend.dev>",
          to: [recipient],
          subject,
          html,
          text,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Resend API error:", errorData);
        return new Response(JSON.stringify({ error: "Failed to send email", details: errorData }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailResult = await emailResponse.json();

      // Log the notification (could save to database)
      console.log(`Email sent successfully:`, {
        id: emailResult.id,
        recipient,
        template,
        metadata,
      });

      return new Response(
        JSON.stringify({
          success: true,
          id: emailResult.id,
          type: "email",
          recipient,
          template,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle SMS and push notifications here
    else if (type === "sms") {
      return new Response(JSON.stringify({ error: "SMS notifications not yet implemented" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (type === "push") {
      return new Response(JSON.stringify({ error: "Push notifications not yet implemented" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ error: `Unsupported notification type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Notification function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
