import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notification-system";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Verify authentication
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const params = await context.params;
    const notificationId = params.id;

    await markNotificationAsRead(notificationId, decoded.userId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
