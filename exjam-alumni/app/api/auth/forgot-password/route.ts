import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateResetToken, invalidateUserTokens } from "@/lib/password-reset";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    // Apply strict rate limiting for password reset requests
    const rateLimiter = rateLimit(rateLimitConfigs.passwordReset);
    const rateLimitResult = await rateLimiter(req);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password reset attempts. Please wait before trying again.",
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, fullName: true },
    });

    // Always return success to prevent email enumeration attacks
    const response = {
      success: true,
      message:
        "If an account with this email exists, you will receive a password reset link shortly.",
    };

    if (!user) {
      // Still return success but don't send email
      return NextResponse.json(response);
    }

    // Invalidate any existing tokens for this user
    invalidateUserTokens(user.id);

    // Generate secure reset token
    const resetToken = await generateResetToken(user.id, user.email);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    await sendEmail({
      to: user.email,
      subject: "The ExJAM Association - Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #111827; font-size: 22px; font-weight: 600;">Hi ${user.fullName},</h2>
                      
                      <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 24px;">
                        You requested a password reset for your ExJAM Association account. Click the button below to create a new password:
                      </p>
                      
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" 
                           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Reset My Password
                        </a>
                      </div>
                      
                      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                          <strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0; color: #9ca3af; font-size: 14px; line-height: 20px;">
                        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                      </p>
                      
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                      
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                        If the button above doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        © 2025 The ExJAM Association. All rights reserved.<br>
                        Lagos, Nigeria | support@exjamalumni.org
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
