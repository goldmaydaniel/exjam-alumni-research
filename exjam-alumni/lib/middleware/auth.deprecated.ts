/**
 * @deprecated This middleware used the old JWT authentication system
 * All authentication is now handled through Supabase Auth
 *
 * Migration completed on: 2025-08-25
 *
 * For new auth middleware, use:
 * - createClient() from '@/lib/supabase/server'
 * - supabase.auth.getUser() for authentication
 *
 * DO NOT USE - Retained for reference only
 */

import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function authenticateUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return { error: "No token provided", status: 401 };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return { error: "Invalid token", status: 401 };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    return { user };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: "Authentication failed", status: 500 };
  }
}

export async function requireAdmin(req: NextRequest) {
  const authResult = await authenticateUser(req);

  if ("error" in authResult) {
    return authResult;
  }

  if (authResult.user.role !== "ADMIN" && authResult.user.role !== "ORGANIZER") {
    return { error: "Admin access required", status: 403 };
  }

  return authResult;
}

export async function requireOrganizer(req: NextRequest) {
  const authResult = await authenticateUser(req);

  if ("error" in authResult) {
    return authResult;
  }

  const allowedRoles = ["ADMIN", "ORGANIZER", "SPEAKER"];
  if (!allowedRoles.includes(authResult.user.role)) {
    return { error: "Organizer access required", status: 403 };
  }

  return authResult;
}
