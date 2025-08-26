"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Mail,
  Send,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue: string;
  address?: string;
  price: number;
  capacity: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  organizerId?: string;
  _count?: {
    Registration: number;
  };
  organizer?: {
    firstName: string;
    lastName: string;
  };
}

export default function EventManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbItems = useBreadcrumbs(pathname);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, sortBy]);

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/events?status=ALL&showPast=true", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const eventsData = data.events || data;
        setEvents(eventsData);
      } else {
        throw new Error("Failed to load events");
      }
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "startDate":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "registrations":
          return (b._count?.Registration || 0) - (a._count?.Registration || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredEvents(filtered);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (
      !confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        loadEvents();
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Event ${newStatus.toLowerCase()} successfully`);
        loadEvents();
      } else {
        throw new Error("Failed to update event status");
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    }
  };

  const exportEvents = () => {
    const csvContent = [
      ["Title", "Status", "Start Date", "Venue", "Capacity", "Registrations", "Revenue"].join(","),
      ...filteredEvents.map((event) =>
        [
          `"${event.title}"`,
          event.status,
          format(new Date(event.startDate), "yyyy-MM-dd"),
          `"${event.venue}"`,
          event.capacity,
          event._count?.Registration || 0,
          `${event.price * (event._count?.Registration || 0)}`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `events-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const statusColors = {
    DRAFT: "bg-gray-500",
    PUBLISHED: "bg-green-500",
    CANCELLED: "bg-red-500",
    COMPLETED: "bg-blue-500",
  };

  return (
    <div className="container space-y-8 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Create and manage events for the alumni community</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportEvents} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={loadEvents} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.status === "PUBLISHED").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.status === "DRAFT").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">
                  {events.reduce((acc, event) => acc + (event._count?.Registration || 0), 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="registrations">Registrations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold">No events found</h3>
              <p className="mb-6 text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first event"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/admin/events/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => {
            const registrationRate =
              event.capacity > 0 ? ((event._count?.Registration || 0) / event.capacity) * 100 : 0;
            const revenue = event.price * (event._count?.Registration || 0);
            const isUpcoming = new Date(event.startDate) > new Date();
            const isPast = new Date(event.endDate) < new Date();

            return (
              <Card key={event.id} className="transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 text-xl font-bold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.shortDescription || "No description"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[event.status]}>{event.status}</Badge>
                          {isPast && <Badge variant="outline">Past</Badge>}
                          {isUpcoming && <Badge variant="outline">Upcoming</Badge>}
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-yellow-500" />
                          <span>₦{event.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-500" />
                          <span>
                            {event._count?.Registration || 0}/{event.capacity}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Registration Progress</span>
                          <span>{registrationRate.toFixed(1)}% filled</span>
                        </div>
                        <Progress value={registrationRate} className="h-2" />
                      </div>

                      {/* Revenue */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Revenue: ₦{revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Created: {format(new Date(event.createdAt), "MMM dd")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row gap-2 lg:flex-col">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${event.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/events/${event.id}/analytics`}>
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Select
                        value={event.status}
                        onValueChange={(value) => handleStatusChange(event.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <Settings className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Publish</SelectItem>
                          <SelectItem value="CANCELLED">Cancel</SelectItem>
                          <SelectItem value="COMPLETED">Complete</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
