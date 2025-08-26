import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { realtimeManager } from "@/lib/supabase/realtime";
import toast from "react-hot-toast";

// Real-time data hook for events
export function useRealtimeEvents(initialData: any[] = []) {
  const [events, setEvents] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time events
    const channelName = realtimeManager.subscribeToTable("Event", "*", (payload) => {
      console.log("Event real-time update:", payload);

      switch (payload.eventType) {
        case "INSERT":
          setEvents((prev) => [payload.new, ...prev]);
          toast.success(`New event created: ${payload.new.title}`);
          break;

        case "UPDATE":
          setEvents((prev) =>
            prev.map((event) => (event.id === payload.new.id ? payload.new : event))
          );
          toast.success(`Event updated: ${payload.new.title}`);
          break;

        case "DELETE":
          setEvents((prev) => prev.filter((event) => event.id !== payload.old.id));
          toast.success(`Event deleted`);
          break;
      }
    });

    return () => {
      realtimeManager.unsubscribe(channelName);
    };
  }, []);

  const loadEvents = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      let query = supabase.from("Event").select("*");

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

      const result = await query;
      if (result.error) throw new Error(result.error.message);
      setEvents(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load events";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
    refresh: loadEvents,
  };
}

// Real-time data hook for registrations
export function useRealtimeRegistrations(eventId?: string) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channelName = realtimeManager.subscribeToTable("Registration", "*", (payload) => {
      console.log("Registration real-time update:", payload);

      // Filter by eventId if specified
      if (eventId && payload.new?.eventId !== eventId && payload.old?.eventId !== eventId) {
        return;
      }

      switch (payload.eventType) {
        case "INSERT":
          setRegistrations((prev) => [payload.new, ...prev]);
          toast.success(`New registration received`);
          break;

        case "UPDATE":
          setRegistrations((prev) =>
            prev.map((reg) => (reg.id === payload.new.id ? payload.new : reg))
          );
          break;

        case "DELETE":
          setRegistrations((prev) => prev.filter((reg) => reg.id !== payload.old.id));
          break;
      }
    });

    return () => {
      realtimeManager.unsubscribe(channelName);
    };
  }, [eventId]);

  const loadRegistrations = useCallback(
    async (filters?: any) => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        let query = supabase.from("Registration").select("*");

        if (eventId) {
          query = query.eq("eventId", eventId);
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

        const result = await query;
        if (result.error) throw new Error(result.error.message);
        setRegistrations(result.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load registrations";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  return {
    registrations,
    loading,
    error,
    loadRegistrations,
    refresh: loadRegistrations,
  };
}

// Real-time data hook for payments
export function useRealtimePayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    bankTransferPending: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const channelName = realtimeManager.subscribeToTable("Payment", "*", (payload) => {
      console.log("Payment real-time update:", payload);

      switch (payload.eventType) {
        case "INSERT":
          setPayments((prev) => [payload.new, ...prev]);
          toast.success(`New payment created: ${payload.new.reference}`);
          updateStats();
          break;

        case "UPDATE":
          setPayments((prev) =>
            prev.map((payment) => (payment.id === payload.new.id ? payload.new : payment))
          );

          // Show notification for payment status changes
          if (payload.old.status !== payload.new.status) {
            if (payload.new.status === "COMPLETED") {
              toast.success(`Payment completed: ${payload.new.reference}`);
            } else if (payload.new.status === "BANK_TRANSFER_PENDING") {
              toast.success(`Bank transfer submitted: ${payload.new.reference}`);
            } else if (payload.new.status === "FAILED") {
              toast.error(`Payment failed: ${payload.new.reference}`);
            }
          }

          updateStats();
          break;
      }
    });

    return () => {
      realtimeManager.unsubscribe(channelName);
    };
  }, []);

  const updateStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const result = await supabase.from("Payment").select("*");
      if (result.data) {
        const payments = result.data;
        const completed = payments.filter((p) => p.status === "COMPLETED");
        const pending = payments.filter((p) => p.status === "PENDING");
        const bankTransferPending = payments.filter((p) => p.status === "BANK_TRANSFER_PENDING");
        const totalRevenue = completed.reduce((sum, p) => sum + (p.amount || 0), 0);

        setStats({
          total: payments.length,
          completed: completed.length,
          pending: pending.length,
          bankTransferPending: bankTransferPending.length,
          totalRevenue,
        });
      }
    } catch (error) {
      console.error("Failed to update payment stats:", error);
    }
  }, []);

  const loadPayments = useCallback(
    async (filters?: any) => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        let query = supabase.from("Payment").select("*");

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

        const result = await query.order("createdAt", { ascending: false });
        if (result.error) throw new Error(result.error.message);
        setPayments(result.data || []);
        updateStats();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load payments";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [updateStats]
  );

  return {
    payments,
    stats,
    loading,
    error,
    loadPayments,
    refresh: loadPayments,
  };
}

// Real-time data hook for users
export function useRealtimeUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channelName = realtimeManager.subscribeToTable("User", "*", (payload) => {
      console.log("User real-time update:", payload);

      switch (payload.eventType) {
        case "INSERT":
          setUsers((prev) => [payload.new, ...prev]);
          toast.success(`New user registered: ${payload.new.firstName} ${payload.new.lastName}`);
          break;

        case "UPDATE":
          setUsers((prev) => prev.map((user) => (user.id === payload.new.id ? payload.new : user)));

          // Show notification for role changes
          if (payload.old.role !== payload.new.role) {
            toast.success(
              `User role updated: ${payload.new.firstName} ${payload.new.lastName} is now ${payload.new.role}`
            );
          }
          break;
      }
    });

    return () => {
      realtimeManager.unsubscribe(channelName);
    };
  }, []);

  const loadUsers = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      let query = supabase.from("User").select("*");

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

      const result = await query;
      if (result.error) throw new Error(result.error.message);
      setUsers(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
    refresh: loadUsers,
  };
}

// Combined real-time dashboard hook
export function useRealtimeDashboard() {
  const [dashboardData, setDashboardData] = useState({
    events: [],
    users: [],
    registrations: [],
    payments: [],
    stats: {
      eventsCount: 0,
      usersCount: 0,
      registrationsCount: 0,
      paymentsCount: 0,
      totalRevenue: 0,
      recentActivity: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [eventsResult, usersResult, registrationsResult, paymentsResult] = await Promise.all([
        supabase.from("Event").select("*").limit(10),
        supabase.from("User").select("*").limit(10),
        supabase.from("Registration").select("*").limit(10),
        supabase.from("Payment").select("*").limit(10),
      ]);

      const events = eventsResult.data || [];
      const users = usersResult.data || [];
      const registrations = registrationsResult.data || [];
      const payments = paymentsResult.data || [];

      const totalRevenue = payments
        .filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      setDashboardData({
        events,
        users,
        registrations,
        payments,
        stats: {
          eventsCount: events.length,
          usersCount: users.length,
          registrationsCount: registrations.length,
          paymentsCount: payments.length,
          totalRevenue,
          recentActivity: [
            ...registrations
              .slice(0, 5)
              .map((r) => ({ type: "registration", data: r, timestamp: new Date(r.createdAt) })),
            ...payments
              .slice(0, 5)
              .map((p) => ({ type: "payment", data: p, timestamp: new Date(p.createdAt) })),
          ]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10),
        },
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Setup real-time subscriptions for all tables
    const channels = [
      realtimeManager.subscribeToTable("Event", "*", () => loadDashboardData()),
      realtimeManager.subscribeToTable("User", "*", () => loadDashboardData()),
      realtimeManager.subscribeToTable("Registration", "*", () => loadDashboardData()),
      realtimeManager.subscribeToTable("Payment", "*", () => loadDashboardData()),
    ];

    return () => {
      channels.forEach((channel) => realtimeManager.unsubscribe(channel));
    };
  }, [loadDashboardData]);

  return {
    ...dashboardData,
    loading,
    lastUpdated,
    refresh: loadDashboardData,
  };
}
