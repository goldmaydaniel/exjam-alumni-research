"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mail,
  User,
  Phone,
  MapPin,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  relationship: string;
  location: string;
  interests: string;
  newsletter: boolean;
  terms: boolean;
}

export default function GeneralRegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    relationship: "",
    location: "",
    interests: "",
    newsletter: true,
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.firstName) errors.push("First name is required");
    if (!formData.lastName) errors.push("Last name is required");
    if (!formData.email) errors.push("Email is required");
    if (!formData.password) errors.push("Password is required");
    if (formData.password !== formData.confirmPassword) errors.push("Passwords don't match");
    if (formData.password.length < 8) errors.push("Password must be at least 8 characters");
    if (!formData.phone) errors.push("Phone number is required");
    if (!formData.relationship) errors.push("Please select your relationship to AFMS");
    if (!formData.terms) errors.push("You must agree to the terms and conditions");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);

    try {
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
          userType: "GENERAL",
          profile: {
            relationship: formData.relationship,
            location: formData.location,
            interests: formData.interests,
          },
          newsletter: formData.newsletter,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Registration successful! Please check your email to verify your account.");
      router.push(
        "/login?message=Registration successful! Please check your email to verify your account."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-blue-600 py-16">
        <div className="absolute inset-0 bg-black/10" />
        <div className="container relative z-10 text-center">
          <Button
            variant="ghost"
            className="mb-6 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => router.push("/register")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registration Options
          </Button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Users className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">General Member</span>
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Join Our Community
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Support the AFMS alumni community and stay connected with our events and initiatives
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <section className="container relative z-10 -mt-10 pb-20">
        <div className="mx-auto max-w-2xl">
          <Card className="overflow-hidden rounded-3xl border-0 bg-white/95 shadow-2xl backdrop-blur-sm">
            <CardHeader className="p-8 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-blue-100 text-green-600">
                <Heart className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-black text-gray-900">
                General Registration
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create your account to join our supportive community
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="John"
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Doe"
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+234 800 000 0000"
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        className="rounded-xl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        placeholder="Repeat password"
                        required
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Community Connection */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Heart className="h-5 w-5 text-green-600" />
                    Community Connection
                  </h3>

                  <div>
                    <Label htmlFor="relationship">Your relationship to AFMS *</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => handleInputChange("relationship", value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select your connection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent of Alumni</SelectItem>
                        <SelectItem value="spouse">Spouse of Alumni</SelectItem>
                        <SelectItem value="sibling">Sibling of Alumni</SelectItem>
                        <SelectItem value="friend">Friend of Alumni</SelectItem>
                        <SelectItem value="supporter">Community Supporter</SelectItem>
                        <SelectItem value="staff">Former/Current AFMS Staff</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Lagos, Nigeria"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="interests">Interests & How You'd Like to Help (Optional)</Label>
                    <Textarea
                      id="interests"
                      value={formData.interests}
                      onChange={(e) => handleInputChange("interests", e.target.value)}
                      placeholder="Tell us about your interests and how you'd like to support the AFMS community..."
                      rows={3}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Agreements */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 rounded-xl bg-gray-50 p-4">
                    <Checkbox
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) => handleInputChange("newsletter", !!checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="newsletter" className="flex-1 cursor-pointer text-sm">
                      Subscribe to our newsletter and updates about events and community news
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <Checkbox
                      id="terms"
                      checked={formData.terms}
                      onCheckedChange={(checked) => handleInputChange("terms", !!checked)}
                      required
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="flex-1 cursor-pointer text-sm">
                      I agree to the{" "}
                      <Link href="/terms" className="font-semibold text-blue-600 hover:underline">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="font-semibold text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      *
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full transform rounded-2xl bg-gradient-to-r from-green-600 to-blue-600 text-lg font-bold shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:from-green-700 hover:to-blue-700 hover:shadow-2xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-3 h-5 w-5" />
                      Join The Community
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
