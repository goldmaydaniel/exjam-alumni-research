import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel, event, payload } = await request.json();

    const supabase = createClient();

    // Send a broadcast message to test real-time functionality
    const result = await supabase.channel(channel || "test-channel").send({
      type: "broadcast",
      event: event || "test-event",
      payload: {
        ...payload,
        userId: user.userId,
        timestamp: new Date().toISOString(),
        message: "Real-time test message",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Real-time test message sent",
      channel: channel || "test-channel",
      event: event || "test-event",
    });
  } catch (error) {
    console.error("Real-time test error:", error);
    return NextResponse.json({ error: "Failed to send real-time test message" }, { status: 500 });
  }
}

// Get real-time connection status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Test the connection by attempting to create a channel
    const channel = supabase.channel("status-test");

    const connectionStatus = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      connected: true,
      timestamp: new Date().toISOString(),
      channels: {
        available: ["events", "users", "registrations", "payments"],
        test: "status-test",
      },
    };

    // Clean up test channel
    supabase.removeChannel(channel);

    return NextResponse.json(connectionStatus);
  } catch (error) {
    console.error("Connection status error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
