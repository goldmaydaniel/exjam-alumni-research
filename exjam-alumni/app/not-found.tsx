"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search, AlertCircle, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useSiteConfig } from "@/hooks/useSiteConfig";

export default function NotFound() {
  const { mainLogo, siteName, primaryColor, secondaryColor } = useSiteConfig();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo
            src={mainLogo}
            alt={`${siteName} Logo`}
            width={80}
            height={80}
            className="rounded-2xl shadow-xl"
            priority={true}
          />
        </div>

        {/* 404 Graphics */}
        <div className="relative">
          <div
            className="bg-gradient-to-r bg-clip-text text-8xl font-black text-transparent"
            style={{
              backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            404
          </div>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-2 transform">
            <AlertCircle className="h-6 w-6 animate-bounce text-orange-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
          <p className="leading-relaxed text-gray-600">
            Oops! The page you're looking for seems to have taken an unexpected flight path. Don't
            worry, even the best pilots sometimes need to course-correct.
          </p>
        </div>

        {/* Suggested Actions */}
        <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-lg">
          <h3 className="flex items-center justify-center gap-2 font-semibold text-gray-900">
            <Search className="h-4 w-4" />
            What would you like to do?
          </h3>

          <div className="grid gap-3">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full justify-start" size="lg">
              <Link href="/events">
                <Calendar className="mr-2 h-4 w-4" />
                View Events
              </Link>
            </Button>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-400">© 2025 {siteName} • Strive to Excel</p>
        </div>
      </div>
    </div>
  );
}
