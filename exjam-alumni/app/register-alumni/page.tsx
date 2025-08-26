"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterAlumniRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main improved alumni registration form
    router.replace("/register-alumni-form");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Redirecting to alumni registration...</p>
      </div>
    </div>
  );
}
