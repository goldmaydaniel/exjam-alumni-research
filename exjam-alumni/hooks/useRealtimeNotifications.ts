"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useNotificationStore } from "@/lib/notifications";
import { toast } from "sonner";

interface UseRealtimeNotificationsOptions {
  userId?: string;
  enableSound?: boolean;
  enableToasts?: boolean;
  enableBrowserNotifications?: boolean;
  autoConnect?: boolean;
}

export function useRealtimeNotifications({
  userId,
  enableSound = true,
  enableToasts = true,
  enableBrowserNotifications = true,
  autoConnect = true,
}: UseRealtimeNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Audio for notification sounds
  const playNotificationSound = useCallback(() => {
    if (!enableSound) return;

    try {
      // Create a subtle notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }, [enableSound]);

  // Send browser notification
  const sendBrowserNotification = useCallback(
    async (title: string, body: string, options: NotificationOptions = {}) => {
      if (!enableBrowserNotifications) return;

      // Request permission if not already granted
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      if (Notification.permission === "granted") {
        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "exjam-notification", // This replaces previous notifications
          ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      }
    },
    [enableBrowserNotifications]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId || ws.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      const websocket = new WebSocket(`${wsUrl}/notifications?userId=${userId}`);

      websocket.onopen = () => {
        console.log("📡 Real-time notifications connected");
        setIsConnected(true);
        setConnectionAttempts(0);

        // Start heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }

        heartbeatInterval.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // Ping every 30 seconds

        // Show success toast
        if (enableToasts) {
          toast.success("Connected to real-time notifications", {
            duration: 2000,
            position: "bottom-right",
          });
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different message types
          switch (data.type) {
            case "notification":
              const notification = data.payload;

              // Add to store
              addNotification({
                type: notification.type,
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
                actionLabel: notification.actionLabel,
                metadata: notification.metadata,
              });

              // Play sound
              playNotificationSound();

              // Show browser notification
              sendBrowserNotification(notification.title, notification.message, {
                data: { actionUrl: notification.actionUrl },
              });

              // Show toast
              if (enableToasts) {
                toast(notification.title, {
                  description: notification.message,
                  duration: 4000,
                  position: "bottom-right",
                  action: notification.actionUrl
                    ? {
                        label: notification.actionLabel || "View",
                        onClick: () => window.open(notification.actionUrl, "_blank"),
                      }
                    : undefined,
                });
              }
              break;

            case "pong":
              // Heartbeat response - connection is alive
              break;

            case "error":
              console.error("WebSocket error:", data.message);
              if (enableToasts) {
                toast.error("Notification service error", {
                  description: data.message,
                  duration: 3000,
                });
              }
              break;

            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);

        if (enableToasts) {
          toast.error("Connection error", {
            description: "Failed to connect to notification service",
            duration: 3000,
          });
        }
      };

      websocket.onclose = (event) => {
        console.log("📡 Real-time notifications disconnected", event.code, event.reason);
        setIsConnected(false);

        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Attempt reconnection if it wasn't a manual close
        if (event.code !== 1000 && connectionAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
          console.log(`Reconnecting in ${delay}ms...`);

          reconnectTimeout.current = setTimeout(() => {
            setConnectionAttempts((prev) => prev + 1);
            connect();
          }, delay);
        } else if (connectionAttempts >= 5) {
          if (enableToasts) {
            toast.error("Connection lost", {
              description: "Unable to reconnect to notification service",
              duration: 5000,
            });
          }
        }
      };

      ws.current = websocket;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setIsConnected(false);
    }
  }, [
    userId,
    connectionAttempts,
    addNotification,
    playNotificationSound,
    sendBrowserNotification,
    enableToasts,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, "Manual disconnect");
      ws.current = null;
    }

    setIsConnected(false);
    setConnectionAttempts(0);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Auto-connect when userId is available
  useEffect(() => {
    if (autoConnect && userId && !ws.current) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    connectionAttempts,
  };
}
