"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/store/consolidated-auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, isLoading, refreshSession } = useAuth();

  useEffect(() => {
    // Initialize auth state on component mount
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Refresh session when app comes back into focus
    const handleFocus = () => {
      if (!document.hidden) {
        refreshSession();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSession();
      }
    };

    // Listen for window focus and visibility changes
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up periodic session refresh (every 30 minutes)
    const interval = setInterval(
      () => {
        refreshSession();
      },
      30 * 60 * 1000
    );

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [refreshSession]);

  // Show a minimal loading screen while initializing auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
