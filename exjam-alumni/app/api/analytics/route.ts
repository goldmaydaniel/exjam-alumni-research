import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    let userRole: string = "MEMBER";

    // Try JWT token first (direct auth)
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (token) {
      try {
        const { verifyToken } = await import("@/lib/auth");
        userId = verifyToken(token);

        // Get user role from database for JWT users
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
          });
          if (user) {
            userRole = user.role || "MEMBER";
          }
        }
      } catch (error) {
        console.log("JWT verification failed, trying Supabase auth");
      }
    }

    // Fallback to Supabase Auth if JWT failed
    if (!userId) {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Return fallback data instead of unauthorized error for better UX
        console.log("No authentication found, returning fallback analytics data");
        userId = "guest-user";
        userRole = "MEMBER";
      } else {
        userId = user.id;

        // Get user role from Supabase for Supabase users
        const { data: userData, error: userError } = await supabase
          .from("User")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData) {
          userRole = userData.role || "MEMBER";
        }
      }
    }

    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get("eventId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build filter conditions
    let eventFilter = {};
    let dateFilter = {};

    if (eventId) {
      eventFilter = { eventId };
    }

    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Fetch analytics data in parallel
    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      totalRevenue,
      registrationsByStatus,
      registrationsByTicketType,
      eventStats,
      recentRegistrations,
      topEvents,
      userGrowth,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total events
      prisma.event.count({
        where: { status: "PUBLISHED" },
      }),

      // Total registrations
      prisma.registration.count({
        where: { ...eventFilter, ...dateFilter },
      }),

      // Total revenue
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Registrations by status
      prisma.registration.groupBy({
        by: ["status"],
        where: { ...eventFilter, ...dateFilter },
        _count: true,
      }),

      // Registrations by ticket type
      prisma.registration.groupBy({
        by: ["ticketType"],
        where: { ...eventFilter, ...dateFilter },
        _count: true,
      }),

      // Event statistics
      prisma.event.findMany({
        where: eventId ? { id: eventId } : { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          capacity: true,
          price: true,
          _count: {
            select: {
              Registration: true,
              Ticket: {
                where: { checkedIn: true },
              },
            },
          },
        },
        take: 10,
      }),

      // Recent registrations
      prisma.registration.findMany({
        where: { ...eventFilter, ...dateFilter },
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          Event: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Top events by registration
      prisma.event.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          startDate: true,
          _count: {
            select: { Registration: true },
          },
        },
        orderBy: {
          Registration: {
            _count: "desc",
          },
        },
        take: 5,
      }),

      // User growth (last 30 days)
      getUserGrowthData(),
    ]);

    // Calculate derived metrics
    const checkInRate = await calculateCheckInRate(eventFilter);
    const conversionRate = await calculateConversionRate();

    // Get today's checkins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkedInToday = await prisma.ticket.count({
      where: {
        checkedIn: true,
        checkedInAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Count active and upcoming events
    const now = new Date();
    const [activeEvents, upcomingEvents] = await Promise.all([
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.event.count({
        where: {
          status: "PUBLISHED",
          startDate: { gt: now },
        },
      }),
    ]);

    // For non-admin users, return simplified stats
    if (userRole !== "ADMIN" && userRole !== "ORGANIZER") {
      const userRegistrations = await prisma.registration.count({
        where: { userId },
      });

      const confirmedRegistrations = await prisma.registration.count({
        where: {
          userId,
          status: "CONFIRMED",
        },
      });

      return NextResponse.json({
        totalEvents,
        activeEvents,
        totalRegistrations: userRegistrations,
        confirmedRegistrations,
        totalRevenue: 0,
        totalUsers: 0,
        checkedInToday: 0,
        upcomingEvents,
      });
    }

    // Return full stats for admin
    const confirmedRegistrations = await prisma.registration.count({
      where: {
        status: "CONFIRMED",
        ...eventFilter,
        ...dateFilter,
      },
    });

    return NextResponse.json({
      totalEvents,
      activeEvents,
      totalRegistrations,
      confirmedRegistrations,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      checkedInToday,
      upcomingEvents,
      overview: {
        totalUsers,
        totalEvents,
        totalRegistrations,
        totalRevenue: totalRevenue._sum.amount || 0,
        checkInRate,
        conversionRate,
      },
      registrations: {
        byStatus: registrationsByStatus,
        byTicketType: registrationsByTicketType,
        recent: recentRegistrations,
      },
      events: {
        stats: eventStats,
        topEvents,
      },
      userGrowth,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    // Return mock data for admin dashboard to prevent crashes
    return NextResponse.json({
      totalEvents: 0,
      activeEvents: 0,
      totalRegistrations: 0,
      confirmedRegistrations: 0,
      totalRevenue: 0,
      totalUsers: 0,
      checkedInToday: 0,
      upcomingEvents: 0,
      overview: {
        totalUsers: 0,
        totalEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        checkInRate: 0,
        conversionRate: 0,
      },
      registrations: {
        byStatus: [],
        byTicketType: [],
        recent: [],
      },
      events: {
        stats: [],
        topEvents: [],
      },
      userGrowth: [],
    });
  }
}

async function getUserGrowthData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
  });

  // Group by date
  const growth: Record<string, number> = {};
  users.forEach((user) => {
    const date = user.createdAt.toISOString().split("T")[0];
    growth[date] = (growth[date] || 0) + 1;
  });

  // Convert to array
  return Object.entries(growth).map(([date, count]) => ({
    date,
    count,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculateCheckInRate(eventFilter: Record<string, any>) {
  const [totalTickets, checkedInTickets] = await Promise.all([
    prisma.ticket.count({
      where: eventFilter,
    }),
    prisma.ticket.count({
      where: {
        ...eventFilter,
        checkedIn: true,
      },
    }),
  ]);

  return totalTickets > 0 ? (checkedInTickets / totalTickets) * 100 : 0;
}

async function calculateConversionRate() {
  const [totalRegistrations, paidRegistrations] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({
      where: {
        Payment: {
          status: "SUCCESS",
        },
      },
    }),
  ]);

  return totalRegistrations > 0 ? (paidRegistrations / totalRegistrations) * 100 : 0;
}

// POST method for tracking analytics events
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.event || !data.sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: event, sessionId' },
        { status: 400 }
      );
    }

    // Add server-side metadata
    const analyticsData = {
      ...data,
      serverTimestamp: Date.now(),
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') ||
          request.ip,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    };

    // In development, just log the data
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', {
        event: data.event,
        userId: data.userId,
        sessionId: data.sessionId,
        properties: data.properties,
        timestamp: new Date(data.timestamp || Date.now()).toISOString(),
      });
      
      return NextResponse.json({ success: true, logged: true });
    }

    // Log important events
    if (data.event.includes('registration') || 
        data.event.includes('payment') || 
        data.event.includes('error')) {
      console.log('🔥 Important Event:', JSON.stringify({
        timestamp: new Date().toISOString(),
        event: data.event,
        userId: data.userId,
        sessionId: data.sessionId,
        properties: data.properties,
        metadata: {
          page: data.page,
          viewport: data.viewport,
          connection: data.connection,
          ip: analyticsData.ip?.split(',')[0]?.trim(),
        },
      }, null, 2));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    );
  }
}
