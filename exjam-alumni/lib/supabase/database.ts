import { createClient } from "./client";

// Database service for direct Supabase operations
export class SupabaseDatabase {
  private client = createClient();

  // Events operations
  async getEvents(filters?: {
    search?: string;
    type?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from("Event").select(`
        *,
        _count: Registration(count)
      `);

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.featured !== undefined) {
      query = query.eq("featured", filters.featured);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return query;
  }

  async createEvent(eventData: any) {
    return this.client.from("Event").insert(eventData).select().single();
  }

  async updateEvent(id: string, updates: any) {
    return this.client.from("Event").update(updates).eq("id", id).select().single();
  }

  async deleteEvent(id: string) {
    return this.client.from("Event").delete().eq("id", id);
  }

  // Users operations
  async getUsers(filters?: {
    search?: string;
    role?: string;
    isAlumni?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from("User").select(`
        *,
        registrations: Registration(count)
      `);

    if (filters?.search) {
      query = query.or(
        `firstName.ilike.%${filters.search}%,lastName.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }
    if (filters?.role) {
      query = query.eq("role", filters.role);
    }
    if (filters?.isAlumni !== undefined) {
      query = query.eq("isAlumni", filters.isAlumni);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return query;
  }

  async createUser(userData: any) {
    return this.client.from("User").insert(userData).select().single();
  }

  async updateUser(id: string, updates: any) {
    return this.client.from("User").update(updates).eq("id", id).select().single();
  }

  // Registrations operations
  async getRegistrations(filters?: {
    eventId?: string;
    userId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from("Registration").select(`
        *,
        event: Event(*),
        user: User(*),
        payment: Payment(*),
        ticket: Ticket(*)
      `);

    if (filters?.eventId) {
      query = query.eq("eventId", filters.eventId);
    }
    if (filters?.userId) {
      query = query.eq("userId", filters.userId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return query;
  }

  async createRegistration(registrationData: any) {
    return this.client
      .from("Registration")
      .insert(registrationData)
      .select(
        `
        *,
        event: Event(*),
        user: User(*)
      `
      )
      .single();
  }

  // Payments operations
  async getPayments(filters?: {
    status?: string;
    paymentMethod?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.client.from("Payment").select(`
        *,
        registration: Registration(
          *,
          event: Event(*),
          user: User(*)
        )
      `);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.paymentMethod) {
      query = query.eq("paymentMethod", filters.paymentMethod);
    }
    if (filters?.userId) {
      query = query.eq("userId", filters.userId);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return query.order("createdAt", { ascending: false });
  }

  async updatePayment(id: string, updates: any) {
    return this.client
      .from("Payment")
      .update(updates)
      .eq("id", id)
      .select(
        `
        *,
        registration: Registration(
          *,
          event: Event(*),
          user: User(*)
        )
      `
      )
      .single();
  }

  // Analytics operations
  async getAnalytics() {
    // Get all analytics data in parallel
    const [eventsResult, usersResult, registrationsResult, paymentsResult, revenueResult] =
      await Promise.all([
        // Events stats
        this.client.from("Event").select("*", { count: "exact" }),

        // Users stats
        this.client.from("User").select("role", { count: "exact" }),

        // Registrations stats
        this.client.from("Registration").select("status,createdAt", { count: "exact" }),

        // Payments stats
        this.client.from("Payment").select("status,paymentMethod", { count: "exact" }),

        // Revenue stats
        this.client.from("Payment").select("amount,status").eq("status", "COMPLETED"),
      ]);

    return {
      events: eventsResult,
      users: usersResult,
      registrations: registrationsResult,
      payments: paymentsResult,
      revenue: revenueResult,
    };
  }

  // Tickets operations
  async getTickets(filters?: {
    eventId?: string;
    userId?: string;
    status?: string;
    isTemporary?: boolean;
  }) {
    let query = this.client.from("Ticket").select(`
        *,
        registration: Registration(
          *,
          event: Event(*),
          user: User(*)
        )
      `);

    if (filters?.eventId) {
      query = query.eq("eventId", filters.eventId);
    }
    if (filters?.userId) {
      query = query.eq("userId", filters.userId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.isTemporary !== undefined) {
      query = query.eq("isTemporary", filters.isTemporary);
    }

    return query;
  }

  // Check-in operations
  async checkInTicket(ticketId: string) {
    return this.client
      .from("Ticket")
      .update({
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select(
        `
        *,
        registration: Registration(
          *,
          event: Event(*),
          user: User(*)
        )
      `
      )
      .single();
  }

  // Bulk operations for admin
  async bulkUpdateUsers(userIds: string[], updates: any) {
    return this.client.from("User").update(updates).in("id", userIds).select();
  }

  async bulkDeleteEvents(eventIds: string[]) {
    return this.client.from("Event").delete().in("id", eventIds);
  }

  // Direct SQL queries for complex operations
  async executeQuery(query: string, params?: any[]) {
    return this.client.rpc("execute_sql", {
      query,
      params: params || [],
    });
  }
}

// Export instances
export const supabaseDb = new SupabaseDatabase();
