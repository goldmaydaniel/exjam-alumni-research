"use client";

import { useState, useEffect } from "react";
import { SafeLink as Link } from "@/components/SafeLink";
import { Menu, X, User, Settings, LogOut, LayoutDashboard, Bell, Search } from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/store/consolidated-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isAuthenticated: boolean;
  onLogout: () => void;
}

function MobileNavigation({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  onLogout,
}: MobileNavigationProps) {
  const navigationLinks = [
    { href: "/", label: "Home", emoji: "🏠" },
    { href: "/alumni", label: "Alumni", emoji: "🎓" },
    { href: "/events", label: "Events", emoji: "📅" },
    { href: "/about", label: "About", emoji: "ℹ️" },
    { href: "/contact", label: "Contact", emoji: "📧" },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Mobile menu panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-sm transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Logo
                src="/exjam-logo.svg"
                alt="EXJAM Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
              <div>
                <h2 className="text-sm font-bold text-white">EXJAM Association</h2>
                <p className="text-xs text-blue-100">Alumni Network</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User section - if authenticated */}
          {isAuthenticated && user && (
            <div className="border-b bg-gray-50 px-6 py-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profilePhotoUrl} />
                  <AvatarFallback className="bg-blue-100 text-sm font-bold text-blue-600">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              {user.role === "ADMIN" && (
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <nav className="space-y-2">
              {navigationLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                  onClick={onClose}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Authenticated user actions */}
            {isAuthenticated && user && (
              <div className="mt-8 space-y-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={onClose}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={onClose}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    <Settings className="h-4 w-4" />
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Guest actions */}
            {!isAuthenticated && (
              <div className="mt-8 space-y-3">
                <Button
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg"
                  asChild
                >
                  <Link href="/login" onClick={onClose}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-2 font-semibold"
                  asChild
                >
                  <Link href="/register" onClick={onClose}>
                    Join Alumni Network
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <p className="text-center text-xs text-gray-500">© 2025 The EXJAM Association</p>
            <p className="mt-1 text-center text-xs text-gray-400">Strive to Excel</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileOptimizedHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [daysToEvent, setDaysToEvent] = useState(0);
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const safeMainLogo = "/exjam-logo.svg";
  const safeSiteName = "The EXJAM Association";

  useEffect(() => {
    setIsMounted(true);
    const eventDate = new Date("2025-11-28");
    const today = new Date();
    const timeDiff = eventDate.getTime() - today.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    setDaysToEvent(days > 0 ? days : 0);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const showAuthContent = isMounted && isAuthenticated;

  return (
    <>
      {/* Event Banner - Clean and Mobile-Optimized */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 py-2 text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Event info */}
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <div className="flex flex-col">
                <span className="font-bold text-white sm:text-sm">PG Conference 2025</span>
                <span className="text-xs text-blue-100">Nov 28-30 • Abuja</span>
              </div>
            </div>
            
            {/* Right side - CTA and countdown */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-xs text-blue-200">Countdown</div>
                <div className="font-bold text-white text-sm">
                  {isMounted ? `${daysToEvent}d` : "..."}
                </div>
              </div>
              <Link
                href="/events"
                className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-blue-900 transition-all hover:bg-blue-50"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b bg-white bg-opacity-95 shadow-sm backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Responsive sizing */}
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
              <Logo
                src={safeMainLogo}
                alt={`${safeSiteName} Logo`}
                width={40}
                height={40}
                className="rounded-lg shadow-md sm:h-12 sm:w-12"
                fallbackEmoji="🎓"
                priority={true}
              />
              <div className="hidden sm:block">
                <h1 className="text-base font-black text-blue-600 sm:text-lg">{safeSiteName}</h1>
                <p className="hidden text-xs italic text-gray-600 md:block">Strive to Excel</p>
              </div>
            </Link>

            {/* Mobile: Auth status and menu toggle */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Quick auth indicator */}
              {showAuthContent && user && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.profilePhotoUrl} />
                    <AvatarFallback className="bg-blue-100 text-xs text-blue-600">
                      {user.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-20 truncate text-sm text-gray-600">{user.firstName}</span>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                className="rounded-md p-2 transition-colors hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden sm:flex sm:items-center sm:gap-6">
              <nav className="flex items-center gap-4">
                <Link
                  href="/"
                  className="px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                >
                  Home
                </Link>
                <Link
                  href="/events"
                  className="px-3 py-2 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
                >
                  PG Conference
                </Link>
                <Link
                  href="/alumni"
                  className="px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                >
                  Alumni
                </Link>
                <Link
                  href="/about"
                  className="px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                >
                  Contact
                </Link>
              </nav>

              {/* Desktop Auth Section */}
              <div className="flex items-center gap-2">
                {showAuthContent && user ? (
                  <>
                    <Link
                      href="/events"
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                      Register for PG&apos;25
                    </Link>

                    {/* User menu would go here - simplified for mobile focus */}
                    <Link
                      href="/dashboard"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : isMounted ? (
                  <>
                    <Link
                      href="/login"
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      Join Alumni
                    </Link>
                  </>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        isAuthenticated={showAuthContent}
        onLogout={handleLogout}
      />
    </>
  );
}
