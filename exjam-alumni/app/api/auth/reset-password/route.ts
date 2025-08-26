import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { validateResetToken, consumeResetToken, invalidateUserTokens } from "@/lib/password-reset";
import { withErrorHandler, ValidationError, NotFoundError } from "@/lib/error-handler";

const resetPasswordSchema = z.object({
  token: z.string().uuid("Invalid reset token"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { token, newPassword } = resetPasswordSchema.parse(body);

  // Validate reset token
  const tokenData = validateResetToken(token);

  if (!tokenData) {
    throw new ValidationError("Invalid or expired reset token");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
    select: { id: true, email: true, fullName: true, password: true },
  });

  if (!user) {
    consumeResetToken(token);
    throw new NotFoundError("User not found");
  }

  // Check if new password is different from current password
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ValidationError("New password must be different from your current password");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  // Clean up used token and invalidate any other tokens for this user
  consumeResetToken(token);
  invalidateUserTokens(user.id);

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: "The ExJAM Association - Password Successfully Reset",
      html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Successful</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center; border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Password Reset Successful</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                          <div style="display: inline-block; background-color: #f0fdf4; border-radius: 50%; padding: 16px;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 12l2 2 4-4" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2"/>
                            </svg>
                          </div>
                        </div>
                        
                        <h2 style="margin: 0 0 20px; color: #111827; font-size: 22px; font-weight: 600; text-align: center;">Hi ${user.fullName},</h2>
                        
                        <p style="margin: 0 0 24px; color: #6b7280; font-size: 16px; line-height: 24px; text-align: center;">
                          Your password has been successfully reset! You can now log in to your ExJAM Association account with your new password.
                        </p>
                        
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
                             style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Log In Now
                          </a>
                        </div>
                        
                        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
                          <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>🔐 Security Note:</strong> If you didn't reset your password, please contact our support team immediately at support@exjamalumni.org
                          </p>
                        </div>
                        
                        <p style="margin: 20px 0 0; color: #9ca3af; font-size: 14px; line-height: 20px; text-align: center;">
                          For your security, make sure to:<br>
                          • Keep your password private<br>
                          • Use a unique password for this account<br>
                          • Log out when using shared computers
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
  } catch (emailError) {
    console.error("Failed to send password reset confirmation:", emailError);
    // Don't fail the reset if email fails
  }

  return NextResponse.json({
    success: true,
    message: "Password reset successful! You can now log in with your new password.",
  });
});
