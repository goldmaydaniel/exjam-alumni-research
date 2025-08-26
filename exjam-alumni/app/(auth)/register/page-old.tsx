"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Shield, User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    currentLocation: "",
    serviceNumber: "",
    squadron: "",
    currentOccupation: "",
    company: "",
    bio: "",
    newsletter: true,
    terms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.terms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // All registrations are alumni members pending verification
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          currentLocation: formData.currentLocation,
          serviceNumber: formData.serviceNumber,
          squadron: formData.squadron,
          currentOccupation: formData.currentOccupation,
          company: formData.company,
          bio: formData.bio,
          newsletter: formData.newsletter,
          verified: false, // Will be verified by admin
          role: "ALUMNI_MEMBER", // All registrations are alumni members
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data = await response.json();

      toast.success(
        "Registration successful! Your alumni status will be verified by admin within 24-48 hours."
      );

      router.push("/login?registered=true");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Alumni Registration</h1>
          <p className="text-gray-600">Register as an AFMS alumni member - verification by admin</p>
        </div>

        {/* Single Registration Form */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Alumni Member Registration
            </CardTitle>
            <CardDescription>
              Register as an alumni member. Your details will be verified by admin within 24-48
              hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="currentLocation">Current Location</Label>
                  <Input
                    id="currentLocation"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Alumni Details Section */}
              <div className="rounded-lg border-2 border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Alumni Details</h3>
                </div>
                <p className="mb-4 text-sm text-blue-700">
                  Provide your AFMS service details for verification. Admin will verify your alumni
                  status within 24-48 hours.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceNumber">Service Number *</Label>
                    <Input
                      id="serviceNumber"
                      name="serviceNumber"
                      value={formData.serviceNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., NAF/123456"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Your AFMS service number</p>
                  </div>
                  <div>
                    <Label htmlFor="squadron">Squadron *</Label>
                    <Input
                      id="squadron"
                      name="squadron"
                      value={formData.squadron}
                      onChange={handleInputChange}
                      placeholder="e.g., YANKEE"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Your squadron at AFMS</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentOccupation">Current Occupation</Label>
                  <Input
                    id="currentOccupation"
                    name="currentOccupation"
                    value={formData.currentOccupation}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Brief Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Newsletter and Terms */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("newsletter", checked as boolean)
                    }
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    Subscribe to newsletter and updates
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) => handleCheckboxChange("terms", checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
