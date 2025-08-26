"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50 to-white">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-900">Something went wrong!</h2>
        <p className="mb-6 text-gray-600">We encountered an error while loading this page.</p>
        <Button onClick={() => reset()} className="bg-red-600 hover:bg-red-700">
          Try again
        </Button>
      </div>
    </div>
  );
}
