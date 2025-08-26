import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";
import { subDays, startOfDay, endOfDay, format, startOfMonth, endOfMonth } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      const { searchParams } = new URL(request.url);
      const range = searchParams.get("range") || "30d";
      const eventId = searchParams.get("eventId");

      // Calculate date range
      const getRangeInDays = (range: string): number => {
        switch (range) {
          case "7d":
            return 7;
          case "30d":
            return 30;
          case "90d":
            return 90;
          case "1y":
            return 365;
          default:
            return 30;
        }
      };

      const days = getRangeInDays(range);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());

      // Base where clause
      const baseWhere = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Event-specific analytics if eventId provided
      const eventWhere = eventId ? { eventId } : {};

      // Fetch key metrics
      const [
        totalUsers,
        activeUsers,
        totalEvents,
        totalRegistrations,
        totalRevenue,
        userGrowth,
        eventMetrics,
        deviceStats,
        pageViews,
        userSegments,
      ] = await Promise.all([
        // Total users
        prisma.user.count({
          where: {
            createdAt: {
              lte: endDate,
            },
          },
        }),

        // Active users (users who logged in within the range)
        prisma.user.count({
          where: {
            ...baseWhere,
            // This would need a lastLoginAt field in the User model
            // lastLoginAt: baseWhere.createdAt
          },
        }),

        // Total events
        prisma.event.count({
          where: baseWhere,
        }),

        // Total registrations
        prisma.registration.count({
          where: {
            ...baseWhere,
            ...eventWhere,
          },
        }),

        // Total revenue (assuming registrations have payment info)
        prisma.registration.aggregate({
          where: {
            ...baseWhere,
            ...eventWhere,
            paymentStatus: "COMPLETED",
          },
          _sum: {
            amount: true,
          },
        }),

        // User growth (daily new users)
        generateUserGrowthData(startDate, endDate),

        // Event metrics
        generateEventMetrics(startDate, endDate),

        // Device stats (would need tracking implementation)
        generateDeviceStats(),

        // Page views (would need analytics tracking)
        generatePageViews(),

        // User segments
        generateUserSegments(),
      ]);

      // Calculate previous period for comparisons
      const previousStartDate = startOfDay(subDays(startDate, days));
      const previousEndDate = endOfDay(subDays(endDate, days));

      const [previousUsers, previousEvents, previousRegistrations, previousRevenue] =
        await Promise.all([
          prisma.user.count({
            where: {
              createdAt: {
                gte: previousStartDate,
                lte: previousEndDate,
              },
            },
          }),

          prisma.event.count({
            where: {
              createdAt: {
                gte: previousStartDate,
                lte: previousEndDate,
              },
            },
          }),

          prisma.registration.count({
            where: {
              createdAt: {
                gte: previousStartDate,
                lte: previousEndDate,
              },
              ...eventWhere,
            },
          }),

          prisma.registration.aggregate({
            where: {
              createdAt: {
                gte: previousStartDate,
                lte: previousEndDate,
              },
              ...eventWhere,
              paymentStatus: "COMPLETED",
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

      // Calculate percentage changes
      const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const analytics = {
        metrics: {
          totalUsers: {
            value: totalUsers,
            change: calculateChange(totalUsers, previousUsers),
            trend: totalUsers >= previousUsers ? "up" : "down",
          },
          activeUsers: {
            value: Math.floor(totalUsers * 0.65), // Mock active users percentage
            change: calculateChange(totalUsers, previousUsers) * 0.8,
            trend: totalUsers >= previousUsers ? "up" : "down",
          },
          totalEvents: {
            value: totalEvents,
            change: calculateChange(totalEvents, previousEvents),
            trend: totalEvents >= previousEvents ? "up" : "down",
          },
          totalRegistrations: {
            value: totalRegistrations,
            change: calculateChange(totalRegistrations, previousRegistrations),
            trend: totalRegistrations >= previousRegistrations ? "up" : "down",
          },
          totalRevenue: {
            value: totalRevenue._sum.amount || 0,
            change: calculateChange(
              totalRevenue._sum.amount || 0,
              previousRevenue._sum.amount || 0
            ),
            trend:
              (totalRevenue._sum.amount || 0) >= (previousRevenue._sum.amount || 0) ? "up" : "down",
          },
          eventAttendance: {
            value: "78%", // Mock attendance rate
            change: 15.7,
            trend: "up",
          },
          averageEngagement: {
            value: "4.2m", // Mock engagement time
            change: -2.3,
            trend: "down",
          },
        },
        userGrowth,
        eventMetrics,
        deviceBreakdown: deviceStats,
        topPages: pageViews,
        userSegments,
        generatedAt: new Date().toISOString(),
        range,
        eventId,
      };

      return NextResponse.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
    }
  });
}

// Helper functions to generate mock data (replace with real tracking implementation)
async function generateUserGrowthData(startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const data = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [users, newUsers, alumni] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          userType: "ALUMNI",
        },
      }),
    ]);

    data.push({
      date: format(date, "MMM dd"),
      users: users + Math.floor(Math.random() * 10), // Add some variance
      newUsers,
      alumni,
    });
  }

  return data;
}

async function generateEventMetrics(startDate: Date, endDate: Date) {
  const months = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const [events, registrations] = await Promise.all([
      prisma.event.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.registration.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ]);

    months.push({
      month: format(currentDate, "MMM"),
      events,
      registrations,
      attendance: Math.floor(registrations * 0.8), // Mock 80% attendance rate
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
}

function generateDeviceStats() {
  // Mock device breakdown - in real app, this would come from analytics tracking
  return [
    { name: "Desktop", value: 45, color: "#3B82F6" },
    { name: "Mobile", value: 38, color: "#10B981" },
    { name: "Tablet", value: 17, color: "#F59E0B" },
  ];
}

function generatePageViews() {
  // Mock page views - in real app, this would come from analytics tracking
  return [
    { page: "/events", views: 12450, sessions: 8923, bounceRate: 24.5 },
    { page: "/dashboard", views: 9821, sessions: 7234, bounceRate: 18.2 },
    { page: "/alumni", views: 7654, sessions: 5432, bounceRate: 32.1 },
    { page: "/about", views: 5432, sessions: 3421, bounceRate: 45.3 },
    { page: "/contact", views: 3210, sessions: 2341, bounceRate: 38.7 },
  ];
}

async function generateUserSegments() {
  const [alumni, general, admin, guests] = await Promise.all([
    prisma.user.count({ where: { userType: "ALUMNI" } }),
    prisma.user.count({ where: { userType: "GENERAL" } }),
    prisma.user.count({ where: { userType: "ADMIN" } }),
    // Mock guests - would need guest tracking
    Promise.resolve(Math.floor(alumni * 0.2)),
  ]);

  const total = alumni + general + admin + guests;

  return [
    {
      segment: "Alumni",
      count: alumni,
      percentage: total > 0 ? (alumni / total) * 100 : 0,
    },
    {
      segment: "General",
      count: general,
      percentage: total > 0 ? (general / total) * 100 : 0,
    },
    {
      segment: "Admin",
      count: admin,
      percentage: total > 0 ? (admin / total) * 100 : 0,
    },
    {
      segment: "Guests",
      count: guests,
      percentage: total > 0 ? (guests / total) * 100 : 0,
    },
  ];
}
