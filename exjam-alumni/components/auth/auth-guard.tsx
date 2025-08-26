"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/consolidated-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = "/login",
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, initialize } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (requireAdmin) {
      const isAdmin = 
        user?.role === "ADMIN" ||
        user?.email === "admin@exjam.org";
      
      if (!isAdmin) {
        router.push("/dashboard");
      }
    }
  }, [isInitialized, isLoading, isAuthenticated, user, requireAuth, requireAdmin, redirectTo, router]);

  // Show loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until auth check is complete
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAdmin) {
    const isAdmin = 
      user?.role === "ADMIN" ||
      user?.email === "admin@exjam.org";
    
    if (!isAdmin) {
      return null;
    }
  }

  return <>{children}</>;
}