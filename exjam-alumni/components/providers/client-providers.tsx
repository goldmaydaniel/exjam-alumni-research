"use client";

import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { FeedbackProvider } from "@/components/ui/feedback-system";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/store/consolidated-auth";

interface ClientProvidersProps {
  children: ReactNode;
}

// Enhanced error boundary for client-side hydration issues
function ClientHydrationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log hydration and context errors specifically
        if (
          error.message.includes("useContext") ||
          error.message.includes("hydration") ||
          error.message.includes("Hydration")
        ) {
          console.error("Client hydration error:", { error, errorInfo });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Auth initialization component
function AuthInitializer() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize().catch(console.error);
  }, [initialize]);

  return null;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by properly handling client-side rendering
  // This prevents the "Cannot read properties of undefined" error
  if (!isMounted) {
    // Return a minimal placeholder that matches server render structure
    return <ClientHydrationErrorBoundary>{children}</ClientHydrationErrorBoundary>;
  }

  return (
    <ClientHydrationErrorBoundary>
      <AuthInitializer />
      <FeedbackProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "14px",
              maxWidth: "500px",
            },
          }}
        />
      </FeedbackProvider>
    </ClientHydrationErrorBoundary>
  );
}
