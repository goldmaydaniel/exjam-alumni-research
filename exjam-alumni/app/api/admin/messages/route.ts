import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { withAuth } from "@/lib/middleware/auth-middleware";
import { withErrorHandling } from "@/lib/middleware/error-middleware";
import { createError } from "@/lib/errors/api-errors";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const messageQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  status: z.enum(['pending', 'read', 'replied', 'all']).optional(),
  search: z.string().optional()
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  return withAuth(['ADMIN', 'ORGANIZER'], async (user: any) => {
    const { searchParams } = new URL(request.url);
    const query = messageQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status"),
      search: searchParams.get("search")
    });

    // Build where clause
    const where: any = {};

    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { subject: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Fetch messages with pagination
    const [messages, total] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.contactMessage.count({ where }),
    ]);

    // Get stats
    const stats = await db.contactMessage.groupBy({
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
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  })(request);
});
