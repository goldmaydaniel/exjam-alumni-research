"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestOnlyRoute({ children, redirectTo = "/dashboard" }: GuestOnlyRouteProps) {
  const { shouldRender, isLoading } = useAuthGuard({
    redirectTo,
    requireAuth: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
