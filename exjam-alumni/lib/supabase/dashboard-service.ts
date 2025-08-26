import { createClient } from "./client";
import type {
  DashboardStats,
  ActivityItem,
  SupabaseUser,
  SupabaseEvent,
  SupabaseRegistration,
  SupabasePayment,
  SupabaseTicket,
} from "./schema";

export class RealDashboardService {
  private supabase = createClient();

  // Get comprehensive dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        eventsResponse,
        usersResponse,
        registrationsResponse,
        paymentsResponse,
        recentActivity,
      ] = await Promise.all([
        this.getEventsStats(),
        this.getUsersStats(),
        this.getRegistrationsStats(),
        this.getPaymentsStats(),
        this.getRecentActivity(),
      ]);

      return {
        totalEvents: eventsResponse.total,
        publishedEvents: eventsResponse.published,
        totalUsers: usersResponse.total,
        totalRegistrations: registrationsResponse.total,
        confirmedRegistrations: registrationsResponse.confirmed,
        totalPayments: paymentsResponse.total,
        completedPayments: paymentsResponse.completed,
        pendingPayments: paymentsResponse.pending,
        bankTransferPending: paymentsResponse.bankTransferPending,
        totalRevenue: paymentsResponse.totalRevenue,
        recentActivity,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new Error("Failed to fetch dashboard statistics");
    }
  }

  // Get real events statistics
  private async getEventsStats() {
    const [totalResult, publishedResult] = await Promise.all([
      this.supabase.from("Event").select("id", { count: "exact" }),
      this.supabase.from("Event").select("id", { count: "exact" }).eq("status", "PUBLISHED"),
    ]);

    return {
      total: totalResult.count || 0,
      published: publishedResult.count || 0,
    };
  }

  // Get real users statistics
  private async getUsersStats() {
    const totalResult = await this.supabase.from("User").select("id", { count: "exact" });

    return {
      total: totalResult.count || 0,
    };
  }

  // Get real registrations statistics
  private async getRegistrationsStats() {
    const [totalResult, confirmedResult] = await Promise.all([
      this.supabase.from("Registration").select("id", { count: "exact" }),
      this.supabase.from("Registration").select("id", { count: "exact" }).eq("status", "CONFIRMED"),
    ]);

    return {
      total: totalResult.count || 0,
      confirmed: confirmedResult.count || 0,
    };
  }

  // Get real payments statistics
  private async getPaymentsStats() {
    const [totalResult, completedResult, pendingResult, bankTransferResult, revenueResult] =
      await Promise.all([
        this.supabase.from("Payment").select("id", { count: "exact" }),
        this.supabase.from("Payment").select("id", { count: "exact" }).eq("status", "COMPLETED"),
        this.supabase.from("Payment").select("id", { count: "exact" }).eq("status", "PENDING"),
        this.supabase
          .from("Payment")
          .select("id", { count: "exact" })
          .eq("status", "BANK_TRANSFER_PENDING"),
        this.supabase.from("Payment").select("amount").eq("status", "COMPLETED"),
      ]);

    const totalRevenue =
      revenueResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    return {
      total: totalResult.count || 0,
      completed: completedResult.count || 0,
      pending: pendingResult.count || 0,
      bankTransferPending: bankTransferResult.count || 0,
      totalRevenue,
    };
  }

  // Get real recent activity
  private async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const [recentRegistrations, recentPayments, recentCheckins] = await Promise.all([
        this.supabase
          .from("Registration")
          .select(
            `
            id, status, createdAt, updatedAt,
            user:User(firstName, lastName, email),
            event:Event(title)
          `
          )
          .order("createdAt", { ascending: false })
          .limit(5),

        this.supabase
          .from("Payment")
          .select(
            `
            id, status, amount, reference, createdAt, updatedAt,
            registration:Registration(
              user:User(firstName, lastName),
              event:Event(title)
            )
          `
          )
          .order("createdAt", { ascending: false })
          .limit(5),

        this.supabase
          .from("Ticket")
          .select(
            `
            id, checkedIn, checkedInAt,
            user:User(firstName, lastName),
            event:Event(title)
          `
          )
          .eq("checkedIn", true)
          .order("checkedInAt", { ascending: false })
          .limit(3),
      ]);

      const activities: ActivityItem[] = [];

      // Process registrations
      recentRegistrations.data?.forEach((reg) => {
        activities.push({
          id: `reg-${reg.id}`,
          type: "registration",
          action: `${reg.user?.firstName} ${reg.user?.lastName} registered for ${reg.event?.title}`,
          entityId: reg.id,
          userId: reg.user?.id,
          metadata: { status: reg.status },
          timestamp: reg.createdAt,
        });
      });

      // Process payments
      recentPayments.data?.forEach((payment) => {
        activities.push({
          id: `pay-${payment.id}`,
          type: "payment",
          action: `Payment ${payment.status.toLowerCase()}: ₦${payment.amount?.toLocaleString()} - ${payment.reference}`,
          entityId: payment.id,
          userId: payment.registration?.user?.id,
          metadata: {
            status: payment.status,
            amount: payment.amount,
            reference: payment.reference,
          },
          timestamp: payment.updatedAt || payment.createdAt,
        });
      });

      // Process check-ins
      recentCheckins.data?.forEach((ticket) => {
        if (ticket.checkedInAt) {
          activities.push({
            id: `checkin-${ticket.id}`,
            type: "checkin",
            action: `${ticket.user?.firstName} ${ticket.user?.lastName} checked in to ${ticket.event?.title}`,
            entityId: ticket.id,
            userId: ticket.user?.id,
            metadata: { checkedInAt: ticket.checkedInAt },
            timestamp: ticket.checkedInAt,
          });
        }
      });

      // Sort by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  }

  // Get real events list
  async getEvents(
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      status?: string;
      featured?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, search, status, featured } = options;

    let query = this.supabase.from("Event").select(`
        *,
        registrations:Registration(count),
        creator:User!Event_createdBy_fkey(firstName, lastName)
      `);

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (featured !== undefined) {
      query = query.eq("featured", featured);
    }

    const result = await query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    return result;
  }

  // Get real users list
  async getUsers(
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      role?: string;
      isAlumni?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, search, role, isAlumni } = options;

    let query = this.supabase.from("User").select(`
        *,
        registrations:Registration(count),
        payments:Payment(count)
      `);

    if (search) {
      query = query.or(
        `firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (isAlumni !== undefined) {
      query = query.eq("isAlumni", isAlumni);
    }

    const result = await query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    return result;
  }

  // Get real registrations list
  async getRegistrations(
    options: {
      limit?: number;
      offset?: number;
      eventId?: string;
      status?: string;
    } = {}
  ) {
    const { limit = 20, offset = 0, eventId, status } = options;

    let query = this.supabase.from("Registration").select(`
        *,
        user:User(*),
        event:Event(*),
        payment:Payment(*),
        ticket:Ticket(*)
      `);

    if (eventId) {
      query = query.eq("eventId", eventId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const result = await query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    return result;
  }

  // Get real payments list
  async getPayments(
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      paymentMethod?: string;
    } = {}
  ) {
    const { limit = 20, offset = 0, status, paymentMethod } = options;

    let query = this.supabase.from("Payment").select(`
        *,
        registration:Registration(
          *,
          user:User(*),
          event:Event(*)
        )
      `);

    if (status) {
      query = query.eq("status", status);
    }
    if (paymentMethod) {
      query = query.eq("paymentMethod", paymentMethod);
    }

    const result = await query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    return result;
  }

  // Get real tickets for check-in
  async getTickets(
    options: {
      limit?: number;
      offset?: number;
      eventId?: string;
      checkedIn?: boolean;
    } = {}
  ) {
    const { limit = 20, offset = 0, eventId, checkedIn } = options;

    let query = this.supabase.from("Ticket").select(`
        *,
        user:User(*),
        event:Event(*),
        registration:Registration(*)
      `);

    if (eventId) {
      query = query.eq("eventId", eventId);
    }
    if (checkedIn !== undefined) {
      query = query.eq("checkedIn", checkedIn);
    }

    const result = await query
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    return result;
  }

  // Real-time event handlers
  onRealtimeUpdate(callback: (event: any) => void) {
    const channels = [
      this.supabase
        .channel("dashboard-events")
        .on("postgres_changes", { event: "*", schema: "public", table: "Event" }, callback)
        .subscribe(),

      this.supabase
        .channel("dashboard-users")
        .on("postgres_changes", { event: "*", schema: "public", table: "User" }, callback)
        .subscribe(),

      this.supabase
        .channel("dashboard-registrations")
        .on("postgres_changes", { event: "*", schema: "public", table: "Registration" }, callback)
        .subscribe(),

      this.supabase
        .channel("dashboard-payments")
        .on("postgres_changes", { event: "*", schema: "public", table: "Payment" }, callback)
        .subscribe(),

      this.supabase
        .channel("dashboard-tickets")
        .on("postgres_changes", { event: "*", schema: "public", table: "Ticket" }, callback)
        .subscribe(),
    ];

    return () => {
      channels.forEach((channel) => {
        this.supabase.removeChannel(channel);
      });
    };
  }
}

// Export singleton instance
export const realDashboard = new RealDashboardService();
