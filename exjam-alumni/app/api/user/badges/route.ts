import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// Since we don't have a badges table yet, we'll create logical badges based on user activity
export async function GET(req: NextRequest) {
  try {
    // Get user from token
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifyToken(token);

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // For now, return some basic badges for all users
    // In the future, this should be based on actual user activity and achievements
    const userBadges = [
      {
        id: "verified-alumni",
        title: "Verified Alumni",
        description: "Successfully verified AFMS alumni status",
        category: "ACHIEVEMENT",
        earnedAt: new Date().toISOString(),
      },
      {
        id: "early-adopter",
        title: "Early Adopter",
        description: "Among the early members to join the platform",
        category: "MILESTONE",
        earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "platform-member",
        title: "Platform Member",
        description: "Active member of the ExJAM Alumni platform",
        category: "SPECIAL",
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json(userBadges);
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}
