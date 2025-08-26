import { createClient } from "@/lib/supabase/client";
import * as speakeasy from "speakeasy";
import QRCode from "qrcode";

interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

/**
 * Generate 2FA secret and QR code for user
 */
export async function generateTwoFactorSecret(
  userEmail: string
): Promise<TwoFactorSecret> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `ExJAM Alumni (${userEmail})`,
    issuer: "ExJAM Alumni Association",
    length: 32,
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = generateBackupCodes(8);

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () =>
      Math.random().toString(36).charAt(2)
    )
      .join("")
      .toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Verify TOTP token
 */
export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 time steps before/after for clock skew
  });
}

/**
 * Enable 2FA for user
 */
export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  const supabase = createClient();
  
  // Store 2FA settings in user metadata
  const { error } = await supabase.auth.updateUser({
    data: {
      two_factor_enabled: true,
      two_factor_secret: secret, // In production, encrypt this
      backup_codes: backupCodes.map(code => ({
        code,
        used: false,
      })),
    },
  });

  if (error) throw error;
}

/**
 * Disable 2FA for user
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase.auth.updateUser({
    data: {
      two_factor_enabled: false,
      two_factor_secret: null,
      backup_codes: null,
    },
  });

  if (error) throw error;
}

/**
 * Check if user has 2FA enabled
 */
export async function hasTwoFactorEnabled(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return false;
  
  return user.user_metadata?.two_factor_enabled === true;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return false;
  
  const backupCodes = user.user_metadata?.backup_codes || [];
  const codeIndex = backupCodes.findIndex(
    (bc: any) => bc.code === code && !bc.used
  );
  
  if (codeIndex === -1) return false;
  
  // Mark code as used
  backupCodes[codeIndex].used = true;
  
  await supabase.auth.updateUser({
    data: {
      backup_codes: backupCodes,
    },
  });
  
  return true;
}

/**
 * Generate new backup codes
 */
export async function regenerateBackupCodes(): Promise<string[]> {
  const supabase = createClient();
  
  const newCodes = generateBackupCodes(8);
  
  const { error } = await supabase.auth.updateUser({
    data: {
      backup_codes: newCodes.map(code => ({
        code,
        used: false,
      })),
    },
  });
  
  if (error) throw error;
  
  return newCodes;
}

/**
 * Verify 2FA during login
 */
export async function verifyTwoFactorLogin(
  token: string,
  isBackupCode: boolean = false
): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return false;
  
  if (isBackupCode) {
    return verifyBackupCode(user.id, token);
  }
  
  const secret = user.user_metadata?.two_factor_secret;
  if (!secret) return false;
  
  return verifyTOTP(token, secret);
}

/**
 * Send 2FA code via email (alternative to authenticator app)
 */
export async function sendTwoFactorEmail(email: string): Promise<void> {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store code temporarily (in production, use Redis or similar)
  const supabase = createClient();
  
  // Store with 10-minute expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  const { error } = await supabase
    .from("two_factor_codes")
    .insert({
      email,
      code,
      expires_at: expiresAt,
      used: false,
    });
  
  if (error) throw error;
  
  // Send email with code
  const { sendEmail } = await import("@/lib/email");
  
  await sendEmail({
    to: email,
    subject: "Your ExJAM Alumni 2FA Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Two-Factor Authentication Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Verify email 2FA code
 */
export async function verifyEmailTwoFactorCode(
  email: string,
  code: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("two_factor_codes")
    .select()
    .eq("email", email)
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();
  
  if (error || !data) return false;
  
  // Mark code as used
  await supabase
    .from("two_factor_codes")
    .update({ used: true })
    .eq("id", data.id);
  
  return true;
}