import { NextRequest, NextResponse } from "next/server";
import { BadgeService } from "@/lib/edge-functions/badge-service";

export async function GET(req: NextRequest) {
  try {
    const badgeService = new BadgeService();
    const testBadge = badgeService.generateTestBadge();

    return new Response(testBadge, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": 'inline; filename="test-badge.svg"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Test badge generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
