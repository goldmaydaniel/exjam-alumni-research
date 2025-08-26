"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  Download,
  Users,
  UserCheck,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface EventBadge {
  id: string;
  event_id: string;
  user_id: string;
  display_name: string;
  title?: string;
  company?: string;
  badge_type: string;
  status: string;
  qr_code_url: string;
  badge_image_url: string;
  scan_count: number;
  generated_at: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    profilePhoto?: string;
    email: string;
  };
  registration: {
    id: string;
    status: string;
    ticketType: string;
  };
}

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
}

export default function EventBadgesPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [badges, setBadges] = useState<EventBadge[]>([]);
  const [templates, setTemplates] = useState<BadgeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [statistics, setStatistics] = useState<any>({});

  const supabase = createClient();

  useEffect(() => {
    if (eventId) {
      fetchBadges();
      fetchTemplates();
    }
  }, [eventId]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/badges`);
      const data = await response.json();

      if (response.ok) {
        setBadges(data.badges);
        setStatistics(data.statistics);
      } else {
        toast.error(data.error || "Failed to fetch badges");
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error("Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/badge-templates?active=true");
      const data = await response.json();

      if (response.ok) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const generateBadgeForUser = async (
    userId: string,
    registrationId: string,
    badgeType: string = "attendee"
  ) => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/events/${eventId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          registration_id: registrationId,
          badge_type: badgeType,
          regenerate: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchBadges(); // Refresh badges list
      } else {
        toast.error(data.error || "Failed to generate badge");
      }
    } catch (error) {
      console.error("Error generating badge:", error);
      toast.error("Failed to generate badge");
    } finally {
      setGenerating(false);
    }
  };

  const generateAllBadges = async () => {
    try {
      setGenerating(true);

      // Get all confirmed registrations for this event
      const { data: registrations, error } = await supabase
        .from("Registration")
        .select(
          `
          id,
          userId,
          ticketType,
          User!inner(
            id,
            firstName,
            lastName,
            email
          )
        `
        )
        .eq("eventId", eventId)
        .eq("status", "CONFIRMED");

      if (error) {
        toast.error("Failed to fetch registrations");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Generate badges for all registrations
      for (const registration of registrations) {
        try {
          const badgeType = registration.ticketType.toLowerCase();
          const response = await fetch(`/api/events/${eventId}/badges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: registration.userId,
              registration_id: registration.id,
              badge_type: badgeType,
              regenerate: false,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.success(`Generated ${successCount} badges successfully. ${errorCount} errors.`);
      fetchBadges(); // Refresh badges list
    } catch (error) {
      console.error("Error generating all badges:", error);
      toast.error("Failed to generate badges");
    } finally {
      setGenerating(false);
    }
  };

  const downloadBadge = (badge: EventBadge) => {
    if (badge.badge_image_url) {
      const link = document.createElement("a");
      link.href = badge.badge_image_url;
      link.download = `badge-${badge.display_name.replace(/\s+/g, "-")}.html`;
      link.click();
    }
  };

  const filteredBadges = badges.filter((badge) => {
    const matchesSearch =
      badge.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (badge.company && badge.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterType === "all" || badge.badge_type === filterType;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Event Badges</h1>
        <p className="text-gray-600">Manage event badges and QR codes for check-in</p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="mr-3 h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.total || 0}</p>
                <p className="text-gray-600">Total Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="mr-3 h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.byStatus?.scanned || 0}</p>
                <p className="text-gray-600">Scanned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <QrCode className="mr-3 h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.byStatus?.generated || 0}</p>
                <p className="text-gray-600">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Printer className="mr-3 h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{statistics.byStatus?.printed || 0}</p>
                <p className="text-gray-600">Printed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Button
          onClick={generateAllBadges}
          disabled={generating}
          className="flex items-center gap-2"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Generate All Badges
        </Button>

        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Manage Templates
        </Button>

        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative min-w-[300px] flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="attendee">Attendee</option>
          <option value="speaker">Speaker</option>
          <option value="vip">VIP</option>
          <option value="organizer">Organizer</option>
          <option value="sponsor">Sponsor</option>
        </select>
      </div>

      {/* Badges List */}
      <Card>
        <CardHeader>
          <CardTitle>Event Badges ({filteredBadges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={badge.user.profilePhoto} alt={badge.display_name} />
                    <AvatarFallback>
                      {badge.user.firstName.charAt(0)}
                      {badge.user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="font-semibold">{badge.display_name}</h3>
                    <p className="text-sm text-gray-600">{badge.user.email}</p>
                    {badge.title && <p className="text-sm text-gray-500">{badge.title}</p>}
                    {badge.company && <p className="text-sm text-gray-500">{badge.company}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <Badge variant={badge.status === "scanned" ? "default" : "secondary"}>
                      {badge.badge_type}
                    </Badge>
                    <p className="mt-1 text-gray-500">Scans: {badge.scan_count}</p>
                  </div>

                  <div className="flex space-x-2">
                    {badge.qr_code_url && (
                      <img
                        src={badge.qr_code_url}
                        alt="QR Code"
                        className="h-12 w-12 rounded border"
                      />
                    )}

                    <div className="flex flex-col space-y-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBadge(badge)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={generating}
                        onClick={() =>
                          generateBadgeForUser(
                            badge.user_id,
                            badge.registration.id,
                            badge.badge_type
                          )
                        }
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBadges.length === 0 && (
            <div className="py-8 text-center">
              <QrCode className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold">No badges found</h3>
              <p className="text-gray-600">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Generate badges for registered attendees"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
