import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";

export type NotificationType = "info" | "success" | "warning" | "error" | "event" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));

        // Show toast based on type
        const toastOptions = {
          duration: 5000,
          position: "top-right" as const,
          style: {
            maxWidth: "400px",
          },
        };

        switch (notification.type) {
          case "success":
            toast.success(notification.message, toastOptions);
            break;
          case "error":
            toast.error(notification.message, toastOptions);
            break;
          case "warning":
            toast(notification.message, {
              ...toastOptions,
              icon: "⚠️",
            });
            break;
          default:
            toast(notification.message, toastOptions);
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Keep only last 50
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Push notification utilities
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function sendBrowserNotification(
  title: string,
  body: string,
  options?: NotificationOptions
) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/exjam-logo.png",
      badge: "/badge.png",
      vibrate: [200, 100, 200],
      ...options,
    });

    notification.onclick = function (event) {
      event.preventDefault();
      window.focus();
      notification.close();
    };

    return notification;
  }
}

// Email notification service
export async function sendEmailNotification(
  to: string,
  subject: string,
  template: string,
  data: any
) {
  try {
    const response = await fetch("/api/notifications/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        template,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email notification");
    }

    return await response.json();
  } catch (error) {
    console.error("Email notification error:", error);
    throw error;
  }
}

// SMS notification service
export async function sendSMSNotification(to: string, message: string) {
  try {
    const response = await fetch("/api/notifications/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send SMS notification");
    }

    return await response.json();
  } catch (error) {
    console.error("SMS notification error:", error);
    throw error;
  }
}

// WebSocket for real-time notifications
export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://api.exjam-alumni.org";
    this.ws = new WebSocket(`${wsUrl}/notifications?userId=${userId}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        useNotificationStore.getState().addNotification(notification);
      } catch (error) {
        console.error("Failed to parse notification:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.reconnect(userId);
    };
  }

  private reconnect(userId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect(userId);
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
