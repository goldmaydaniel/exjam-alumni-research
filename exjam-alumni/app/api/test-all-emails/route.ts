import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import * as templates from "@/lib/email-templates";

// Sample event data for testing
const sampleEvent: templates.EventDetails = {
  title: "The ExJAM Association Annual Conference 2025",
  date: "Saturday, March 15, 2025",
  time: "9:00 AM - 6:00 PM WAT",
  venue: "Eko Hotels & Suites",
  address: "Plot 1415 Adetokunbo Ademola Street, Victoria Island, Lagos",
  description:
    "Join us for a day of networking, learning, and celebration with fellow ExJAM members.",
  imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
};

const sampleRegistration: templates.RegistrationDetails = {
  name: "John Doe",
  email: "goldmay@layoverhq.com",
  ticketNumber: "EXJAM-2025-00142",
  ticketType: "VIP Pass",
  qrCodeUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  eventDetails: sampleEvent,
};

const samplePayment: templates.PaymentDetails = {
  amount: 25000,
  currency: "₦",
  reference: "PAY-2025-EXJAM-00142",
  paymentMethod: "Card Payment",
  date: new Date().toLocaleDateString(),
};

export async function POST(req: NextRequest) {
  try {
    const { email, templateType } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Update sample data with actual email
    const registration = { ...sampleRegistration, email };

    let html: string;
    let subject: string;

    switch (templateType || "all") {
      case "welcome":
        html = templates.getWelcomeEmailTemplate(registration.name);
        subject = "Welcome to The ExJAM Association!";
        break;

      case "registration":
        html = templates.getRegistrationConfirmationTemplate(registration);
        subject = `Registration Confirmed - ${sampleEvent.title}`;
        break;

      case "payment":
        html = templates.getPaymentConfirmationTemplate({
          ...registration,
          payment: samplePayment,
        });
        subject = `Payment Receipt - ${samplePayment.currency}${samplePayment.amount}`;
        break;

      case "reminder":
        html = templates.getEventReminderTemplate(registration, 24);
        subject = `Event Tomorrow: ${sampleEvent.title}`;
        break;

      case "checkin":
        html = templates.getCheckinConfirmationTemplate(registration);
        subject = `Checked In - ${sampleEvent.title}`;
        break;

      case "bank":
        html = templates.getBankTransferInstructionsTemplate({
          ...registration,
          payment: samplePayment,
        });
        subject = `Complete Your Payment - ${sampleEvent.title}`;
        break;

      case "cancellation":
        html = templates.getEventCancellationTemplate(registration);
        subject = `Event Cancelled: ${sampleEvent.title}`;
        break;

      case "thankyou":
        html = templates.getPostEventThankYouTemplate(registration);
        subject = `Thank You for Attending - ${sampleEvent.title}`;
        break;

      case "all":
        // Send all templates
        const templates_to_send = [
          {
            html: templates.getWelcomeEmailTemplate(registration.name),
            subject: "1/8 - Welcome to The ExJAM Association!",
          },
          {
            html: templates.getRegistrationConfirmationTemplate(registration),
            subject: "2/8 - Registration Confirmed",
          },
          {
            html: templates.getPaymentConfirmationTemplate({
              ...registration,
              payment: samplePayment,
            }),
            subject: "3/8 - Payment Receipt",
          },
          {
            html: templates.getEventReminderTemplate(registration, 24),
            subject: "4/8 - Event Tomorrow!",
          },
          {
            html: templates.getCheckinConfirmationTemplate(registration),
            subject: "5/8 - Successfully Checked In",
          },
          {
            html: templates.getBankTransferInstructionsTemplate({
              ...registration,
              payment: samplePayment,
            }),
            subject: "6/8 - Bank Transfer Instructions",
          },
          {
            html: templates.getEventCancellationTemplate(registration),
            subject: "7/8 - Event Cancellation Notice",
          },
          {
            html: templates.getPostEventThankYouTemplate(registration),
            subject: "8/8 - Thank You for Attending",
          },
        ];

        const results = [];
        for (const template of templates_to_send) {
          console.log(`Sending email: ${template.subject}`);
          const result = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
          });
          results.push({
            subject: template.subject,
            success: result.success,
            id: result.id,
          });
          // Add delay between emails to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return NextResponse.json({
          success: true,
          message: `Sent ${results.filter((r) => r.success).length} of ${results.length} test emails to ${email}`,
          results,
          note: "Check your inbox for all 8 template examples",
        });

      default:
        return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    // This should not be reachable due to switch statement, but TypeScript needs a return
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test emails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing info
export async function GET() {
  return NextResponse.json({
    message: "Email Template Test Endpoint",
    usage: "POST /api/test-all-emails",
    body: {
      email: "recipient@email.com",
      templateType:
        "all | welcome | registration | payment | reminder | checkin | bank | cancellation | thankyou",
    },
    templates: [
      "welcome - Welcome email for new users",
      "registration - Event registration confirmation",
      "payment - Payment receipt",
      "reminder - Event reminder (24 hours before)",
      "checkin - Check-in confirmation",
      "bank - Bank transfer instructions",
      "cancellation - Event cancellation notice",
      "thankyou - Post-event thank you",
      "all - Send all templates (default)",
    ],
  });
}
