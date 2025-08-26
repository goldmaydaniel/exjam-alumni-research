import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock export jobs for demonstration
    const exportJobs = [
      {
        id: "job-1",
        type: "EVENTS",
        status: "COMPLETED",
        fileName: "events-report-2024.csv",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86000000).toISOString(),
        downloadUrl: "/api/admin/export/download/job-1",
        recordCount: 25,
      },
      {
        id: "job-2",
        type: "USERS",
        status: "PROCESSING",
        fileName: "users-report-2024.xlsx",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        recordCount: null,
      },
      {
        id: "job-3",
        type: "REGISTRATIONS",
        status: "FAILED",
        fileName: "registrations-report-2024.pdf",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        recordCount: null,
      },
    ];

    return NextResponse.json(exportJobs);
  } catch (error) {
    console.error("Export jobs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch export jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    const user = await verifyToken(token);

    if (!user || !["ADMIN", "ORGANIZER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, type, format, fields, filters } = body;

    if (!type || !format || !fields?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate job ID and filename
    const jobId = `job-${Date.now()}`;
    const fileName = `${type.toLowerCase()}-report-${new Date().toISOString().split("T")[0]}.${format.toLowerCase()}`;

    let recordCount = 0;
    let data = [];

    // Mock data generation based on type
    switch (type) {
      case "EVENTS":
        // Query events with filters
        const events = await prisma.event.findMany({
          include: {
            registrations: true,
            _count: {
              select: {
                registrations: true,
              },
            },
          },
          where: filters?.dateRange
            ? {
                date: {
                  gte: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
                  lte: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
                },
              }
            : undefined,
        });

        data = events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          status: event.status,
          capacity: event.capacity,
          registrations: event._count.registrations,
          checkins: event.registrations.filter((r) => r.checkedIn).length,
          revenue: event.registrations.reduce((sum, r) => sum + (r.amount || 0), 0),
          createdAt: event.createdAt,
        }));
        recordCount = data.length;
        break;

      case "USERS":
        const users = await prisma.user.findMany({
          include: {
            registrations: {
              include: {
                event: true,
              },
            },
          },
        });

        data = users.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          eventsAttended: user.registrations.filter((r) => r.checkedIn).length,
          totalSpent: user.registrations.reduce((sum, r) => sum + (r.amount || 0), 0),
        }));
        recordCount = data.length;
        break;

      case "REGISTRATIONS":
        const registrations = await prisma.registration.findMany({
          include: {
            user: true,
            event: true,
          },
          where: filters?.dateRange
            ? {
                registeredAt: {
                  gte: filters.dateRange.from ? new Date(filters.dateRange.from) : undefined,
                  lte: filters.dateRange.to ? new Date(filters.dateRange.to) : undefined,
                },
              }
            : undefined,
        });

        data = registrations.map((reg) => ({
          id: reg.id,
          user: `${reg.user.firstName} ${reg.user.lastName}`,
          event: reg.event.title,
          ticketType: reg.ticketType,
          registeredAt: reg.registeredAt,
          paymentStatus: reg.paymentStatus,
          checkedIn: reg.checkedIn,
          checkedInAt: reg.checkedInAt,
          specialRequests: reg.specialRequests,
        }));
        recordCount = data.length;
        break;

      case "ANALYTICS":
        // Generate analytics data
        const analyticsEvents = await prisma.event.findMany({
          include: {
            registrations: true,
          },
        });

        data = [
          {
            totalEvents: analyticsEvents.length,
            totalRegistrations: analyticsEvents.reduce((sum, e) => sum + e.registrations.length, 0),
            totalRevenue: analyticsEvents.reduce(
              (sum, e) => sum + e.registrations.reduce((s, r) => s + (r.amount || 0), 0),
              0
            ),
            checkInRate:
              analyticsEvents.reduce((sum, e) => {
                const total = e.registrations.length;
                const checkedIn = e.registrations.filter((r) => r.checkedIn).length;
                return sum + (total > 0 ? checkedIn / total : 0);
              }, 0) / (analyticsEvents.length || 1),
          },
        ];
        recordCount = 1;
        break;

      case "COMMUNICATIONS":
        // Mock communications data
        data = [
          {
            id: "msg-1",
            subject: "Event Reminder",
            type: "EMAIL",
            recipients: "all",
            sentAt: new Date().toISOString(),
            status: "SENT",
            deliveryRate: 95.2,
          },
        ];
        recordCount = data.length;
        break;

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    // Create the export job
    const exportJob = {
      id: jobId,
      type,
      format,
      status: "COMPLETED",
      fileName,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      downloadUrl: `/api/admin/export/download/${jobId}`,
      recordCount,
      data,
    };

    return NextResponse.json(exportJob);
  } catch (error) {
    console.error("Export creation error:", error);
    return NextResponse.json({ error: "Failed to create export job" }, { status: 500 });
  }
}

// Keep the existing legacy export functionality
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

    if (user?.role !== "ADMIN" && user?.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    switch (type) {
      case "registrations": {
        const registrations = await prisma.registration.findMany({
          include: {
            User: {
              select: {
                fullName: true,
                email: true,
                phone: true,
                squadron: true,
                serviceNumber: true,
              },
            },
            Event: {
              select: {
                title: true,
                price: true,
              },
            },
            Payment: {
              select: {
                status: true,
                amount: true,
              },
            },
            Ticket: {
              select: {
                ticketNumber: true,
                checkedIn: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return NextResponse.json(registrations);
      }

      case "users": {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
            phone: true,
            squadron: true,
            serviceNumber: true,
            chapter: true,
            currentLocation: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return NextResponse.json(users);
      }

      case "payments": {
        const payments = await prisma.payment.findMany({
          include: {
            User: {
              select: {
                fullName: true,
                email: true,
                squadron: true,
              },
            },
            Registration: {
              select: {
                Event: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return NextResponse.json(payments);
      }

      case "analytics": {
        // Get comprehensive analytics
        const [
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          totalUsers,
          verifiedUsers,
          successfulPayments,
          totalPayments,
          checkedInTickets,
          totalTickets,
          squadronStats,
        ] = await Promise.all([
          prisma.registration.count(),
          prisma.registration.count({ where: { status: "CONFIRMED" } }),
          prisma.registration.count({ where: { status: "PENDING" } }),
          prisma.user.count(),
          prisma.user.count({ where: { emailVerified: true } }),
          prisma.payment.count({ where: { status: "SUCCESS" } }),
          prisma.payment.count(),
          prisma.ticket.count({ where: { checkedIn: true } }),
          prisma.ticket.count(),
          prisma.user.groupBy({
            by: ["squadron"],
            _count: true,
            orderBy: {
              _count: {
                squadron: "desc",
              },
            },
          }),
        ]);

        const totalRevenue = await prisma.payment.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true },
        });

        const analytics = {
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          totalRevenue: totalRevenue._sum.amount || 0,
          averageRevenue: totalRevenue._sum.amount
            ? totalRevenue._sum.amount / successfulPayments
            : 0,
          checkInRate: totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0,
          paymentSuccessRate:
            totalPayments > 0 ? Math.round((successfulPayments / totalPayments) * 100) : 0,
          topSquadron: squadronStats[0]?.squadron || "N/A",
          totalUsers,
          verifiedUsers,
          squadronDistribution: squadronStats,
        };

        return NextResponse.json(analytics);
      }

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
