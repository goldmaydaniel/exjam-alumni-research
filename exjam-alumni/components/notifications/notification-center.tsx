"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Trash2,
  Settings,
  Filter,
  Calendar,
  Users,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotificationStore,
  type Notification,
  type NotificationType,
} from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
  className?: string;
  showBadge?: boolean;
  maxHeight?: number;
}

export default function NotificationCenter({
  className,
  showBadge = true,
  maxHeight = 400,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(
    (notification) => filter === "all" || notification.type === filter
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get notification type icon
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "event":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get notification type color
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50";
      case "error":
        return "border-l-red-500 bg-red-50";
      case "warning":
        return "border-l-yellow-500 bg-yellow-50";
      case "event":
        return "border-l-blue-500 bg-blue-50";
      case "system":
        return "border-l-gray-500 bg-gray-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative rounded-full p-2 hover:bg-gray-100">
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-blue-600" />
            ) : (
              <Bell className="h-5 w-5" />
            )}

            {showBadge && unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 p-0 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-96 p-0"
          style={{ maxHeight: maxHeight + 100 }}
        >
          {/* Header */}
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilter("all")}>
                      All Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilter("event")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("system")}>
                      <Settings className="mr-2 h-4 w-4" />
                      System
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("success")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Success
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("warning")}>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Warnings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter("error")}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Errors
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="h-8 px-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea style={{ height: maxHeight }}>
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Bell className="mb-4 h-12 w-12 text-gray-300" />
                <h3 className="mb-1 font-medium text-gray-900">No notifications</h3>
                <p className="text-sm text-gray-500">
                  {filter === "all" ? "You're all caught up!" : `No ${filter} notifications found.`}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative mb-2 cursor-pointer rounded-lg border border-l-4 p-3 transition-all duration-200 hover:shadow-md",
                      getNotificationColor(notification.type),
                      !notification.read && "ring-1 ring-blue-200",
                      notification.read && "opacity-75"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <h4
                            className={cn(
                              "text-sm font-medium text-gray-900",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </h4>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </div>

                          {notification.actionUrl && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <ExternalLink className="h-3 w-3" />
                              {notification.actionLabel || "View"}
                            </div>
                          )}
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute right-3 top-3">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="border-t border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to notification settings
                    window.location.href = "/settings/notifications";
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
