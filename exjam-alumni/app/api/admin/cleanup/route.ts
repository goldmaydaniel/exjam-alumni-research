import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cleanup old temporary registrations (older than 24 hours)
    const result = await db.user.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Cleanup old session logs (older than 30 days)
    const sessionCleanup = await db.user.updateMany({
      where: {
        lastLoginAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        status: "INACTIVE",
      },
      data: {
        status: "ARCHIVED",
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      pendingExpired: result.count,
      sessionsArchived: sessionCleanup.count,
    });
  } catch (error) {
    console.error("Cleanup job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cleanup failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
