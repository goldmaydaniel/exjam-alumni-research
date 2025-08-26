import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (user: any) => {
    // Check admin access
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      const message = await prisma.contactMessage.update({
        where: { id: params.id },
        data: { status: "read" },
      });

      return NextResponse.json(message);
    } catch (error) {
      console.error("Error updating message status:", error);
      return NextResponse.json({ error: "Failed to update message status" }, { status: 500 });
    }
  })(request);
}
