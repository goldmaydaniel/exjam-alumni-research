import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Generate secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate 6-digit verification code (alternative to token)
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create verification token and save to database
export async function createEmailVerificationToken(userId: string, email: string) {
  const token = generateVerificationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

  // Update user with verification token
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiry: expiresAt,
      emailVerified: false,
    },
  });

  return { token, expiresAt };
}

// Send verification email
export async function sendVerificationEmail(email: string, firstName: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/verify-email?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - EXJAM Association</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 20px;
          }
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 10px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
          }
          h1 {
            color: #1e40af;
            margin: 10px 0;
            font-size: 24px;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .alternative {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          .alternative-url {
            word-break: break-all;
            color: #3b82f6;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .squadron-bar {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .squadron { padding: 2px 8px; border-radius: 4px; }
          .green { color: #16a34a; }
          .red { color: #dc2626; }
          .purple { color: #9333ea; }
          .yellow { color: #ca8a04; }
          .blue { color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">EX</div>
            <h1>Verify Your Email Address</h1>
            <p style="margin: 0; color: #666;">Welcome to EXJAM Association</p>
          </div>
          
          <div class="content">
            <p>Dear ${firstName},</p>
            
            <p>Thank you for registering with The EXJAM Association - the official alumni network for Air Force Military School Jos graduates.</p>
            
            <p>To complete your registration and access your alumni account, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <div class="alternative">
              <p style="margin-top: 0;"><strong>Can't click the button?</strong></p>
              <p>Copy and paste this link into your browser:</p>
              <p class="alternative-url">${verificationUrl}</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This verification link expires in 24 hours</li>
              <li>After verification, your alumni status will be reviewed by our admin team</li>
              <li>You'll receive confirmation once your alumni status is approved</li>
            </ul>
            
            <p>If you didn't create an account with EXJAM Association, please ignore this email.</p>
          </div>
          
          <div class="footer">
            <p><strong>The EXJAM Association</strong><br>
            Connecting Ex-Junior Airmen Since 1980</p>
            
            <div class="squadron-bar">
              <span class="squadron green">★ GREEN</span>
              <span class="squadron red">★ RED</span>
              <span class="squadron purple">★ PURPLE</span>
              <span class="squadron yellow">★ YELLOW</span>
              <span class="squadron blue">★ BLUE</span>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
              This is an automated email. Please do not reply directly to this message.<br>
              For support, contact us at info@exjam.org.ng
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Welcome to EXJAM Association!

Dear ${firstName},

Thank you for registering with The EXJAM Association - the official alumni network for Air Force Military School Jos graduates.

To complete your registration, please verify your email address by visiting:
${verificationUrl}

This verification link expires in 24 hours.

After verification, your alumni status will be reviewed by our admin team. You'll receive confirmation once approved.

If you didn't create an account, please ignore this email.

Best regards,
The EXJAM Association Team
Connecting Ex-Junior Airmen Since 1980
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email - EXJAM Association",
      html: htmlContent,
      text: textContent,
    });
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

// Verify email with token
export async function verifyEmailWithToken(token: string) {
  try {
    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired verification token" };
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, error: "Verification failed" };
  }
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.emailVerified) {
      return { success: false, error: "Email already verified" };
    }

    // Check if last email was sent recently (prevent spam)
    if (user.emailVerificationExpiry) {
      const lastSent = new Date(user.emailVerificationExpiry);
      lastSent.setHours(lastSent.getHours() - 24); // Get original send time
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      if (lastSent > fiveMinutesAgo) {
        return { success: false, error: "Please wait 5 minutes before requesting another email" };
      }
    }

    // Generate new token and send email
    const { token } = await createEmailVerificationToken(user.id, user.email);
    const sent = await sendVerificationEmail(user.email, user.firstName, token);

    if (!sent) {
      return { success: false, error: "Failed to send email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { success: false, error: "Failed to resend email" };
  }
}

// Check if email needs verification
export async function checkEmailVerificationStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      email: true,
      emailVerificationExpiry: true,
    },
  });

  if (!user) {
    return { verified: false, exists: false };
  }

  const tokenExpired = user.emailVerificationExpiry
    ? new Date(user.emailVerificationExpiry) < new Date()
    : true;

  return {
    verified: user.emailVerified,
    exists: true,
    email: user.email,
    tokenExpired,
  };
}
