"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useFeedback } from "@/components/ui/feedback-system";

interface Registration {
  id: string;
  ticketNumber: string;
  status: string;
  ticketType: string;
  createdAt: string;
  updatedAt: string;
  paymentReference?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    venue: string;
  };
  ticket?: {
    id: string;
    ticketNumber: string;
    checkedIn: boolean;
    checkinTime?: string;
    qrCode?: string;
  };
}

interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  checkedIn: number;
  totalRevenue: number;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<RegistrationStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    checkedIn: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const showMessage = (message: string, type: "success" | "error" = "success") => {
    // Simple alert for now - can be replaced with proper toast in client component
    if (typeof window !== "undefined") {
      alert(`${type.toUpperCase()}: ${message}`);
    }
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Load registrations and stats
  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/admin/registrations");
      if (!response.ok) throw new Error("Failed to fetch registrations");

      const data = await response.json();
      setRegistrations(data.registrations);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      showMessage("Failed to load registrations", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update registration");

      await fetchRegistrations(); // Refresh data
      showMessage("Registration status updated successfully", "success");
    } catch (error) {
      console.error("Error updating registration:", error);
      showMessage("Failed to update registration status", "error");
    }
  };

  const resendConfirmationEmail = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/resend-email`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to resend email");

      showMessage("Confirmation email resent successfully", "success");
    } catch (error) {
      console.error("Error resending email:", error);
      showMessage("Failed to resend confirmation email", "error");
    }
  };

  const exportRegistrations = async () => {
    try {
      const response = await fetch("/api/admin/export/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventFilter,
          statusFilter,
          searchTerm,
        }),
      });

      if (!response.ok) throw new Error("Failed to export registrations");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "registrations-export.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      showMessage("Registrations exported successfully", "success");
    } catch (error) {
      console.error("Error exporting registrations:", error);
      showMessage("Failed to export registrations", "error");
    }
  };

  // Filter registrations based on search and filters
  const filteredRegistrations = registrations.filter((registration) => {
    const matchesSearch =
      searchTerm === "" ||
      registration.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || registration.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesEvent = eventFilter === "all" || registration.event.id === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "PAYMENT_FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading registrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Management</h1>
          <p className="mt-2 text-gray-600">Manage event registrations, tickets, and check-ins</p>
        </div>
        <Button onClick={exportRegistrations} variant="outline">
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-sm text-gray-600">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-sm text-gray-600">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.checkedIn}</div>
            <p className="text-sm text-gray-600">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              ₦{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Input
              placeholder="Search by name, email, or ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="payment_failed">Payment Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setEventFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations ({filteredRegistrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-mono text-sm">
                      {registration.ticketNumber || "Pending"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {registration.user.fullName ||
                            `${registration.user.firstName} ${registration.user.lastName}`}
                        </div>
                        <div className="text-sm text-gray-500">{registration.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.event.title}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(registration.event.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{registration.ticketType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRegistration(registration)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Registration Details</DialogTitle>
                            <DialogDescription>
                              Manage registration and ticket information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRegistration && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList>
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Ticket Number</label>
                                    <p className="font-mono">
                                      {selectedRegistration.ticketNumber || "Pending"}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={getStatusColor(selectedRegistration.status)}>
                                      {selectedRegistration.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Attendee</label>
                                    <p>
                                      {selectedRegistration.user.fullName ||
                                        `${selectedRegistration.user.firstName} ${selectedRegistration.user.lastName}`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {selectedRegistration.user.email}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Event</label>
                                    <p>{selectedRegistration.event.title}</p>
                                    <p className="text-sm text-gray-500">
                                      {selectedRegistration.event.venue}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Registration Date</label>
                                    <p>
                                      {new Date(selectedRegistration.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Check-in Status</label>
                                    <p>
                                      {selectedRegistration.ticket?.checkedIn
                                        ? `Checked in at ${new Date(selectedRegistration.ticket.checkinTime!).toLocaleString()}`
                                        : "Not checked in"}
                                    </p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="actions" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium">
                                      Update Status
                                    </label>
                                    <Select
                                      defaultValue={selectedRegistration.status}
                                      onValueChange={(value) =>
                                        updateRegistrationStatus(selectedRegistration.id, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Button
                                      onClick={() =>
                                        resendConfirmationEmail(selectedRegistration.id)
                                      }
                                      variant="outline"
                                      className="w-full"
                                    >
                                      Resend Confirmation Email
                                    </Button>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRegistrations.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No registrations found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
