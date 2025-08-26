"use client";

import { ErrorUI } from "@/components/ui/enhanced-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <ErrorUI
        error={error}
        title="Oops! Something went wrong"
        description="We encountered an unexpected error. Our team has been notified and we're working to fix it."
        onRetry={reset}
        showSupport={true}
        className="min-h-screen"
      />
    </div>
  );
}
