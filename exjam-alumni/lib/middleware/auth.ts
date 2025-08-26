import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    return handler(request, user);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    // Check if user has admin role
    const isAdmin =
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.role === "admin" ||
      user.email === "admin@exjam.org";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    return handler(request, user);
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function validateAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid authorization header" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: "Invalid token" };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: "Token validation failed" };
  }
}

export async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { error: "Unauthorized - Please log in", status: 401 };
    }

    // Check if user has admin role
    const isAdmin =
      user.user_metadata?.role === "admin" ||
      user.app_metadata?.role === "admin" ||
      user.email === "admin@exjam.org";

    if (!isAdmin) {
      return { error: "Forbidden - Admin access required", status: 403 };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { error: "Authentication failed", status: 500 };
  }
}
