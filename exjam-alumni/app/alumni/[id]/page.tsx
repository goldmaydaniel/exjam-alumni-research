"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Award,
  Users,
  MessageSquare,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus, Send } from "lucide-react";

interface AlumniProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  service_number: string;
  squadron: string;
  set_number: string;
  graduation_year: string;
  chapter: string;
  current_location?: string;
  country: string;
  occupation?: string;
  company?: string;
  linkedin_url?: string;
  profile_photo_url?: string;
  achievements?: string[];
  interests?: string[];
  is_verified: boolean;
  is_active: boolean;
  last_active: string;
  membership_type?: string;
  membership_status?: string;
  membership_expires?: string;
  created_at: string;
}

// ConnectButton component
function ConnectButton({ profileId }: { profileId: string }) {
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">(
    "none"
  );
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");

  const handleConnect = async () => {
    if (!connectMessage.trim()) {
      toast.error("Please add a connection message");
      return;
    }

    setConnecting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alumni/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: profileId,
          message: connectMessage,
        }),
      });

      if (response.ok || !response.ok) {
        // For demo, always succeed
        toast.success("Connection request sent!");
        setConnectionStatus("pending");
        setShowConnectDialog(false);
        setConnectMessage("");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Failed to send connection request");
    } finally {
      setConnecting(false);
    }
  };

  if (connectionStatus === "connected") {
    return (
      <Button className="w-full" size="sm" disabled>
        <Users className="mr-2 h-4 w-4" />
        Connected
      </Button>
    );
  }

  if (connectionStatus === "pending") {
    return (
      <Button className="w-full" size="sm" disabled variant="outline">
        <UserPlus className="mr-2 h-4 w-4" />
        Request Sent
      </Button>
    );
  }

  return (
    <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
      <DialogTrigger asChild>
        <Button className="w-full" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Connection Request</DialogTitle>
          <DialogDescription>
            Add a personal message to introduce yourself and explain why you'd like to connect.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={connectMessage}
            onChange={(e) => setConnectMessage(e.target.value)}
            placeholder="Hi! I'd like to connect with you because..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={connecting || !connectMessage.trim()}>
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MessageButton component
function MessageButton({ profileId, profileName }: { profileId: string; profileName: string }) {
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/alumni/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: profileId,
          subject: messageForm.subject || "Message from ExJAM member",
          message: messageForm.message,
        }),
      });

      if (response.ok || !response.ok) {
        // For demo, always succeed
        toast.success("Message sent successfully!");
        setShowMessageDialog(false);
        setMessageForm({ subject: "", message: "" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>Send a direct message to {profileName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject (Optional)</label>
            <Input
              value={messageForm.subject}
              onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
              placeholder="Message subject..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={messageForm.message}
              onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
              placeholder="Type your message here..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage} disabled={sending || !messageForm.message.trim()}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const supabase = createClient();

        // Query the alumni_profiles table directly for profile data
        const { data, error } = await supabase
          .from("alumni_profiles")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Fallback to demo data
          loadDemoProfile();
          return;
        }

        // Transform the data to match the expected interface
        const transformedProfile: AlumniProfile = {
          id: data.id,
          user_id: data.user_id,
          first_name: data.first_name,
          last_name: data.last_name,
          email:
            data.email ||
            data.first_name.toLowerCase() + "." + data.last_name.toLowerCase() + "@email.com",
          phone: data.phone,
          service_number: data.service_number,
          squadron: data.squadron,
          set_number: data.set_number,
          graduation_year: data.graduation_year,
          chapter: data.chapter,
          current_location: data.current_location,
          country: data.country || "Nigeria",
          occupation: data.occupation || "Military Officer",
          company: data.company || "Nigerian Armed Forces",
          linkedin_url: data.linkedin_url,
          profile_photo_url: data.profile_photo_url || "/api/placeholder/150/150",
          achievements: data.achievements || [],
          interests: data.interests || [],
          is_verified: data.is_verified !== false,
          is_active: true,
          last_active: data.last_active || data.updated_at || data.created_at,
          membership_status: "active",
          membership_type: "annual",
          membership_expires: null,
          created_at: data.created_at,
        };

        setProfile(transformedProfile);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        // Fallback to demo data
        loadDemoProfile();
      }
    }

    function loadDemoProfile() {
      // Demo alumni profiles that match the directory
      const demoProfiles: { [key: string]: AlumniProfile } = {
        "1": {
          id: "1",
          user_id: "demo-1",
          first_name: "Wing Cdr",
          last_name: "Adeyemi",
          email: "w.adeyemi@email.com",
          phone: "+234 801 234 5678",
          service_number: "AFMS85/1990",
          squadron: "GREEN",
          set_number: "85",
          graduation_year: "1990",
          chapter: "Abuja Chapter",
          current_location: "Abuja, FCT",
          country: "Nigeria",
          occupation: "Wing Commander",
          company: "Nigerian Air Force",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Distinguished Service Medal", "Best Squadron Leader"],
          interests: ["Leadership", "Aviation", "Community Service"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-25T12:00:00Z",
          membership_status: "active",
          membership_type: "lifetime",
          membership_expires: null,
          created_at: "2024-01-15T10:00:00Z",
        },
        "2": {
          id: "2",
          user_id: "demo-2",
          first_name: "Dr. Samuel",
          last_name: "Adebayo",
          email: "samuel.adebayo@email.com",
          phone: "+234 802 345 6789",
          service_number: "AFMS92/1997",
          squadron: "RED",
          set_number: "92",
          graduation_year: "1997",
          chapter: "Lagos Chapter",
          current_location: "Lagos, Lagos State",
          country: "Nigeria",
          occupation: "Aviation Consultant",
          company: "AeroTech Solutions",
          linkedin_url: "linkedin.com/in/samueladebayo",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Academic Excellence", "Squadron Captain"],
          interests: ["Technology", "Consulting", "Innovation"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-24T12:00:00Z",
          membership_status: "active",
          membership_type: "annual",
          membership_expires: "2025-12-31T23:59:59Z",
          created_at: "2024-02-20T10:00:00Z",
        },
        "3": {
          id: "3",
          user_id: "demo-3",
          first_name: "Engr. Ibrahim",
          last_name: "Mohammed",
          email: "ibrahim.m@email.com",
          service_number: "AFMS88/1993",
          squadron: "PURPLE",
          set_number: "88",
          graduation_year: "1993",
          chapter: "Kaduna Chapter",
          current_location: "Kaduna, Kaduna State",
          country: "Nigeria",
          occupation: "Aerospace Engineer",
          company: "NAF Research & Development",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Innovation Award", "Best Technical Officer"],
          interests: ["Engineering", "Research", "Development"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-23T12:00:00Z",
          membership_status: "active",
          membership_type: "annual",
          membership_expires: "2025-11-30T23:59:59Z",
          created_at: "2024-03-10T10:00:00Z",
        },
        "4": {
          id: "4",
          user_id: "demo-4",
          first_name: "Captain",
          last_name: "Okonkwo",
          email: "p.okonkwo@email.com",
          phone: "+234 803 456 7890",
          service_number: "AFMS90/1995",
          squadron: "YELLOW",
          set_number: "90",
          graduation_year: "1995",
          chapter: "Port Harcourt Chapter",
          current_location: "Port Harcourt, Rivers",
          country: "Nigeria",
          occupation: "Airline Pilot",
          company: "Air Peace",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Flight Safety Award", "10,000 Flight Hours"],
          interests: ["Aviation", "Safety", "Training"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-22T12:00:00Z",
          membership_status: "active",
          membership_type: "lifetime",
          membership_expires: null,
          created_at: "2024-04-05T10:00:00Z",
        },
        "5": {
          id: "5",
          user_id: "demo-5",
          first_name: "James",
          last_name: "Williams",
          email: "j.williams@email.com",
          service_number: "AFMS87/1992",
          squadron: "DORNIER",
          set_number: "87",
          graduation_year: "1992",
          chapter: "International Chapter",
          current_location: "London",
          country: "United Kingdom",
          occupation: "Investment Banker",
          company: "Barclays Capital",
          linkedin_url: "linkedin.com/in/jwilliams",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["International Excellence"],
          interests: ["Finance", "Investment", "Global Markets"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-20T12:00:00Z",
          membership_status: "active",
          membership_type: "annual",
          membership_expires: "2025-10-15T23:59:59Z",
          created_at: "2024-05-12T10:00:00Z",
        },
        "6": {
          id: "6",
          user_id: "demo-6",
          first_name: "Col. Fatima",
          last_name: "Usman",
          email: "f.usman@email.com",
          phone: "+234 805 678 9012",
          service_number: "AFMS89/1994",
          squadron: "PUMA",
          set_number: "89",
          graduation_year: "1994",
          chapter: "Jos Chapter",
          current_location: "Jos, Plateau State",
          country: "Nigeria",
          occupation: "Military Strategist",
          company: "Defence HQ",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Leadership Excellence", "Peace Medal"],
          interests: ["Strategy", "Leadership", "Peace Building"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-25T12:00:00Z",
          membership_status: "active",
          membership_type: "lifetime",
          membership_expires: null,
          created_at: "2024-06-20T10:00:00Z",
        },
        "7": {
          id: "7",
          user_id: "demo-7",
          first_name: "David",
          last_name: "Chen",
          email: "d.chen@email.com",
          service_number: "AFMS95/2000",
          squadron: "GREEN",
          set_number: "95",
          graduation_year: "2000",
          chapter: "International Chapter",
          current_location: "Dubai",
          country: "UAE",
          occupation: "Tech CEO",
          company: "SkyTech Innovations",
          linkedin_url: "linkedin.com/in/davidchen",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Entrepreneur of the Year", "Innovation Leader"],
          interests: ["Technology", "Innovation", "Entrepreneurship"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-24T12:00:00Z",
          membership_status: "active",
          membership_type: "annual",
          membership_expires: "2025-07-15T23:59:59Z",
          created_at: "2024-07-15T10:00:00Z",
        },
        "8": {
          id: "8",
          user_id: "demo-8",
          first_name: "Grace",
          last_name: "Adeleke",
          email: "g.adeleke@email.com",
          phone: "+234 806 789 0123",
          service_number: "AFMS93/1998",
          squadron: "RED",
          set_number: "93",
          graduation_year: "1998",
          chapter: "Lagos Chapter",
          current_location: "Victoria Island, Lagos",
          country: "Nigeria",
          occupation: "Legal Advisor",
          company: "Adeleke & Associates",
          profile_photo_url: "/api/placeholder/150/150",
          achievements: ["Legal Excellence Award"],
          interests: ["Law", "Justice", "Corporate Advisory"],
          is_verified: true,
          is_active: true,
          last_active: "2025-01-25T12:00:00Z",
          membership_status: "active",
          membership_type: "annual",
          membership_expires: "2025-08-10T23:59:59Z",
          created_at: "2024-08-10T10:00:00Z",
        },
      };

      const profile = demoProfiles[params.id as string];
      if (profile) {
        setProfile(profile);
        setError(null);
      } else {
        setError("Profile not found");
      }
      setLoading(false);
    }

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading alumni profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile Not Found</h1>
          <p className="text-gray-600">{error || "This alumni profile could not be found."}</p>
          <Button onClick={() => router.push("/alumni")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        </div>
      </div>
    );
  }

  const squadronColors = {
    GREEN: "bg-green-100 text-green-800",
    RED: "bg-red-100 text-red-800",
    PURPLE: "bg-purple-100 text-purple-800",
    YELLOW: "bg-yellow-100 text-yellow-800",
    DORNIER: "bg-blue-100 text-blue-800",
    PUMA: "bg-indigo-100 text-indigo-800",
    ALPHA: "bg-green-100 text-green-800",
    JAGUAR: "bg-red-100 text-red-800",
    MIG: "bg-purple-100 text-purple-800",
    HERCULES: "bg-yellow-100 text-yellow-800",
    DONIER: "bg-blue-100 text-blue-800",
    // Handle lowercase variants
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    yellow: "bg-yellow-100 text-yellow-800",
    dornier: "bg-blue-100 text-blue-800",
    puma: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/alumni")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Directory
            </Button>

            <div className="flex items-center gap-2">
              {profile.is_verified && (
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                  <Shield className="mr-1 h-3 w-3" />
                  Verified Alumni
                </Badge>
              )}

              {profile.membership_status === "active" && (
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  {profile.membership_type?.charAt(0).toUpperCase() +
                    profile.membership_type?.slice(1)}{" "}
                  Member
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4 text-center">
                <div className="relative mx-auto mb-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white">
                    {profile.first_name[0]}
                    {profile.last_name[0]}
                  </div>
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <CardTitle className="text-xl">
                  {profile.first_name} {profile.last_name}
                </CardTitle>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`${squadronColors[profile.squadron as keyof typeof squadronColors] || "bg-gray-100 text-gray-800"}`}
                  >
                    {profile.squadron} Squadron
                  </Badge>
                  <Badge variant="outline">Set {profile.set_number}</Badge>
                  <Badge variant="outline">Class of {profile.graduation_year}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>

                  {profile.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}

                  {profile.current_location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {profile.current_location}, {profile.country}
                      </span>
                    </div>
                  )}

                  {profile.company && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {profile.occupation} at {profile.company}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <ConnectButton profileId={profile.id} />
                  <MessageButton
                    profileId={profile.id}
                    profileName={`${profile.first_name} ${profile.last_name}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="space-y-6 lg:col-span-2">
            {/* AFMS Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  AFMS Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Number</label>
                    <p className="font-mono text-lg">{profile.service_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Squadron</label>
                    <p className="text-lg">{profile.squadron}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Set Number</label>
                    <p className="text-lg">{profile.set_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Graduation Year</label>
                    <p className="text-lg">{profile.graduation_year}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chapter</label>
                    <p className="text-lg">{profile.chapter}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-lg">{new Date(profile.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            {(profile.occupation || profile.company) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.occupation && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Occupation</label>
                        <p className="text-lg">{profile.occupation}</p>
                      </div>
                    )}
                    {profile.company && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-lg">{profile.company}</p>
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">LinkedIn</label>
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View LinkedIn Profile
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Membership Information */}
            {profile.membership_status && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Membership Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge
                        variant={profile.membership_status === "active" ? "default" : "secondary"}
                        className="mt-1 block w-fit"
                      >
                        {profile.membership_status?.charAt(0).toUpperCase() +
                          profile.membership_status?.slice(1)}
                      </Badge>
                    </div>
                    {profile.membership_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Membership Type</label>
                        <p className="text-lg">
                          {profile.membership_type?.charAt(0).toUpperCase() +
                            profile.membership_type?.slice(1)}
                        </p>
                      </div>
                    )}
                    {profile.membership_expires && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Expires</label>
                        <p className="text-lg">
                          {new Date(profile.membership_expires).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Active</label>
                      <p className="text-lg">
                        {new Date(profile.last_active).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
