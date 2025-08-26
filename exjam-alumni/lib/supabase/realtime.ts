import { createClient } from "./client";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Real-time subscription manager
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase = createClient();

  // Subscribe to table changes
  subscribeToTable(
    tableName: string,
    event: "INSERT" | "UPDATE" | "DELETE" | "*",
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    filter?: string
  ) {
    const channelName = `${tableName}_${event}_${Date.now()}`;

    const subscription = this.supabase.channel(channelName).on(
      "postgres_changes",
      {
        event,
        schema: "public",
        table: tableName,
        filter,
      },
      callback
    );

    // Subscribe to channel
    subscription.subscribe((status) => {
      console.log(`Real-time subscription for ${tableName}:`, status);
    });

    this.channels.set(channelName, subscription);
    return channelName;
  }

  // Unsubscribe from channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  // Subscribe to all table events
  subscribeToAllEvents(
    tableName: string,
    callbacks: {
      onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
      onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
    }
  ) {
    const channels: string[] = [];

    if (callbacks.onInsert) {
      channels.push(this.subscribeToTable(tableName, "INSERT", callbacks.onInsert));
    }
    if (callbacks.onUpdate) {
      channels.push(this.subscribeToTable(tableName, "UPDATE", callbacks.onUpdate));
    }
    if (callbacks.onDelete) {
      channels.push(this.subscribeToTable(tableName, "DELETE", callbacks.onDelete));
    }

    return channels;
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
    console.log("All real-time subscriptions cleaned up");
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Real-time hooks for specific tables
export const useRealtimeEvents = () => {
  return {
    subscribeToEvents: (callback: (payload: any) => void) => {
      return realtimeManager.subscribeToTable("Event", "*", callback);
    },
    subscribeToRegistrations: (callback: (payload: any) => void) => {
      return realtimeManager.subscribeToTable("Registration", "*", callback);
    },
    subscribeToPayments: (callback: (payload: any) => void) => {
      return realtimeManager.subscribeToTable("Payment", "*", callback);
    },
    subscribeToUsers: (callback: (payload: any) => void) => {
      return realtimeManager.subscribeToTable("User", "*", callback);
    },
  };
};

// Real-time notification system
export const createRealtimeNotifications = () => {
  const supabase = createClient();

  return {
    // Send real-time notification
    sendNotification: async (channel: string, event: string, payload: any) => {
      return supabase.channel(channel).send({
        type: "broadcast",
        event,
        payload,
      });
    },

    // Subscribe to notifications
    subscribeToNotifications: (
      channel: string,
      event: string,
      callback: (payload: any) => void
    ) => {
      return supabase.channel(channel).on("broadcast", { event }, callback).subscribe();
    },
  };
};

// Dashboard-specific real-time hooks
export const useDashboardRealtime = () => {
  return {
    // Live payment updates
    subscribeToPaymentUpdates: (callback: (data: any) => void) => {
      return realtimeManager.subscribeToAllEvents("Payment", {
        onInsert: (payload) => callback({ type: "payment_created", data: payload.new }),
        onUpdate: (payload) => callback({ type: "payment_updated", data: payload.new }),
      });
    },

    // Live registration updates
    subscribeToRegistrationUpdates: (callback: (data: any) => void) => {
      return realtimeManager.subscribeToAllEvents("Registration", {
        onInsert: (payload) => callback({ type: "registration_created", data: payload.new }),
        onUpdate: (payload) => callback({ type: "registration_updated", data: payload.new }),
      });
    },

    // Live event updates
    subscribeToEventUpdates: (callback: (data: any) => void) => {
      return realtimeManager.subscribeToAllEvents("Event", {
        onInsert: (payload) => callback({ type: "event_created", data: payload.new }),
        onUpdate: (payload) => callback({ type: "event_updated", data: payload.new }),
        onDelete: (payload) => callback({ type: "event_deleted", data: payload.old }),
      });
    },

    // Live user activity
    subscribeToUserActivity: (callback: (data: any) => void) => {
      return realtimeManager.subscribeToAllEvents("User", {
        onInsert: (payload) => callback({ type: "user_registered", data: payload.new }),
        onUpdate: (payload) => callback({ type: "user_updated", data: payload.new }),
      });
    },
  };
};

export default realtimeManager;
