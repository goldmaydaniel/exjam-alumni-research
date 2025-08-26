import crypto from "crypto";
import { prisma } from "@/lib/db";

// In-memory storage for development (use Redis in production)
const tokenStore = new Map<
  string,
  {
    userId: string;
    email: string;
    expiresAt: Date;
  }
>();

export interface ResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
}

/**
 * Generate and store a password reset token
 */
export async function generateResetToken(userId: string, email: string): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store in memory (use Redis in production)
  tokenStore.set(token, {
    userId,
    email,
    expiresAt,
  });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate and retrieve reset token data
 */
export function validateResetToken(token: string): ResetToken | null {
  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    return null;
  }

  // Check if token is expired
  if (new Date() > tokenData.expiresAt) {
    tokenStore.delete(token);
    return null;
  }

  return {
    token,
    ...tokenData,
  };
}

/**
 * Consume (delete) a reset token after use
 */
export function consumeResetToken(token: string): boolean {
  return tokenStore.delete(token);
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = new Date();

  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Get all active tokens for a user (for security purposes)
 */
export function getUserActiveTokens(userId: string): string[] {
  const tokens: string[] = [];

  for (const [token, data] of tokenStore.entries()) {
    if (data.userId === userId && new Date() <= data.expiresAt) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * Invalidate all tokens for a user (useful after password change)
 */
export function invalidateUserTokens(userId: string): number {
  let count = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (data.userId === userId) {
      tokenStore.delete(token);
      count++;
    }
  }

  return count;
}

// For production, you would use a database table like this:
/*
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  email     String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  User User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_reset_tokens")
}
*/
