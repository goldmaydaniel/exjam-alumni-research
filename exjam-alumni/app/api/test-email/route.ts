import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    // Validate API key is present
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "Resend API key not configured",
          details: "Please add RESEND_API_KEY to your .env.local file",
        },
        { status: 500 }
      );
    }

    console.log("Test email request for:", email);
    console.log("Using API key:", process.env.RESEND_API_KEY.substring(0, 10) + "...");

    // Send test email
    const result = await sendEmail({
      to: email,
      subject: "Test Email - The ExJAM Association System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Email Configuration Test ✅</h1>
          </div>
          
          <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Success!</h2>
            <p style="color: #666; font-size: 16px;">
              Your email configuration is working correctly. The ExJAM Association system can now send emails.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Configuration Details:</h3>
              <ul style="color: #666;">
                <li>Email Service: Resend</li>
                <li>API Status: Connected</li>
                <li>From Address: ${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}</li>
                <li>Test Timestamp: ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981;">
              <p style="color: #065f46; margin: 0;">
                <strong>✅ Ready for Production!</strong><br>
                Your email system is configured and ready to send registration confirmations, payment receipts, and event notifications.
              </p>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              This is a test email from The ExJAM Association Event Management System.
            </p>
          </div>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully! Check your inbox (and spam folder).",
        emailId: result.id,
        details: {
          to: email,
          from: "onboarding@resend.dev",
          timestamp: new Date().toISOString(),
          resendId: result.data?.id,
        },
        note: "If you don't see the email, check your spam folder or wait a few minutes.",
      });
    } else {
      console.error("Email send failed:", result.error);
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: result.error,
          troubleshooting: [
            "Check that your Resend API key is valid",
            "Ensure you're using onboarding@resend.dev as the from address",
            "Check your Resend dashboard for logs",
            "Verify the recipient email is valid",
          ],
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for easy testing from browser
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Email test endpoint ready",
    usage: "POST /api/test-email with { email: 'your@email.com' }",
    configured: {
      hasApiKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    },
  });
}
