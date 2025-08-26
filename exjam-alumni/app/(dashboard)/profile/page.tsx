"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Camera,
  Save,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building,
  Briefcase,
  GraduationCap,
  Users,
  Edit,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/store/consolidated-auth";

// Nigerian states for chapter selection
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT-Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Diaspora - USA",
  "Diaspora - UK",
  "Diaspora - Canada",
  "Diaspora - Other",
];

interface ProfileData {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  firstName: string;
  lastName: string;
  serviceNumber?: string;
  squadron?: string;
  phone?: string;
  chapter?: string;
  currentLocation?: string;
  emergencyContact?: string;
  graduationYear?: number;
  currentOccupation?: string;
  company?: string;
  bio?: string;
  profilePhoto?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    serviceNumber: "",
    squadron: "",
    phone: "",
    chapter: "",
    currentLocation: "",
    emergencyContact: "",
    graduationYear: "",
    currentOccupation: "",
    company: "",
    bio: "",
    profilePhoto: "",
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (token) {
      fetchProfile();
    }
  }, [isAuthenticated, token, router]);

  const fetchProfile = async () => {
    try {
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        serviceNumber: data.serviceNumber || "",
        squadron: data.squadron || "",
        phone: data.phone || "",
        chapter: data.chapter || "",
        currentLocation: data.currentLocation || "",
        emergencyContact: data.emergencyContact || "",
        graduationYear: data.graduationYear?.toString() || "",
        currentOccupation: data.currentOccupation || "",
        company: data.company || "",
        bio: data.bio || "",
        profilePhoto: data.profilePhoto || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      if (!token) {
        throw new Error("No authentication token available");
      }

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Convert to base64 for now (in production, upload to cloud storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePhoto: reader.result as string });
      toast.success("Photo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profilePhoto} />
                <AvatarFallback>
                  {profile.firstName?.[0]}
                  {profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{profile.fullName}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={profile.emailVerified ? "default" : "secondary"}>
                    {profile.emailVerified ? "Verified" : "Unverified"}
                  </Badge>
                  <Badge>{profile.role}</Badge>
                  {profile.squadron && <Badge variant="outline">{profile.squadron}</Badge>}
                </div>
              </div>
            </div>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "outline" : "default"}
            >
              {editMode ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Number</Label>
                  <Input
                    value={formData.serviceNumber}
                    onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
                    disabled={!editMode}
                    placeholder="NAF/12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Squadron</Label>
                  <Select
                    value={formData.squadron}
                    onValueChange={(value) => setFormData({ ...formData, squadron: value })}
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select squadron" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALPHA">ALPHA</SelectItem>
                      <SelectItem value="JAGUAR">JAGUAR</SelectItem>
                      <SelectItem value="MIG">MIG</SelectItem>
                      <SelectItem value="HERCULES">HERCULES</SelectItem>
                      <SelectItem value="DONIER">DONIER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Graduation Year</Label>
                <Input
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  disabled={!editMode}
                  placeholder="2010"
                  min="1950"
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!editMode}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              {editMode && (
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                  <p className="text-xs text-muted-foreground">
                    Max file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your career and work details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Occupation</Label>
                <Input
                  value={formData.currentOccupation}
                  onChange={(e) => setFormData({ ...formData, currentOccupation: e.target.value })}
                  disabled={!editMode}
                  placeholder="Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label>Company/Organization</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!editMode}
                  placeholder="Tech Corp"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How we can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex gap-2">
                  <Input value={profile.email} disabled />
                  {!profile.emailVerified && (
                    <Button variant="outline" size="sm">
                      Verify Email
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editMode}
                  placeholder="+234 801 234 5678"
                />
              </div>

              <div className="space-y-2">
                <Label>Current Location</Label>
                <Input
                  value={formData.currentLocation}
                  onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                  disabled={!editMode}
                  placeholder="Lagos, Nigeria"
                />
              </div>

              <div className="space-y-2">
                <Label>Chapter (State/Location) *</Label>
                <Select
                  value={formData.chapter}
                  onValueChange={(value) => setFormData({ ...formData, chapter: value })}
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your chapter/state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  disabled={!editMode}
                  placeholder="+234 802 345 6789"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Last changed{" "}
                      {profile.updatedAt
                        ? new Date(profile.updatedAt).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowPasswordDialog(true)}>Change Password</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.emailVerified
                        ? "Your email is verified"
                        : "Please verify your email"}
                    </p>
                  </div>
                </div>
                {profile.emailVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Button variant="outline" size="sm">
                    Verify
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details and history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-sm">{profile.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Account Type</span>
                <Badge>{profile.role}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {editMode && (
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateProfile} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
