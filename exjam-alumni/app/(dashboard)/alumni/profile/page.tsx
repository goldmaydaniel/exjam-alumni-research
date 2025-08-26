"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { Plus, X, Save, User, Building, MapPin, Link as LinkIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface AlumniProfileData {
  id?: string;
  graduation_year?: number;
  course_of_study?: string;
  current_company?: string;
  job_title?: string;
  industry?: string;
  location_city?: string;
  location_country?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  linkedin_profile?: string;
  website_url?: string;
  is_available_for_mentoring: boolean;
  is_seeking_mentorship: boolean;
  is_available_for_networking: boolean;
  is_public: boolean;
}

export default function AlumniProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const breadcrumbItems = useBreadcrumbs(pathname);
  const [profile, setProfile] = useState<AlumniProfileData>({
    graduation_year: undefined,
    course_of_study: "",
    current_company: "",
    job_title: "",
    industry: "",
    location_city: "",
    location_country: "Nigeria",
    bio: "",
    skills: [],
    interests: [],
    linkedin_profile: "",
    website_url: "",
    is_available_for_mentoring: false,
    is_seeking_mentorship: false,
    is_available_for_networking: true,
    is_public: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch existing profile
      const { data: existingProfile, error } = await supabase
        .from("alumni_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      } else if (existingProfile) {
        setProfile({
          ...existingProfile,
          skills: existingProfile.skills || [],
          interests: existingProfile.interests || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/alumni/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setProfile((prev) => ({ ...prev, id: result.profile.id }));
      } else {
        const error = await response.json();
        alert(`Failed to save profile: ${error.error}`);
      }
    } catch (error) {
      console.error("Profile save error:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()],
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setProfile((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const updateProfile = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Alumni Profile</h1>
        <p className="text-gray-600">
          Manage your alumni directory profile and networking preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  value={profile.graduation_year || ""}
                  onChange={(e) =>
                    updateProfile("graduation_year", parseInt(e.target.value) || undefined)
                  }
                  placeholder="e.g., 2015"
                />
              </div>
              <div>
                <Label htmlFor="course_of_study">Course of Study</Label>
                <Input
                  id="course_of_study"
                  value={profile.course_of_study || ""}
                  onChange={(e) => updateProfile("course_of_study", e.target.value)}
                  placeholder="e.g., Engineering, Business Administration"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => updateProfile("bio", e.target.value)}
                placeholder="Tell other alumni about yourself, your interests, and what you're up to..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="current_company">Current Company</Label>
                <Input
                  id="current_company"
                  value={profile.current_company || ""}
                  onChange={(e) => updateProfile("current_company", e.target.value)}
                  placeholder="e.g., Microsoft, Independent Consultant"
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={profile.job_title || ""}
                  onChange={(e) => updateProfile("job_title", e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={profile.industry || ""}
                onChange={(e) => updateProfile("industry", e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="location_city">City</Label>
                <Input
                  id="location_city"
                  value={profile.location_city || ""}
                  onChange={(e) => updateProfile("location_city", e.target.value)}
                  placeholder="e.g., Lagos, Abuja, London"
                />
              </div>
              <div>
                <Label htmlFor="location_country">Country</Label>
                <Input
                  id="location_country"
                  value={profile.location_country || ""}
                  onChange={(e) => updateProfile("location_country", e.target.value)}
                  placeholder="e.g., Nigeria, United Kingdom"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills and Interests */}
        <Card>
          <CardHeader>
            <CardTitle>Skills & Interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Skills */}
            <div>
              <Label>Skills</Label>
              <div className="mb-3 mt-2 flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <Label>Interests</Label>
              <div className="mb-3 mt-2 flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === "Enter" && addInterest()}
                />
                <Button type="button" onClick={addInterest} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
              <Input
                id="linkedin_profile"
                value={profile.linkedin_profile || ""}
                onChange={(e) => updateProfile("linkedin_profile", e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>

            <div>
              <Label htmlFor="website_url">Personal Website</Label>
              <Input
                id="website_url"
                value={profile.website_url || ""}
                onChange={(e) => updateProfile("website_url", e.target.value)}
                placeholder="https://your-website.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Networking Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Networking Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Make profile public</Label>
                <p className="text-sm text-gray-600">
                  Allow other alumni to find and view your profile
                </p>
              </div>
              <Switch
                checked={profile.is_public}
                onCheckedChange={(checked) => updateProfile("is_public", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Available for networking</Label>
                <p className="text-sm text-gray-600">
                  Open to professional networking opportunities
                </p>
              </div>
              <Switch
                checked={profile.is_available_for_networking}
                onCheckedChange={(checked) => updateProfile("is_available_for_networking", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Available for mentoring</Label>
                <p className="text-sm text-gray-600">Willing to mentor other alumni or students</p>
              </div>
              <Switch
                checked={profile.is_available_for_mentoring}
                onCheckedChange={(checked) => updateProfile("is_available_for_mentoring", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Seeking mentorship</Label>
                <p className="text-sm text-gray-600">
                  Looking for guidance from experienced alumni
                </p>
              </div>
              <Switch
                checked={profile.is_seeking_mentorship}
                onCheckedChange={(checked) => updateProfile("is_seeking_mentorship", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
