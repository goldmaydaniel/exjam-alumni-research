"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, MapPin, Building, Users, MessageCircle, UserPlus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown-menu";

interface AlumniProfile {
  id: string;
  user_id: string;
  graduation_year?: number;
  current_company?: string;
  job_title?: string;
  industry?: string;
  location_city?: string;
  location_country?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  is_available_for_mentoring: boolean;
  is_seeking_mentorship: boolean;
  linkedin_profile?: string;
  website_url?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    profilePhoto?: string;
    email: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AlumniDirectoryPage() {
  const [profiles, setProfiles] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    industry: "",
    location: "",
    graduationYear: "",
    mentoring: false,
    seeking: false,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.set("search", searchTerm);
      if (filters.industry) params.set("industry", filters.industry);
      if (filters.location) params.set("location", filters.location);
      if (filters.graduationYear) params.set("graduationYear", filters.graduationYear);
      if (filters.mentoring) params.set("mentoring", "true");
      if (filters.seeking) params.set("seeking", "true");

      const response = await fetch(`/api/alumni/directory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProfiles(data.profiles);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch profiles:", data.error);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProfiles();
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleConnect = async (receiverId: string) => {
    try {
      const response = await fetch("/api/alumni/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: receiverId,
          connection_type: "professional",
          message: "I'd like to connect with you through The ExJAM Association network.",
        }),
      });

      if (response.ok) {
        alert("Connection request sent successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to send connection request: ${error.error}`);
      }
    } catch (error) {
      console.error("Connection request error:", error);
      alert("Failed to send connection request");
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/dashboard/messages?user=${userId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Alumni Directory</h1>
        <p className="text-gray-600">Connect with fellow ExJAM members around the world</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search alumni by name, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </form>

        {showFilters && (
          <Card className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Input
                placeholder="Industry"
                value={filters.industry}
                onChange={(e) => handleFilterChange("industry", e.target.value)}
              />
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
              />
              <Input
                placeholder="Graduation Year"
                type="number"
                value={filters.graduationYear}
                onChange={(e) => handleFilterChange("graduationYear", e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={filters.mentoring ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("mentoring", !filters.mentoring)}
                >
                  Mentors
                </Button>
                <Button
                  type="button"
                  variant={filters.seeking ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("seeking", !filters.seeking)}
                >
                  Seeking
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading alumni...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {profiles.length} of {pagination.total} alumni
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.id} className="p-6 transition-shadow hover:shadow-lg">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={profile.user.profilePhoto}
                      alt={
                        profile.user.fullName ||
                        `${profile.user.firstName} ${profile.user.lastName}`
                      }
                    />
                    <AvatarFallback>
                      {profile.user.firstName.charAt(0)}
                      {profile.user.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-semibold">
                      {profile.user.fullName ||
                        `${profile.user.firstName} ${profile.user.lastName}`}
                    </h3>

                    {profile.job_title && profile.current_company && (
                      <div className="mb-1 flex items-center text-sm text-gray-600">
                        <Building className="mr-1 h-3 w-3" />
                        {profile.job_title} at {profile.current_company}
                      </div>
                    )}

                    {profile.location_city && (
                      <div className="mb-2 flex items-center text-sm text-gray-600">
                        <MapPin className="mr-1 h-3 w-3" />
                        {profile.location_city}, {profile.location_country}
                      </div>
                    )}

                    {profile.graduation_year && (
                      <Badge variant="secondary" className="mb-2">
                        Class of {profile.graduation_year}
                      </Badge>
                    )}
                  </div>
                </div>

                {profile.bio && (
                  <p className="mt-4 line-clamp-2 text-sm text-gray-700">{profile.bio}</p>
                )}

                {profile.skills.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {profile.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {profile.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex gap-1">
                    {profile.is_available_for_mentoring && (
                      <Badge variant="default" className="text-xs">
                        Mentor
                      </Badge>
                    )}
                    {profile.is_seeking_mentorship && (
                      <Badge variant="secondary" className="text-xs">
                        Seeking Mentor
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnect(profile.user_id)}
                      className="flex items-center gap-1"
                    >
                      <UserPlus className="h-3 w-3" />
                      Connect
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMessage(profile.user_id)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Message
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>

              <span className="flex items-center px-4">
                Page {pagination.page} of {pagination.pages}
              </span>

              <Button
                variant="outline"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
