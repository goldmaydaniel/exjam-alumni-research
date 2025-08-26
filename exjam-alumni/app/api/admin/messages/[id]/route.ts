import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(async (user: any) => {
    // Check admin access
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      await prisma.contactMessage.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }
  })(request);
}
