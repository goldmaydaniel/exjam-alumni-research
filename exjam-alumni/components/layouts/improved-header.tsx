"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Shield,
  ChevronDown,
  Ticket,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Events", href: "/events" },
  { name: "Contact", href: "/contact" },
];

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "ORGANIZER" | "SPEAKER" | "VERIFIED_MEMBER" | "GUEST_MEMBER";
  profilePhoto?: string;
}

export function ImprovedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication on mount and when pathname changes
  useEffect(() => {
    checkAuth();
    // Listen for storage events (for multi-tab sync)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, [pathname]);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/");
    setMobileMenuOpen(false);
  };

  const roleColors = {
    ADMIN: "bg-purple-600",
    ORGANIZER: "bg-blue-600",
    SPEAKER: "bg-green-600",
    VERIFIED_MEMBER: "bg-blue-600",
    GUEST_MEMBER: "bg-orange-600",
  };

  const roleIcons = {
    ADMIN: Shield,
    ORGANIZER: Calendar,
    SPEAKER: User,
    VERIFIED_MEMBER: Shield,
    GUEST_MEMBER: Ticket,
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center">
        <div className="mr-4 flex md:mr-8">
          <Link href="/" className="mr-6 flex items-center space-x-3">
            <Image
              src="https://yzrzjagkkycmdwuhrvww.supabase.co/storage/v1/object/public/event-photos/logo/exjam-logo.png"
              alt="The EXJAM Association Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div className="hidden sm:block">
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent">
                The EXJAM Association
              </span>
              <span className="block text-xs italic text-muted-foreground">Strive to Excel</span>
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

          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    {/* Quick Dashboard Link */}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>

                    {/* User Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 px-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePhoto} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xs text-white">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden lg:flex lg:flex-col lg:items-start">
                            <span className="text-sm font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <Badge
                              className={cn("px-1 py-0 text-xs", roleColors[user.role])}
                              variant="secondary"
                            >
                              {user.role}
                            </Badge>
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>

                        {(user.role === "ADMIN" || user.role === "ORGANIZER") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href="/admin/checkin" className="cursor-pointer">
                                <Shield className="mr-2 h-4 w-4" />
                                Admin Panel
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuItem asChild>
                          <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="cursor-pointer text-red-600"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button
                      size="sm"
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <div className="mt-2 border-t pt-2">
              {user ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePhoto} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <Badge className={cn("text-xs", roleColors[user.role])} variant="secondary">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 inline h-4 w-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-2 inline h-4 w-4" />
                    Profile
                  </Link>

                  {(user.role === "ADMIN" || user.role === "ORGANIZER") && (
                    <Link
                      href="/admin/checkin"
                      className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="mr-2 inline h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 inline h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3 py-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button
                    className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
                    asChild
                  >
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
