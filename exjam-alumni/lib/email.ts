import { Resend } from "resend";
import * as templates from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // IMPORTANT: For Resend free tier, you must use 'onboarding@resend.dev'
    // Or verify your own domain in the Resend dashboard
    const fromEmail = from || "ExJAM Alumni <onboarding@resend.dev>";

    console.log("Sending email to:", to);
    console.log("From:", fromEmail);

    const data = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      // Add reply-to for better deliverability
      reply_to: "support@exjamalumni.org",
    });

    console.log("Resend API Response:", data);

    if (data.error) {
      console.error("Resend API Error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data, id: data.id };
  } catch (error: any) {
    console.error("Email sending error:", error);
    console.error("Error details:", error.response?.data || error.message);
    // Don't throw - return error for graceful handling
    return { success: false, error: error.message || "Failed to send email" };
  }
}

// Re-export the new templates
export const {
  getWelcomeEmailTemplate,
  getRegistrationConfirmationTemplate,
  getPaymentConfirmationTemplate,
  getEventReminderTemplate,
  getCheckinConfirmationTemplate,
  getBankTransferInstructionsTemplate,
  getEventCancellationTemplate,
  getPostEventThankYouTemplate,
  getWaitlistNotificationTemplate,
  getWaitlistConvertedTemplate,
} = templates;
