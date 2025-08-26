import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

interface ActivityEvent {
  id: string;
  userId: string;
  sessionId: string;
  type: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  duration?: number;
  page?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { events }: { events: ActivityEvent[] } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Invalid events data" }, { status: 400 });
    }

    // Get client information
    const headersList = headers();
    const clientIP =
      headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || request.ip || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    const referer = headersList.get("referer");

    // Process and store events
    const processedEvents = events.map((event) => ({
      id: event.id,
      userId: event.userId === "anonymous" ? null : event.userId,
      sessionId: event.sessionId,
      type: event.type,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      metadata: event.metadata || {},
      timestamp: new Date(event.timestamp),
      ip: event.ip || clientIP,
      userAgent: event.userAgent || userAgent,
      referrer: event.referrer || referer,
      duration: event.duration,
      page: event.page,
    }));

    // Batch insert events
    try {
      await prisma.activityEvent.createMany({
        data: processedEvents,
        skipDuplicates: true, // In case of retry with same events
      });
    } catch (dbError) {
      // If ActivityEvent table doesn't exist, we'll create it in migration
      // For now, log to console or external service
      console.log("Activity events:", processedEvents);
    }

    // Update session information
    const sessionUpdates = new Map<string, any>();

    for (const event of events) {
      if (!sessionUpdates.has(event.sessionId)) {
        sessionUpdates.set(event.sessionId, {
          sessionId: event.sessionId,
          userId: event.userId === "anonymous" ? null : event.userId,
          lastActivity: new Date(event.timestamp),
          pageViews: 0,
          interactions: 0,
        });
      }

      const session = sessionUpdates.get(event.sessionId);

      if (event.type === "navigation" && event.action === "page_view") {
        session.pageViews += 1;
      }

      if (event.type === "interaction") {
        session.interactions += 1;
      }

      // Update last activity time
      const eventTime = new Date(event.timestamp);
      if (eventTime > session.lastActivity) {
        session.lastActivity = eventTime;
      }
    }

    // Update sessions (if table exists)
    try {
      for (const [sessionId, sessionData] of sessionUpdates) {
        await prisma.userSession.upsert({
          where: { id: sessionId },
          create: {
            id: sessionId,
            userId: sessionData.userId,
            startTime: new Date(),
            lastActivity: sessionData.lastActivity,
            pageViews: sessionData.pageViews,
            interactions: sessionData.interactions,
            device: {},
            location: {},
          },
          update: {
            lastActivity: sessionData.lastActivity,
            pageViews: {
              increment: sessionData.pageViews,
            },
            interactions: {
              increment: sessionData.interactions,
            },
          },
        });
      }
    } catch (dbError) {
      // Session table might not exist yet
      console.log("Session updates:", Array.from(sessionUpdates.values()));
    }

    // Real-time analytics updates (could be sent to a message queue)
    await updateRealTimeMetrics(events);

    return NextResponse.json({
      success: true,
      eventsProcessed: events.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing activity events:", error);
    return NextResponse.json({ error: "Failed to process activity events" }, { status: 500 });
  }
}

/**
 * Update real-time metrics and trigger any necessary actions
 */
async function updateRealTimeMetrics(events: ActivityEvent[]) {
  // This could update Redis counters, trigger webhooks, etc.
  const metrics = {
    pageViews: events.filter((e) => e.type === "navigation" && e.action === "page_view").length,
    interactions: events.filter((e) => e.type === "interaction").length,
    errors: events.filter((e) => e.type === "error").length,
    uniqueUsers: new Set(events.map((e) => e.userId)).size,
    timestamp: new Date().toISOString(),
  };

  // In a real application, you might:
  // - Update Redis counters
  // - Send to analytics service (Google Analytics, Mixpanel, etc.)
  // - Trigger alerts for error rates
  // - Update real-time dashboards via WebSocket

  console.log("Real-time metrics update:", metrics);
}
