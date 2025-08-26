import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import {
  parsePaginationParams,
  parseFilterParams,
  buildUserSearchConditions,
  buildPaginatedResponse,
  buildOrderBy,
  OPTIMIZED_INCLUDES,
} from "@/lib/query-optimization";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const paginationParams = parsePaginationParams(req);
    const filterParams = parseFilterParams(req);

    // Build search conditions
    const searchConditions = buildUserSearchConditions(filterParams);

    // Build order by clause
    const orderBy = buildOrderBy(
      paginationParams.sortBy || "createdAt",
      paginationParams.sortOrder || "desc"
    );

    // Calculate skip for pagination
    const skip = (paginationParams.page! - 1) * paginationParams.limit!;

    // Execute optimized queries in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: searchConditions,
        select: {
          ...OPTIMIZED_INCLUDES.user.select,
          _count: {
            select: {
              Registration: true,
              Payment: true,
              Events: true,
            },
          },
        },
        orderBy,
        skip,
        take: paginationParams.limit,
      }),
      prisma.user.count({ where: searchConditions }),
    ]);

    // Build paginated response
    const response = buildPaginatedResponse(users, totalCount, paginationParams);

    // Add metadata
    const metadata = {
      filters: filterParams,
      sorting: {
        sortBy: paginationParams.sortBy,
        sortOrder: paginationParams.sortOrder,
      },
      queryExecutionTime: Date.now(),
    };

    return NextResponse.json({
      success: true,
      ...response,
      metadata,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Bulk operations endpoint
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin access
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userIds, action, data } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "User IDs are required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "activate":
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "ACTIVE" },
        });
        break;

      case "suspend":
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "SUSPENDED" },
        });
        break;

      case "updateRole":
        if (!data?.role) {
          return NextResponse.json({ error: "Role is required for role update" }, { status: 400 });
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role },
        });
        break;

      case "delete":
        // Soft delete - mark as deleted instead of actual deletion
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "DELETED" },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.count} users`,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error("Error in bulk user operation:", error);
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 });
  }
}
