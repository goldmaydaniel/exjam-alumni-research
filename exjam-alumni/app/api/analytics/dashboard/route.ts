import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AnalyticsData {
  totalRegistrations: number;
  checkedInCount: number;
  paidCount: number;
  pendingPayments: number;
  revenueTotal: number;
  dailyRegistrations: Array<{ date: string; count: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  eventMetrics?: any[];
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const analytics: AnalyticsData = {
      totalRegistrations: 0,
      checkedInCount: 0,
      paidCount: 0,
      pendingPayments: 0,
      revenueTotal: 0,
      dailyRegistrations: [],
      paymentMethodBreakdown: [],
    };

    // Build base query
    let baseQuery = supabase.from("registrations");

    if (eventId) {
      baseQuery = baseQuery.eq("event_id", eventId);
    }

    if (dateFrom) {
      baseQuery = baseQuery.gte("created_at", dateFrom);
    }

    if (dateTo) {
      baseQuery = baseQuery.lte("created_at", dateTo);
    }

    // Get all registrations for detailed analysis
    const { data: registrations, error: regError } = await baseQuery.select("*");

    if (regError) {
      console.error("Analytics query error:", regError);
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // Calculate metrics
    analytics.totalRegistrations = registrations?.length || 0;
    analytics.checkedInCount = registrations?.filter((r) => r.checked_in).length || 0;
    analytics.paidCount = registrations?.filter((r) => r.payment_status === "paid").length || 0;
    analytics.pendingPayments =
      registrations?.filter((r) => ["pending", "processing"].includes(r.payment_status)).length ||
      0;

    // Calculate revenue
    const paidRegistrations = registrations?.filter((r) => r.payment_status === "paid") || [];
    analytics.revenueTotal = paidRegistrations.reduce((sum, reg) => sum + (reg.amount || 0), 0);

    // Daily registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations =
      registrations?.filter((r) => new Date(r.created_at) >= thirtyDaysAgo) || [];

    const dailyMap = new Map<string, number>();
    recentRegistrations.forEach((reg) => {
      const date = new Date(reg.created_at).toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    analytics.dailyRegistrations = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Payment method breakdown
    const methodMap = new Map<string, { count: number; amount: number }>();

    paidRegistrations.forEach((reg) => {
      const method = reg.payment_method || "unknown";
      const current = methodMap.get(method) || { count: 0, amount: 0 };
      methodMap.set(method, {
        count: current.count + 1,
        amount: current.amount + (reg.amount || 0),
      });
    });

    analytics.paymentMethodBreakdown = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));

    // Event-specific metrics if no specific event requested
    if (!eventId) {
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          event_date,
          registrations!inner(
            id,
            payment_status,
            checked_in
          )
        `
        )
        .order("event_date", { ascending: false });

      if (!eventsError && events) {
        analytics.eventMetrics = events.map((event) => ({
          id: event.id,
          title: event.title,
          eventDate: event.event_date,
          totalRegistrations: event.registrations?.length || 0,
          paidRegistrations:
            event.registrations?.filter((r) => r.payment_status === "paid").length || 0,
          checkedIn: event.registrations?.filter((r) => r.checked_in).length || 0,
        }));
      }
    }

    // Additional metrics
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRegistrations =
      registrations?.filter((r) => new Date(r.created_at) >= todayStart).length || 0;

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const weeklyRegistrations =
      registrations?.filter((r) => new Date(r.created_at) >= thisWeekStart).length || 0;

    return NextResponse.json({
      ...analytics,
      additionalMetrics: {
        todayRegistrations,
        weeklyRegistrations,
        conversionRate:
          analytics.totalRegistrations > 0
            ? Math.round((analytics.paidCount / analytics.totalRegistrations) * 100)
            : 0,
        checkInRate:
          analytics.paidCount > 0
            ? Math.round((analytics.checkedInCount / analytics.paidCount) * 100)
            : 0,
        averageAmount:
          analytics.paidCount > 0 ? Math.round(analytics.revenueTotal / analytics.paidCount) : 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
