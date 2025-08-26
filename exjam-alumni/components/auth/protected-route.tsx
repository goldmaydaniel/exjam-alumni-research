"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, redirectTo = "/login", fallback }: ProtectedRouteProps) {
  const { shouldRender, isLoading } = useAuthGuard({
    redirectTo,
    requireAuth: true,
  });

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}
