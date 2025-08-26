"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

interface WaitlistEntry {
  id: string;
  userId: string;
  eventId: string;
  position: number;
  status: string;
  ticketType: string;
  createdAt: string;
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
    capacity: number;
  };
}

export default function AdminWaitlistPage() {
  const [waitlists, setWaitlists] = useState<{ [eventId: string]: WaitlistEntry[] }>({});
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    if (typeof window !== "undefined") {
      alert(`${type.toUpperCase()}: ${message}`);
    }
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Load events and waitlists
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchWaitlistForEvent(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data.events || []);
      if (data.events && data.events.length > 0) {
        setSelectedEvent(data.events[0].id);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      showMessage("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistForEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/waitlist?eventId=${eventId}`);
      if (!response.ok) throw new Error("Failed to fetch waitlist");

      const data = await response.json();
      setWaitlists((prev) => ({
        ...prev,
        [eventId]: data.waitlist || [],
      }));
    } catch (error) {
      console.error("Error fetching waitlist:", error);
      showMessage("Failed to load waitlist", "error");
    }
  };

  const convertWaitlistEntry = async (waitlistId: string) => {
    try {
      const response = await fetch(`/api/waitlist/${waitlistId}/convert`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to convert waitlist entry");

      showMessage("Waitlist entry converted to registration successfully", "success");

      // Refresh waitlist for the selected event
      if (selectedEvent) {
        await fetchWaitlistForEvent(selectedEvent);
      }
    } catch (error) {
      console.error("Error converting waitlist entry:", error);
      showMessage("Failed to convert waitlist entry", "error");
    }
  };

  const currentWaitlist = selectedEvent ? waitlists[selectedEvent] || [] : [];
  const selectedEventDetails = events.find((e) => e.id === selectedEvent);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading waitlists...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waitlist Management</h1>
          <p className="mt-2 text-gray-600">
            Manage event waitlists and convert entries to registrations
          </p>
        </div>
      </div>

      {/* Event Selection */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Event:</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      {selectedEventDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{selectedEventDetails.title}</CardTitle>
            <CardDescription>
              Capacity: {selectedEventDetails.capacity} | Venue: {selectedEventDetails.venue} |
              Date: {new Date(selectedEventDetails.startDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Waitlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist ({currentWaitlist.length})</CardTitle>
          <CardDescription>
            People waiting for spots in {selectedEventDetails?.title || "the selected event"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentWaitlist.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No one is currently on the waitlist for this event.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentWaitlist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-lg font-bold">
                        #{entry.position}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {entry.user.fullName || `${entry.user.firstName} ${entry.user.lastName}`}
                        </div>
                      </TableCell>
                      <TableCell>{entry.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.ticketType}</Badge>
                      </TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.status === "ACTIVE" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Convert to Registration
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Convert Waitlist Entry</DialogTitle>
                                <DialogDescription>
                                  Convert this waitlist entry to a confirmed registration?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p>
                                    <strong>Name:</strong>{" "}
                                    {entry.user.fullName ||
                                      `${entry.user.firstName} ${entry.user.lastName}`}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {entry.user.email}
                                  </p>
                                  <p>
                                    <strong>Position:</strong> #{entry.position}
                                  </p>
                                  <p>
                                    <strong>Ticket Type:</strong> {entry.ticketType}
                                  </p>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    onClick={() => convertWaitlistEntry(entry.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Confirm Conversion
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
