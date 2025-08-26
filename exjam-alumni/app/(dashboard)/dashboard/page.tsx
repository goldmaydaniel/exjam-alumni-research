"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import {
  User,
  Calendar,
  Award,
  Download,
  Share2,
  Bell,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Star,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Registration {
  id: string;
  status: "PENDING" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  ticketType: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    venue: string;
    status: "UPCOMING" | "ONGOING" | "COMPLETED";
  };
}

interface UserBadge {
  id: string;
  title: string;
  description: string;
  category: "ATTENDANCE" | "ACHIEVEMENT" | "MILESTONE" | "SPECIAL";
  imageUrl?: string;
  earnedAt: string;
  event?: {
    title: string;
    date: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();
  const breadcrumbItems = useBreadcrumbs(pathname);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
    totalBadges: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    loadUserData();
  }, [isAuthenticated, router]);

  const loadUserData = async () => {
    try {
      // Load user registrations and badges
      const [registrationsRes, badgesRes] = await Promise.allSettled([
        fetch(`/api/user/registrations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/user/badges`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let userRegistrations: Registration[] = [];
      let userBadges: UserBadge[] = [];

      // Handle registrations response
      if (registrationsRes.status === "fulfilled" && registrationsRes.value.ok) {
        const data = await registrationsRes.value.json();

        // Transform API data to match component interface
        userRegistrations = data.map((reg: any) => ({
          id: reg.id,
          status: reg.status,
          ticketType: reg.ticketType,
          createdAt: reg.createdAt,
          event: {
            id: reg.Event.id,
            title: reg.Event.title,
            startDate: reg.Event.startDate,
            venue: reg.Event.venue,
            status: reg.Event.status,
          },
        }));
      } else {
        console.warn("Failed to load registrations:", registrationsRes);
      }

      // Handle badges response
      if (badgesRes.status === "fulfilled" && badgesRes.value.ok) {
        const data = await badgesRes.value.json();
        userBadges = data;
      } else {
        console.warn("Failed to load badges (API may not exist):", badgesRes);
        // For now, create some default badges based on user data if no badges API exists
        userBadges = createDefaultBadges();
      }

      setRegistrations(userRegistrations);
      setBadges(userBadges);

      // Calculate stats from real data
      setStats({
        totalEvents: userRegistrations.length,
        completedEvents: userRegistrations.filter((r) => r.event.status === "COMPLETED").length,
        upcomingEvents: userRegistrations.filter((r) => r.event.status === "UPCOMING").length,
        totalBadges: userBadges.length,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Create default badges based on user activity when badges API doesn't exist
  const createDefaultBadges = (): UserBadge[] => {
    const defaultBadges: UserBadge[] = [];

    if (user) {
      // Verified Alumni badge for all users
      defaultBadges.push({
        id: "verified-alumni",
        title: "Verified Alumni",
        description: "Successfully verified AFMS alumni status",
        category: "ACHIEVEMENT",
        earnedAt: new Date().toISOString(),
      });

      // Early Adopter badge for all platform members
      defaultBadges.push({
        id: "early-adopter",
        title: "Early Adopter",
        description: "Among the early members to join the platform",
        category: "MILESTONE",
        earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return defaultBadges;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case "ATTENDANCE":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "ACHIEVEMENT":
        return <Award className="h-5 w-5 text-blue-500" />;
      case "MILESTONE":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "SPECIAL":
        return <Trophy className="h-5 w-5 text-purple-500" />;
      default:
        return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case "ATTENDANCE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ACHIEVEMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MILESTONE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SPECIAL":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Please Sign In</h2>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  const completionRate =
    stats.totalEvents > 0 ? (stats.completedEvents / stats.totalEvents) * 100 : 0;

  return (
    <div className="container space-y-8 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Welcome Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.firstName}! 👋</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your events and achievements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{stats.totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600">All time</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Next event in{" "}
              {Math.ceil(
                (new Date(
                  registrations.find((r) => r.event.status === "UPCOMING")?.event.startDate || 0
                ).getTime() -
                  Date.now()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Badges Earned</p>
                <p className="text-3xl font-bold">{stats.totalBadges}</p>
              </div>
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2 text-sm">
              <span className="text-yellow-600">Latest: {badges[0]?.title}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="badges">My Badges</TabsTrigger>
          <TabsTrigger value="achievements">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest events and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {badges.slice(0, 3).map((badge) => (
                  <div key={badge.id} className="flex items-center gap-3">
                    {getBadgeIcon(badge.category)}
                    <div className="flex-1">
                      <p className="font-medium">{badge.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Earned {formatDate(badge.earnedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={getBadgeColor(badge.category)}>
                      {badge.category}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Events you're registered for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {registrations
                  .filter((r) => r.event.status === "UPCOMING")
                  .map((registration) => (
                    <div key={registration.id} className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{registration.event.title}</h3>
                        <Badge variant="secondary">{registration.ticketType}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(registration.event.startDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {registration.event.venue.split(",")[0]}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Calendar className="mr-2 h-3 w-3" />
                          Add to Calendar
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="space-y-4">
            {registrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{registration.event.title}</h3>
                        <Badge
                          variant={registration.status === "ATTENDED" ? "default" : "secondary"}
                        >
                          {registration.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(registration.event.startDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {registration.event.venue}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {registration.ticketType}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {registration.status === "ATTENDED" && (
                        <Button size="sm" variant="outline">
                          <Download className="mr-2 h-3 w-3" />
                          Certificate
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {/* Badge Showcase */}
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-bold">Achievement Gallery</h2>
            <p className="mb-4 text-muted-foreground">
              Showcase your accomplishments and milestones
            </p>
            <div className="flex gap-2">
              <Button size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share Achievements
              </Button>
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <Card key={badge.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                <div
                  className={`h-4 ${getBadgeColor(badge.category).replace("text-", "bg-").replace("border-", "bg-")}`}
                ></div>
                <CardContent className="p-6">
                  <div className="mb-3 flex items-center gap-3">
                    {getBadgeIcon(badge.category)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{badge.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Earned {formatDate(badge.earnedAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{badge.description}</p>
                  {badge.event && (
                    <div className="rounded bg-gray-50 p-2 text-xs text-muted-foreground">
                      <strong>{badge.event.title}</strong> • {badge.event.date}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="mr-2 h-3 w-3" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="mr-2 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
                <CardDescription>Track your journey and unlock new milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Event Attendance</span>
                    <span>{stats.completedEvents}/10 events</span>
                  </div>
                  <Progress value={(stats.completedEvents / 10) * 100} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {10 - stats.completedEvents} more events to unlock "Frequent Attendee" badge
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Badge Collection</span>
                    <span>{stats.totalBadges}/15 badges</span>
                  </div>
                  <Progress value={(stats.totalBadges / 15) * 100} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {15 - stats.totalBadges} more badges to unlock "Badge Collector" achievement
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Alumni Network</span>
                    <span>25/100 connections</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    75 more connections to unlock "Super Networker" badge
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Achievements</CardTitle>
                <CardDescription>Upcoming milestones you can unlock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4 opacity-75">
                    <div className="mb-2 flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-600">Frequent Attendee</h4>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Attend 10 events to unlock this badge
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Progress: {stats.completedEvents}/10 events
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 opacity-75">
                    <div className="mb-2 flex items-center gap-3">
                      <Star className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-600">Badge Collector</h4>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Collect 15 different badges to show your dedication
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Progress: {stats.totalBadges}/15 badges
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
