"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Phone, MapPin, AlertCircle } from "lucide-react";

const yearOptions = Array.from({ length: 45 }, (_, i) => 1980 + i);
const squadrons = ["Green", "Red", "Purple", "Yellow", "Dornier", "Puma"];
const chapters = [
  "Abuja FCT",
  "Lagos",
  "Jos",
  "Kaduna",
  "Port Harcourt",
  "Kano",
  "Enugu",
  "Ibadan",
  "International",
  "Other",
];

export default function PGConferenceRegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    serviceNumber: "",
    graduationYear: "",
    squadron: "",
    email: "",
    phone: "",
    chapter: "",
    currentLocation: "",
    emergencyContact: "",
    arrivalDate: "",
    departureDate: "",
    expectations: "",
    comments: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700">
              <span className="text-lg font-bold text-white">PG</span>
            </div>
            <div>
              <CardTitle className="text-2xl">PG Conference 2025 Registration</CardTitle>
              <CardDescription>
                President General's Maiden Flight • Nov 28-30, 2025 • NAF Conference Centre, Abuja
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-blue-600" />
                Personal Information
              </div>
              <p className="text-sm text-gray-600">Your official AFMS alumni details</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">
                    Full Name (as it appears on official documents) *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full legal name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="serviceNumber">Service Number</Label>
                  <Input
                    id="serviceNumber"
                    name="serviceNumber"
                    value={formData.serviceNumber}
                    onChange={handleChange}
                    placeholder="Your AFMS service number"
                  />
                </div>

                <div>
                  <Label htmlFor="graduationYear">Set *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("graduationYear", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your graduation year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="squadron">Squadron *</Label>
                  <Select onValueChange={(value) => handleSelectChange("squadron", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your squadron" />
                    </SelectTrigger>
                    <SelectContent>
                      {squadrons.map((squadron) => (
                        <SelectItem key={squadron} value={squadron}>
                          {squadron}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Phone className="h-5 w-5 text-green-600" />
                Contact Information
              </div>
              <p className="text-sm text-gray-600">Your contact details for event communication</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="email">Email Address (for confirmation and updates) *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="We'll use this to send you event updates and confirmation"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Include country code (e.g., +234 for Nigeria)"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="chapter">Chapter (Select your chapter location) *</Label>
                  <Select onValueChange={(value) => handleSelectChange("chapter", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the chapter/state where you are based" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter} value={chapter}>
                          {chapter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="currentLocation">
                    Current Location (City, State/Province, Country) *
                  </Label>
                  <Input
                    id="currentLocation"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleChange}
                    placeholder="Your current residence for event planning"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="emergencyContact">
                    Emergency Contact (Name and Phone Number) *
                  </Label>
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Contact person in case of emergency during the event"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Travel Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-purple-600" />
                Travel Information
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="arrivalDate">Expected Arrival Date *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("arrivalDate", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select arrival date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nov27">
                        November 27th, 2025 (Day before conference)
                      </SelectItem>
                      <SelectItem value="nov28">
                        November 28th, 2025 (Conference start day)
                      </SelectItem>
                      <SelectItem value="other">Other date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="departureDate">Expected Departure Date *</Label>
                  <Select
                    onValueChange={(value) => handleSelectChange("departureDate", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select departure date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nov30">
                        November 30th, 2025 (Conference end day)
                      </SelectItem>
                      <SelectItem value="dec1">
                        December 1st, 2025 (Day after conference)
                      </SelectItem>
                      <SelectItem value="other">Other date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5 text-yellow-600" />
                Additional Information
              </div>

              <div>
                <Label htmlFor="expectations">
                  What do you hope to gain from attending the PG Conference?
                </Label>
                <Textarea
                  id="expectations"
                  name="expectations"
                  value={formData.expectations}
                  onChange={handleChange}
                  placeholder="Your goals and expectations for the event"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="comments">Additional Comments or Special Requests</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  placeholder="Any other information or special requests"
                  rows={3}
                />
              </div>
            </div>

            {/* Information Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="mb-1 font-semibold">Important Information:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Registration fee covers conference materials and refreshments</li>
                    <li>Accommodation and transportation are to be arranged independently</li>
                    <li>A confirmation email will be sent within 24 hours of registration</li>
                    <li>For assistance, contact: info@exjam.org.ng</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-4">
              <Button type="submit" className="w-full" size="lg">
                Complete Registration for PG Conference 2025
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already registered?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in to view your registration
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
