"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/consolidated-auth";

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuthGuard({
  redirectTo = "/login",
  requireAuth = true,
}: UseAuthGuardOptions = {}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to prevent flash of loading state
    const timeoutId = setTimeout(() => {
      if (!isLoading) {
        if (requireAuth && !isAuthenticated) {
          router.push(redirectTo);
        } else if (!requireAuth && isAuthenticated && redirectTo === "/login") {
          router.push("/dashboard");
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, router, redirectTo, requireAuth]);

  return {
    isAuthenticated,
    isLoading,
    shouldRender: !isLoading && (requireAuth ? isAuthenticated : true),
  };
}
