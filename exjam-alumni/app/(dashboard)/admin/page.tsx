"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/lib/store/consolidated-auth";
import StorageAdmin from "@/components/admin/storage-manager";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Loader2,
  Download,
  Plus,
  QrCode,
  Settings,
  ClipboardList,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

interface Analytics {
  overview: {
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    checkInRate: number;
    conversionRate: number;
  };
  registrations: {
    byStatus: Array<{ status: string; _count: number }>;
    byTicketType: Array<{ ticketType: string; _count: number }>;
    recent: Array<{
      id: string;
      user: { firstName: string; lastName: string };
      event: { title: string };
      ticketType: string;
      createdAt: string;
    }>;
  };
  events: {
    stats: Array<{
      id: string;
      title: string;
      capacity: number;
      _count: { registrations: number };
    }>;
    topEvents: Array<{
      id: string;
      title: string;
      _count: { registrations: number };
    }>;
  };
  userGrowth: Array<{ date: string; count: number }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated } = useAuthStore();
  const breadcrumbItems = useBreadcrumbs(pathname);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "ADMIN" && user?.role !== "ORGANIZER") {
      router.push("/dashboard");
      toast.error("Admin access required");
      return;
    }

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast.error("Failed to load analytics");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    toast.success(`Exporting ${type} data...`);
    // Implementation would go here
  };

  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "ORGANIZER")) {
    return null;
  }

  if (loading || !analytics || !analytics.overview) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage events, users, and view analytics</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/registrations">
              <ClipboardList className="mr-2 h-4 w-4" />
              Registrations
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/checkin">
              <QrCode className="mr-2 h-4 w-4" />
              Check-In
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalRegistrations} total registrations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-In Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.checkInRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of registered attendees</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Registration Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Registration Status</CardTitle>
                <CardDescription>Distribution of registration statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.registrations.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, _count }) => `${status}: ${_count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="_count"
                    >
                      {analytics.registrations.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Events */}
          <Card>
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
              <CardDescription>Most popular events by registration</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.events.topEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="_count.registrations" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>View and manage all events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.events.stats.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event._count.registrations} / {event.capacity} registered
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Registrations</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.registrations.recent.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {registration.user.firstName} {registration.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {registration.event.title} - {registration.ticketType}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <StorageAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
