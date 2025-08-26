import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(async (user: any) => {
    // Check admin access
    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const status = searchParams.get("status");
      const search = searchParams.get("search");

      // Build where clause
      const where: any = {};

      if (status && status !== "all") {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
        ];
      }

      // Fetch messages with pagination
      const [messages, total] = await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.contactMessage.count({ where }),
      ]);

      // Get stats
      const stats = await prisma.contactMessage.groupBy({
        by: ["status"],
        _count: true,
      });

      const formattedStats = {
        total,
        pending: stats.find((s) => s.status === "pending")?._count || 0,
        read: stats.find((s) => s.status === "read")?._count || 0,
        replied: stats.find((s) => s.status === "replied")?._count || 0,
      };

      return NextResponse.json({
        messages,
        stats: formattedStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
  })(request);
}
