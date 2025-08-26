import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

export const POST = withAuth(
  async (request: NextRequest, { params, user }: { params: { id: string }; user: any }) => {
    // Check admin access
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      const { message: replyContent } = await request.json();

      // Update message status
      const message = await prisma.contactMessage.update({
        where: { id: params.id },
        data: { status: "replied" },
      });

      // TODO: Send actual email reply
      // This would integrate with your email service
      console.log("Sending reply to:", message.email);
      console.log("Reply content:", replyContent);

      return NextResponse.json({
        success: true,
        message: "Reply sent successfully",
      });
    } catch (error) {
      console.error("Error sending reply:", error);
      return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
    }
  }
);
