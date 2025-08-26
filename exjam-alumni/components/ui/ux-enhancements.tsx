"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Contrast,
  Zap,
  Settings,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Network status indicator
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showNotification) return null;

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 rounded-lg p-3 shadow-lg transition-all duration-300",
        isOnline ? "bg-green-500 text-white" : "bg-red-500 text-white"
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isOnline ? "Back online" : "No internet connection"}
        </span>
      </div>
    </div>
  );
}

// Toast notification system
interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          className={cn(
            "animate-in slide-in-from-right min-w-80 shadow-lg transition-all duration-300",
            toast.type === "success" && "border-green-200 bg-green-50",
            toast.type === "error" && "border-red-200 bg-red-50",
            toast.type === "warning" && "border-yellow-200 bg-yellow-50",
            toast.type === "info" && "border-blue-200 bg-blue-50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    toast.type === "success" && "text-green-800",
                    toast.type === "error" && "text-red-800",
                    toast.type === "warning" && "text-yellow-800",
                    toast.type === "info" && "text-blue-800"
                  )}
                >
                  {toast.title}
                </h4>
                {toast.message && (
                  <p
                    className={cn(
                      "mt-1 text-sm",
                      toast.type === "success" && "text-green-700",
                      toast.type === "error" && "text-red-700",
                      toast.type === "warning" && "text-yellow-700",
                      toast.type === "info" && "text-blue-700"
                    )}
                  >
                    {toast.message}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onRemove(toast.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Accessibility preferences panel
export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    soundEnabled: true,
  });

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem("accessibility-preferences");
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem("accessibility-preferences", JSON.stringify(preferences));

    // Apply preferences
    document.documentElement.classList.toggle("high-contrast", preferences.highContrast);
    document.documentElement.classList.toggle("large-text", preferences.largeText);
    document.documentElement.classList.toggle("reduce-motion", preferences.reducedMotion);
  }, [preferences]);

  const updatePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Accessibility toggle button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-40 bg-white shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Open accessibility settings"
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Accessibility Settings</span>
      </Button>

      {/* Accessibility panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />
          <Card className="fixed bottom-20 left-4 z-50 w-80 shadow-xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Accessibility Settings</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    <span className="text-sm">High Contrast</span>
                  </div>
                  <Button
                    variant={preferences.highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreference("highContrast")}
                  >
                    {preferences.highContrast ? "On" : "Off"}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Large Text</span>
                  </div>
                  <Button
                    variant={preferences.largeText ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreference("largeText")}
                  >
                    {preferences.largeText ? "On" : "Off"}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Reduced Motion</span>
                  </div>
                  <Button
                    variant={preferences.reducedMotion ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreference("reducedMotion")}
                  >
                    {preferences.reducedMotion ? "On" : "Off"}
                  </Button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {preferences.soundEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    <span className="text-sm">Sound Effects</span>
                  </div>
                  <Button
                    variant={preferences.soundEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => updatePreference("soundEnabled")}
                  >
                    {preferences.soundEnabled ? "On" : "Off"}
                  </Button>
                </label>
              </div>

              <div className="mt-6 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  These settings are saved locally and will persist across sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

// Performance indicator
export function PerformanceIndicator() {
  const [metrics, setMetrics] = useState<{
    loading: boolean;
    performance: "good" | "fair" | "poor";
  }>({ loading: true, performance: "good" });

  useEffect(() => {
    // Simulate performance calculation
    setTimeout(() => {
      const connectionType = (navigator as any)?.connection?.effectiveType || "4g";
      let performance: "good" | "fair" | "poor" = "good";

      if (connectionType === "slow-2g" || connectionType === "2g") {
        performance = "poor";
      } else if (connectionType === "3g") {
        performance = "fair";
      }

      setMetrics({ loading: false, performance });
    }, 1000);
  }, []);

  if (metrics.loading) return null;

  return (
    <div className="fixed left-4 top-4 z-40">
      <Badge
        variant={
          metrics.performance === "good"
            ? "default"
            : metrics.performance === "fair"
              ? "secondary"
              : "destructive"
        }
        className="text-xs"
      >
        Connection: {metrics.performance}
      </Badge>
    </div>
  );
}

// Smart loading state that adapts to connection speed
export function SmartLoadingState({
  isLoading,
  children,
  fallback,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Show skeleton after a short delay to avoid flash
      const timer = setTimeout(() => setShowSkeleton(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading]);

  if (isLoading && showSkeleton) {
    return fallback || <div className="h-8 w-full animate-pulse rounded bg-gray-200" />;
  }

  return <>{children}</>;
}

// Quick actions floating button
export function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Sun, label: "Toggle theme", action: () => console.log("toggle theme") },
    { icon: Zap, label: "Quick register", href: "/register" },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {isExpanded && (
        <div className="mb-2 space-y-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              className="w-full justify-start shadow-lg"
              onClick={() => {
                if (action.action) action.action();
                if (action.href) window.location.href = action.href;
                setIsExpanded(false);
              }}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <Button
        variant="default"
        size="lg"
        className="rounded-full shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Zap className="h-5 w-5" />
      </Button>
    </div>
  );
}
