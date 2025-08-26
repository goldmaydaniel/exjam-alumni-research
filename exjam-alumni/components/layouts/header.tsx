"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { Logo } from "@/components/ui/logo";
import { GlobalSearch } from "@/components/global-search";
import NotificationCenter from "@/components/notifications/notification-center";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Events", href: "/events" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mainLogo, siteName, loading: configLoading } = useSiteConfig();

  const isAdmin = profile?.role === "ADMIN" || profile?.role === "ORGANIZER";

  useEffect(() => {
    // Initialize auth state asynchronously to avoid SSR issues
    const checkAuth = async () => {
      try {
        // For now, just set loading to false to avoid blocking
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsAuthenticated(false);
      setProfile(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center">
        <div className="mr-4 flex md:mr-8">
          <Link href="/" className="mr-6 flex items-center space-x-3">
            <Logo
              src={mainLogo}
              alt={`${siteName} Logo`}
              width={48}
              height={48}
              className="rounded-lg shadow-sm"
              priority={true}
            />
            <div className="block">
              <span className="block text-base font-bold sm:text-lg">{siteName}</span>
              <span className="block hidden text-xs italic text-muted-foreground sm:block">
                Strive to Excel
              </span>
            </div>
          </Link>
        </div>
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            {isAuthenticated && <NotificationCenter />}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/supabase">
                          <Database className="mr-2 h-4 w-4" />
                          Database
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/alumni/directory">
                      <User className="mr-2 h-4 w-4" />
                      Alumni Directory
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/alumni/profile">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="ml-auto inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Open main menu</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Enhanced Mobile menu with overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile menu panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-sm bg-white shadow-2xl md:hidden">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Logo
                    src={mainLogo}
                    alt={`${siteName} Logo`}
                    width={32}
                    height={32}
                    className="rounded-md"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-white">{siteName}</h2>
                    <p className="text-xs text-blue-100">Alumni Network</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200",
                        pathname === item.href
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name === "Home" && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                      {item.name === "About" && (
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                      {item.name === "Events" && (
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                      )}
                      {item.name === "Contact" && (
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                      )}
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Search */}
                <div className="mt-6">
                  <GlobalSearch />
                </div>

                {/* User section */}
                <div className="mt-8">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-gray-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Dashboard
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        My Dashboard
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Database className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg"
                        asChild
                      >
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 w-full rounded-xl border-2 font-semibold"
                        asChild
                      >
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          Join Alumni Network
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t bg-gray-50 px-6 py-4">
                <p className="text-center text-xs text-gray-500">© 2025 The ExJAM Association</p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
