import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Validate current user session using Supabase Auth
 */
export async function validateSession() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error?.message || "No user found" };
    }

    // Get additional user data from database
    const { data: userData } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    return { 
      user: {
        ...user,
        ...userData
      }, 
      error: null 
    };
  } catch (error) {
    return { user: null, error: "Failed to validate session" };
  }
}

/**
 * Validate admin session using Supabase Auth
 */
export async function validateAdminSession() {
  try {
    const { user, error } = await validateSession();

    if (error || !user) {
      return { user: null, isAdmin: false, error: error || "No user found" };
    }

    // Check if user has admin role in metadata or database
    const isAdmin =
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.role === "admin" ||
      user.role === "ADMIN" ||
      user.email === "admin@exjam.org";

    return { user, isAdmin, error: null };
  } catch (error) {
    return { user: null, isAdmin: false, error: "Failed to validate admin session" };
  }
}

export async function requireAuth() {
  const { user, error } = await validateSession();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function requireAdmin() {
  const { user, isAdmin, error } = await validateAdminSession();

  if (error || !user || !isAdmin) {
    throw new Error("Admin access required");
  }

  return user;
}

// Service role functions for admin operations
export async function createAdminClient() {
  return createServiceRoleClient();
}

// Legacy JWT functions for backward compatibility
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'exjam-alumni-super-secret-jwt-key-2025';

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Get user by ID using service role client
 */
export async function getUserById(userId: string) {
  try {
    const supabase = createServiceRoleClient();
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) throw authError;

    const { data: userData, error: dbError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    if (dbError) throw dbError;

    return {
      user: {
        ...authUser.user,
        ...userData
      },
      error: null
    };
  } catch (error) {
    return { user: null, error: "Failed to get user" };
  }
}
