"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Shield,
  Building,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Globe,
  Star,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface AlumniMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  serviceNumber: string;
  set: string;
  squadron: string;
  chapter: string;
  currentLocation: string;
  country: string;
  occupation?: string;
  company?: string;
  linkedIn?: string;
  profilePhoto?: string;
  graduationYear: string;
  achievements?: string[];
  isVerified: boolean;
  joinedDate: string;
  lastActive?: string;
  connectionStatus?: "connected" | "pending" | "none";
}

const SQUADRONS = [
  { value: "all", label: "All Squadrons", color: "bg-gray-500" },
  { value: "green", label: "Green Squadron", color: "bg-green-500" },
  { value: "red", label: "Red Squadron", color: "bg-red-500" },
  { value: "purple", label: "Purple Squadron", color: "bg-purple-500" },
  { value: "yellow", label: "Yellow Squadron", color: "bg-yellow-500" },
  { value: "dornier", label: "Dornier Squadron", color: "bg-blue-500" },
  { value: "puma", label: "Puma Squadron", color: "bg-gray-600" },
];

const CHAPTERS = [
  "All Chapters",
  "Abuja Chapter",
  "Lagos Chapter",
  "Port Harcourt Chapter",
  "Kaduna Chapter",
  "Jos Chapter",
  "International Chapter",
];

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState<AlumniMember[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSquadron, setSelectedSquadron] = useState("all");
  const [selectedChapter, setSelectedChapter] = useState("All Chapters");
  const [selectedSet, setSelectedSet] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    filterAlumni();
  }, [searchTerm, selectedSquadron, selectedChapter, selectedSet, alumni]);

  const fetchAlumni = async () => {
    try {
      const response = await fetch("/api/alumni");
      if (response.ok) {
        const data = await response.json();
        setAlumni(data);
        setFilteredAlumni(data);
      }
    } catch (error) {
      console.error("Error fetching alumni:", error);
      // Mock data for demonstration
      const mockData: AlumniMember[] = [
        {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@email.com",
          phone: "+234 801 234 5678",
          serviceNumber: "AFMS95/2000",
          set: "95",
          squadron: "green",
          chapter: "Abuja Chapter",
          currentLocation: "Abuja, FCT",
          country: "Nigeria",
          occupation: "Fighter Pilot",
          company: "Nigerian Air Force",
          profilePhoto: "/api/placeholder/150/150",
          graduationYear: "2000",
          achievements: ["Best Cadet Award", "Leadership Excellence"],
          isVerified: true,
          joinedDate: "2024-01-15",
          lastActive: "2024-12-20",
          connectionStatus: "connected",
        },
        {
          id: "2",
          firstName: "Samuel",
          lastName: "Adebayo",
          email: "samuel.adebayo@email.com",
          phone: "+234 802 345 6789",
          serviceNumber: "AFMS96/2001",
          set: "96",
          squadron: "red",
          chapter: "Lagos Chapter",
          currentLocation: "Lagos, Lagos State",
          country: "Nigeria",
          occupation: "Software Engineer",
          company: "Tech Solutions Ltd",
          linkedIn: "linkedin.com/in/samueladebayo",
          profilePhoto: "/api/placeholder/150/150",
          graduationYear: "2001",
          isVerified: true,
          joinedDate: "2024-02-20",
          connectionStatus: "none",
        },
        {
          id: "3",
          firstName: "Ibrahim",
          lastName: "Mohammed",
          email: "ibrahim.m@email.com",
          serviceNumber: "AFMS94/1999",
          set: "94",
          squadron: "purple",
          chapter: "Kaduna Chapter",
          currentLocation: "Kaduna, Kaduna State",
          country: "Nigeria",
          occupation: "Medical Doctor",
          company: "Federal Medical Centre",
          profilePhoto: "/api/placeholder/150/150",
          graduationYear: "1999",
          achievements: ["Medical Excellence Award"],
          isVerified: true,
          joinedDate: "2024-03-10",
          connectionStatus: "pending",
        },
      ];
      setAlumni(mockData);
      setFilteredAlumni(mockData);
    } finally {
      setLoading(false);
    }
  };

  const filterAlumni = () => {
    let filtered = [...alumni];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.serviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.currentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Squadron filter
    if (selectedSquadron !== "all") {
      filtered = filtered.filter((member) => member.squadron === selectedSquadron);
    }

    // Chapter filter
    if (selectedChapter !== "All Chapters") {
      filtered = filtered.filter((member) => member.chapter === selectedChapter);
    }

    // Set filter
    if (selectedSet !== "all") {
      filtered = filtered.filter((member) => member.set === selectedSet);
    }

    setFilteredAlumni(filtered);
  };

  const handleConnect = async (memberId: string) => {
    try {
      const response = await fetch(`/api/alumni/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: memberId }),
      });

      if (response.ok) {
        toast.success("Connection request sent!");
        // Update local state
        setAlumni((prev) =>
          prev.map((member) =>
            member.id === memberId ? { ...member, connectionStatus: "pending" as const } : member
          )
        );
      }
    } catch (error) {
      toast.error("Failed to send connection request");
    }
  };

  const getSquadronColor = (squadron: string) => {
    const sq = SQUADRONS.find((s) => s.value === squadron);
    return sq?.color || "bg-gray-500";
  };

  const AlumniCard = ({ member }: { member: AlumniMember }) => (
    <Card className="group transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage
                src={member.profilePhoto}
                alt={`${member.firstName} ${member.lastName}`}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {member.firstName} {member.lastName}
                </h3>
                {member.isVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {member.serviceNumber} • Set {member.set}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={`${getSquadronColor(member.squadron)} text-white`}>
                  {SQUADRONS.find((s) => s.value === member.squadron)?.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {member.currentLocation}, {member.country}
            </span>
          </div>

          {member.occupation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{member.occupation}</span>
              {member.company && <span className="text-xs">at {member.company}</span>}
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span>Class of {member.graduationYear}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{member.chapter}</span>
          </div>
        </div>

        {member.achievements && member.achievements.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {member.achievements.map((achievement, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <Star className="mr-1 h-3 w-3" />
                {achievement}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/alumni/${member.id}`}>View Profile</Link>
          </Button>

          {member.connectionStatus === "connected" ? (
            <Button variant="secondary" size="sm" disabled>
              <Users className="mr-1 h-4 w-4" />
              Connected
            </Button>
          ) : member.connectionStatus === "pending" ? (
            <Button variant="outline" size="sm" disabled>
              <UserPlus className="mr-1 h-4 w-4" />
              Pending
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={() => handleConnect(member.id)}>
              <UserPlus className="mr-1 h-4 w-4" />
              Connect
            </Button>
          )}

          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AlumniListItem = ({ member }: { member: AlumniMember }) => (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.profilePhoto} />
              <AvatarFallback>
                {member.firstName[0]}
                {member.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <p className="font-semibold">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{member.serviceNumber}</p>
              </div>

              <div>
                <Badge className={`${getSquadronColor(member.squadron)} text-xs text-white`}>
                  {SQUADRONS.find((s) => s.value === member.squadron)?.label}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">Set {member.set}</p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">{member.currentLocation}</p>
                <p className="text-xs text-muted-foreground">{member.occupation}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/alumni/${member.id}`}>View</Link>
                </Button>
                {member.connectionStatus !== "connected" && (
                  <Button variant="default" size="sm" onClick={() => handleConnect(member.id)}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Generate years for set filter
  const currentYear = new Date().getFullYear();
  const startYear = 1980;
  const sets = Array.from({ length: currentYear - startYear }, (_, i) => {
    const year = startYear + i;
    return (year % 100).toString().padStart(2, "0");
  });

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Alumni Directory</h1>
        <p className="text-muted-foreground">
          Connect with fellow EXJAM alumni from all sets, squadrons, and chapters worldwide
        </p>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{alumni.length}</p>
                <p className="text-xs text-muted-foreground">Total Alumni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Squadrons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">Chapters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">15+</p>
                <p className="text-xs text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, occupation, or service number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedSquadron} onValueChange={setSelectedSquadron}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Squadron" />
              </SelectTrigger>
              <SelectContent>
                {SQUADRONS.map((squadron) => (
                  <SelectItem key={squadron.value} value={squadron.value}>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${squadron.color}`} />
                      {squadron.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent>
                {CHAPTERS.map((chapter) => (
                  <SelectItem key={chapter} value={chapter}>
                    {chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSet} onValueChange={setSelectedSet}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sets</SelectItem>
                {sets.reverse().map((set) => (
                  <SelectItem key={set} value={set}>
                    Set {set}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAlumni.length} of {alumni.length} alumni
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAlumni.map((member) => (
            <AlumniCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlumni.map((member) => (
            <AlumniListItem key={member.id} member={member} />
          ))}
        </div>
      )}

      {filteredAlumni.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Alumni Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search filters or check back later
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
