import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages/notifications
    const { data: messages, error } = await supabase
      .from("Notification")
      .select(
        `
        *,
        User(firstName, lastName, email)
      `
      )
      .order("createdAt", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, subject, message, type = "ADMIN_MESSAGE" } = body;

    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create notifications for recipients
    const notifications = recipients.map((userId: string) => ({
      userId,
      type,
      title: subject,
      message,
      data: {
        sender: user.id,
        timestamp: new Date().toISOString(),
      },
    }));

    const { data, error } = await supabase.from("Notification").insert(notifications).select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      sent: data.length,
      notifications: data,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send messages" }, { status: 500 });
  }
}
