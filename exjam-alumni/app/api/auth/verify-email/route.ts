import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

const verifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// GET: Verify email with token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/login?error=missing-token", req.url));
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
    }

    // Check if token is expired (24 hours)
    if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
      return NextResponse.redirect(new URL("/login?error=token-expired", req.url));
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    // Send welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: "Email Verified - Welcome to The ExJAM Association!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Verified Successfully!</h1>
              </div>
              <div class="content">
                <h2>Welcome ${user.fullName || user.email}!</h2>
                <p>Your email has been successfully verified. You now have full access to all features of The ExJAM Association platform.</p>
                
                <h3>What you can do now:</h3>
                <ul>
                  <li>Register for upcoming events</li>
                  <li>Access your personalized dashboard</li>
                  <li>Connect with fellow alumni</li>
                  <li>Download event tickets</li>
                  <li>Update your profile information</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              </div>
              <div class="footer">
                <p>© 2025 The ExJAM Association. All rights reserved.</p>
                <p>Lagos, Nigeria | support@exjamalumni.org</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.redirect(new URL("/login?verified=true", req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification-failed", req.url));
  }
}

// POST: Resend verification email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({
        success: true,
        message: "If an account exists, a verification email has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is already verified",
        },
        { status: 400 }
      );
    }

    // Check rate limiting (max 3 resends per hour)
    if (user.emailVerificationExpiry) {
      const lastSent = new Date(user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000);
      const timeSinceLastSent = Date.now() - lastSent.getTime();

      if (timeSinceLastSent < 60 * 60 * 1000) {
        // Less than 1 hour
        return NextResponse.json(
          {
            success: false,
            error: "Please wait before requesting another verification email",
          },
          { status: 429 }
        );
      }
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - The ExJAM Association",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.fullName || "there"}!</h2>
              
              <p>Please verify your email address to complete your registration and access all features of The ExJAM Association platform.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
              </div>
              
              <p>If you didn't create an account with us, you can safely ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 The ExJAM Association. All rights reserved.</p>
              <p>Lagos, Nigeria | support@exjamalumni.org</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
