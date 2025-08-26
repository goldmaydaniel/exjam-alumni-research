import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseServiceClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createResponse,
  createErrorResponse,
  handleOptions,
  logRequest,
  validateAuth,
} from "../_shared/utils.ts";

interface AnalyticsQuery {
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
  metric?: "registrations" | "checkins" | "payments" | "all";
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  logRequest("analytics", req.method);

  try {
    const supabase = createSupabaseServiceClient();
    const authToken = validateAuth(req);

    if (!authToken) {
      return createErrorResponse("Authorization required", 401);
    }

    if (req.method === "GET") {
      const url = new URL(req.url);
      const eventId = url.searchParams.get("eventId");
      const dateFrom = url.searchParams.get("dateFrom");
      const dateTo = url.searchParams.get("dateTo");
      const metric = url.searchParams.get("metric") as AnalyticsQuery["metric"];

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

      // Total registrations
      const { count: totalRegistrations } = await baseQuery.select("*", {
        count: "exact",
        head: true,
      });

      analytics.totalRegistrations = totalRegistrations || 0;

      // Checked in count
      const { count: checkedInCount } = await baseQuery
        .select("*", { count: "exact", head: true })
        .eq("checked_in", true);

      analytics.checkedInCount = checkedInCount || 0;

      // Paid registrations and revenue
      const { data: paidRegistrations } = await baseQuery
        .select("amount, payment_method")
        .eq("payment_status", "paid");

      analytics.paidCount = paidRegistrations?.length || 0;
      analytics.revenueTotal =
        paidRegistrations?.reduce((sum, reg) => sum + (reg.amount || 0), 0) || 0;

      // Pending payments
      const { count: pendingPayments } = await baseQuery
        .select("*", { count: "exact", head: true })
        .in("payment_status", ["pending", "processing"]);

      analytics.pendingPayments = pendingPayments || 0;

      // Daily registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: dailyData } = await baseQuery
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at");

      if (dailyData) {
        const dailyMap = new Map<string, number>();
        dailyData.forEach((item) => {
          const date = new Date(item.created_at).toISOString().split("T")[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        });

        analytics.dailyRegistrations = Array.from(dailyMap.entries()).map(([date, count]) => ({
          date,
          count,
        }));
      }

      // Payment method breakdown
      if (paidRegistrations) {
        const methodMap = new Map<string, { count: number; amount: number }>();

        paidRegistrations.forEach((reg) => {
          const method = reg.payment_method || "unknown";
          const current = methodMap.get(method) || { count: 0, amount: 0 };
          methodMap.set(method, {
            count: current.count + 1,
            amount: current.amount + (reg.amount || 0),
          });
        });

        analytics.paymentMethodBreakdown = Array.from(methodMap.entries()).map(
          ([method, data]) => ({
            method,
            count: data.count,
            amount: data.amount,
          })
        );
      }

      // Event-specific metrics if no specific event requested
      if (!eventId) {
        const { data: eventMetrics } = await supabase
          .from("events")
          .select(
            `
            id,
            title,
            event_date,
            registrations(count)
          `
          )
          .order("event_date", { ascending: false });

        analytics.eventMetrics = eventMetrics;
      }

      logRequest("analytics", "GET", { eventId, metric, totalRegistrations });
      return createResponse(analytics);
    }

    // POST request for custom analytics queries
    if (req.method === "POST") {
      const query = await req.json();

      // Execute custom query based on request
      // This is a placeholder for more complex analytics queries

      return createResponse({
        message: "Custom analytics not implemented yet",
        query,
      });
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Analytics error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});
