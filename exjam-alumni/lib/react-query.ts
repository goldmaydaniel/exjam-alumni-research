import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createApiClient } from "./error-handling";

// Configure React Query client with optimal defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time - data stays in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch when coming back online
      refetchOnReconnect: true,
      // Background refetch interval (5 minutes)
      refetchInterval: 5 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// API client with error handling
const api = createApiClient("/api");

// Generic API hooks
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number | false;
    select?: (data: any) => T;
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: () => api.get(endpoint),
    ...options,
  });
}

export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
    invalidateQueries?: string[][];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) => {
      switch (method) {
        case "POST":
          return api.post(endpoint, variables);
        case "PUT":
          return api.put(endpoint, variables);
        case "DELETE":
          return api.delete(endpoint);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

// Specific API hooks for the app
export const useEvents = (filters?: { status?: string; search?: string }) => {
  const queryKey = ["events", filters];
  const endpoint = `/events${filters ? `?${new URLSearchParams(filters)}` : ""}`;

  return useApiQuery(queryKey, endpoint, {
    staleTime: 2 * 60 * 1000, // Events are fresh for 2 minutes
    select: (data) => data.events || data,
  });
};

export const useEvent = (eventId: string) => {
  return useApiQuery(["events", eventId], `/events/${eventId}`, {
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useEventRegistrations = (eventId: string) => {
  return useApiQuery(["events", eventId, "registrations"], `/events/${eventId}/registrations`, {
    enabled: !!eventId,
    staleTime: 30 * 1000, // Registration data is more dynamic
  });
};

export const useUserProfile = (userId?: string) => {
  return useApiQuery(["users", userId || "me"], userId ? `/users/${userId}` : "/auth/profile", {
    enabled: true,
    staleTime: 10 * 60 * 1000, // Profile data is relatively stable
  });
};

export const useUserRegistrations = () => {
  return useApiQuery(["registrations"], "/registrations", {
    staleTime: 60 * 1000, // User's registrations change less frequently
  });
};

export const useDashboardStats = () => {
  return useApiQuery(["dashboard", "stats"], "/analytics", {
    staleTime: 2 * 60 * 1000, // Stats update every 2 minutes
    refetchInterval: 2 * 60 * 1000,
  });
};

// Mutation hooks
export const useRegisterForEvent = () => {
  return useApiMutation<any, { eventId: string; ticketType: string; userData: any }>(
    "/registrations",
    "POST",
    {
      invalidateQueries: [["events"], ["registrations"], ["dashboard", "stats"]],
    }
  );
};

export const useUpdateProfile = () => {
  return useApiMutation<any, any>("/auth/profile", "PUT", {
    invalidateQueries: [["users", "me"]],
  });
};

export const useCreateEvent = () => {
  return useApiMutation<any, any>("/events", "POST", {
    invalidateQueries: [["events"]],
  });
};

export const useUpdateEvent = (eventId: string) => {
  return useApiMutation<any, any>(`/events/${eventId}`, "PUT", {
    invalidateQueries: [["events"], ["events", eventId]],
  });
};

export const useDeleteEvent = () => {
  return useApiMutation<any, { eventId: string }>("", "DELETE", {
    mutationFn: ({ eventId }) => api.delete(`/events/${eventId}`),
    invalidateQueries: [["events"]],
  });
};

// Optimistic updates for better UX
export const useOptimisticRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: { eventId: string; ticketType: string; userData: any }) => {
      // Optimistically update the UI
      const previousRegistrations = queryClient.getQueryData(["registrations"]);
      const previousEvents = queryClient.getQueryData(["events"]);

      // Add optimistic registration
      const optimisticRegistration = {
        id: `temp-${Date.now()}`,
        eventId: variables.eventId,
        status: "pending",
        ticketType: variables.ticketType,
        createdAt: new Date().toISOString(),
        ...variables.userData,
      };

      queryClient.setQueryData(["registrations"], (old: any) => [
        optimisticRegistration,
        ...(old || []),
      ]);

      // Update event registration count
      queryClient.setQueryData(["events"], (old: any) =>
        old?.map((event: any) =>
          event.id === variables.eventId
            ? { ...event, _count: { registrations: event._count.registrations + 1 } }
            : event
        )
      );

      try {
        // Make the actual API call
        const response = await api.post("/registrations", variables);

        // Update with real data
        queryClient.setQueryData(["registrations"], (old: any) =>
          old?.map((reg: any) => (reg.id === optimisticRegistration.id ? response : reg))
        );

        return response;
      } catch (error) {
        // Revert optimistic updates on error
        queryClient.setQueryData(["registrations"], previousRegistrations);
        queryClient.setQueryData(["events"], previousEvents);
        throw error;
      }
    },
  });
};

// Infinite query for large datasets
export const useInfiniteEvents = (filters?: any) => {
  return useQuery({
    queryKey: ["events", "infinite", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "10",
        ...filters,
      });
      return api.get(`/events?${params}`);
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.hasMore) {
        return pages.length + 1;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Background sync for offline support
export const useBackgroundSync = () => {
  const queryClient = useQueryClient();

  const syncOfflineData = async () => {
    // Get offline mutations from storage
    const offlineData = JSON.parse(localStorage.getItem("offline-mutations") || "[]");

    for (const mutation of offlineData) {
      try {
        await api.request(mutation.endpoint, mutation.options);

        // Remove from offline storage after successful sync
        const remaining = offlineData.filter((m: any) => m.id !== mutation.id);
        localStorage.setItem("offline-mutations", JSON.stringify(remaining));

        // Invalidate related queries
        if (mutation.invalidateQueries) {
          mutation.invalidateQueries.forEach((queryKey: string[]) => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      } catch (error) {
        console.error("Failed to sync offline mutation:", error);
      }
    }
  };

  // Sync when coming back online
  if (typeof window !== "undefined") {
    window.addEventListener("online", syncOfflineData);
  }

  return { syncOfflineData };
};

// Prefetch utilities
export const prefetchEvent = (eventId: string) => {
  return queryClient.prefetchQuery({
    queryKey: ["events", eventId],
    queryFn: () => api.get(`/events/${eventId}`),
    staleTime: 5 * 60 * 1000,
  });
};

export const prefetchUserData = () => {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["users", "me"],
      queryFn: () => api.get("/auth/profile"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["registrations"],
      queryFn: () => api.get("/registrations"),
    }),
  ]);
};

// Cache management
export const clearUserCache = () => {
  queryClient.removeQueries({ queryKey: ["users"] });
  queryClient.removeQueries({ queryKey: ["registrations"] });
  queryClient.removeQueries({ queryKey: ["dashboard"] });
};

export const refreshAllQueries = () => {
  return queryClient.refetchQueries();
};
