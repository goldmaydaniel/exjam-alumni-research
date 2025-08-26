import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Debug: Starting Supabase test...");

    // Test with service role client (bypasses RLS)
    console.log("🧪 Test with service role client...");
    const serviceClient = createServiceRoleClient();

    const { data: events, error: serviceError } = await serviceClient
      .from("Event")
      .select("id, title, status")
      .limit(3);

    if (serviceError) {
      console.error("❌ Service role error:", serviceError);
    } else {
      console.log("✅ Service role found events:", events?.length);
    }

    // Test with regular anon client
    console.log("🧪 Test with anon client...");
    const supabase = await createClient();
    console.log("✅ Debug: Supabase client created");

    const { data: anonEvents, error: anonError } = await supabase
      .from("Event")
      .select("id, title, status")
      .limit(3);

    if (anonError) {
      console.error("❌ Anon client error:", anonError);
    } else {
      console.log("✅ Anon client found events:", anonEvents?.length);
    }

    // Test auth status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log("🔐 Auth status:", { hasUser: !!user, authError: authError?.message });

    return NextResponse.json({
      success: true,
      serviceRole: {
        success: !serviceError,
        eventsFound: events?.length || 0,
        error: serviceError?.message,
      },
      anonClient: {
        success: !anonError,
        eventsFound: anonEvents?.length || 0,
        error: anonError?.message,
      },
      auth: {
        authenticated: !!user,
        userId: user?.id,
        error: authError?.message,
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  } catch (error) {
    console.error("💥 Debug error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
