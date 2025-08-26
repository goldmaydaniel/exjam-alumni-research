"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, GraduationCap, MapPin, Users, Shield } from "lucide-react";

// Step 1: Personal Information
const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
});

export function PersonalInfoStep({ formData, onDataChange, goToNext }: any) {
  const form = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: formData?.firstName || "",
      lastName: formData?.lastName || "",
      email: formData?.email || "",
      phone: formData?.phone || "",
    },
  });

  const onSubmit = (data: any) => {
    onDataChange(data);
    goToNext?.();
  };

  // Auto-save on field changes
  const handleFieldChange = (field: string, value: string) => {
    form.setValue(field as any, value);
    onDataChange({ [field]: value });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold">
              <User className="w-4 h-4 text-blue-600" />
              First Name *
            </Label>
            <Input
              id="firstName"
              {...form.register("firstName")}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              className="h-12 text-base" // Larger for mobile
              placeholder="Your first name"
              autoComplete="given-name"
            />
            {form.formState.errors.firstName && (
              <p className="text-red-600 text-sm">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold">
              <User className="w-4 h-4 text-blue-600" />
              Last Name *
            </Label>
            <Input
              id="lastName"
              {...form.register("lastName")}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              className="h-12 text-base"
              placeholder="Your last name"
              autoComplete="family-name"
            />
            {form.formState.errors.lastName && (
              <p className="text-red-600 text-sm">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold">
            <Mail className="w-4 h-4 text-blue-600" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            className="h-12 text-base"
            placeholder="your.email@example.com"
            autoComplete="email"
          />
          {form.formState.errors.email && (
            <p className="text-red-600 text-sm">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="w-4 h-4 text-blue-600" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            className="h-12 text-base"
            placeholder="+234 XXX XXX XXXX"
            autoComplete="tel"
          />
          {form.formState.errors.phone && (
            <p className="text-red-600 text-sm">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Mobile: Show continue button */}
      <div className="block sm:hidden pt-4">
        <Button type="submit" className="w-full h-12 text-base">
          Continue to Alumni Info
        </Button>
      </div>
    </form>
  );
}

// Step 2: Alumni Information
const alumniInfoSchema = z.object({
  scvNo: z.string().min(2, "SCV No is required"),
  squadron: z.string().min(2, "Squadron is required"),
  currentLocation: z.string().min(2, "Current location is required"),
});

export function AlumniInfoStep({ formData, onDataChange, goToNext }: any) {
  const form = useForm({
    resolver: zodResolver(alumniInfoSchema),
    defaultValues: {
      scvNo: formData?.scvNo || "",
      squadron: formData?.squadron || "",
      currentLocation: formData?.currentLocation || "",
    },
  });

  const onSubmit = (data: any) => {
    onDataChange(data);
    goToNext?.();
  };

  const handleFieldChange = (field: string, value: string) => {
    form.setValue(field as any, value);
    onDataChange({ [field]: value });
  };

  const squadrons = ["Blue", "Green", "Purple", "Yellow", "Red"];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="scvNo" className="flex items-center gap-2 text-sm font-semibold">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            SCV Number *
          </Label>
          <Input
            id="scvNo"
            {...form.register("scvNo")}
            onChange={(e) => handleFieldChange("scvNo", e.target.value)}
            className="h-12 text-base"
            placeholder="e.g. SCV123456"
          />
          {form.formState.errors.scvNo && (
            <p className="text-red-600 text-sm">{form.formState.errors.scvNo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="squadron" className="flex items-center gap-2 text-sm font-semibold">
            <Users className="w-4 h-4 text-blue-600" />
            Squadron *
          </Label>
          <Select 
            onValueChange={(value) => {
              form.setValue("squadron", value);
              handleFieldChange("squadron", value);
            }}
            defaultValue={formData?.squadron}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select your squadron" />
            </SelectTrigger>
            <SelectContent>
              {squadrons.map((squadron) => (
                <SelectItem key={squadron} value={squadron} className="text-base py-3">
                  {squadron} Squadron
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.squadron && (
            <p className="text-red-600 text-sm">{form.formState.errors.squadron.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentLocation" className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="w-4 h-4 text-blue-600" />
            Current Location *
          </Label>
          <Input
            id="currentLocation"
            {...form.register("currentLocation")}
            onChange={(e) => handleFieldChange("currentLocation", e.target.value)}
            className="h-12 text-base"
            placeholder="City, State/Country"
          />
          {form.formState.errors.currentLocation && (
            <p className="text-red-600 text-sm">{form.formState.errors.currentLocation.message}</p>
          )}
        </div>
      </div>

      <div className="block sm:hidden pt-4">
        <Button type="submit" className="w-full h-12 text-base">
          Continue to Additional Info
        </Button>
      </div>
    </form>
  );
}

// Step 3: Additional Information (Optional)
export function AdditionalInfoStep({ formData, onDataChange, goToNext }: any) {
  const form = useForm({
    defaultValues: {
      emergencyContact: formData?.emergencyContact || "",
      dietaryRequirements: formData?.dietaryRequirements || "",
      accommodation: formData?.accommodation || false,
    },
  });

  const onSubmit = (data: any) => {
    onDataChange(data);
    goToNext?.();
  };

  const handleFieldChange = (field: string, value: any) => {
    form.setValue(field as any, value);
    onDataChange({ [field]: value });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyContact" className="text-sm font-semibold">
            Emergency Contact (Optional)
          </Label>
          <Input
            id="emergencyContact"
            {...form.register("emergencyContact")}
            onChange={(e) => handleFieldChange("emergencyContact", e.target.value)}
            className="h-12 text-base"
            placeholder="Name and phone number"
          />
          <p className="text-xs text-gray-500">Someone we can contact in case of emergency</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dietaryRequirements" className="text-sm font-semibold">
            Dietary Requirements (Optional)
          </Label>
          <Textarea
            id="dietaryRequirements"
            {...form.register("dietaryRequirements")}
            onChange={(e) => handleFieldChange("dietaryRequirements", e.target.value)}
            className="text-base min-h-[80px]"
            placeholder="Any food allergies or special requirements..."
          />
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            id="accommodation"
            checked={form.watch("accommodation")}
            onCheckedChange={(checked) => {
              form.setValue("accommodation", !!checked);
              handleFieldChange("accommodation", !!checked);
            }}
          />
          <Label htmlFor="accommodation" className="text-sm font-medium cursor-pointer">
            I need accommodation assistance
          </Label>
        </div>
      </div>

      <div className="block sm:hidden pt-4">
        <Button type="submit" className="w-full h-12 text-base">
          Continue to Final Step
        </Button>
      </div>
    </form>
  );
}

// Step 4: Terms and Confirmation
export function TermsConfirmationStep({ formData, onDataChange, goToNext }: any) {
  const form = useForm({
    defaultValues: {
      termsAccepted: formData?.termsAccepted || false,
      emailUpdates: formData?.emailUpdates || true,
    },
  });

  const onSubmit = (data: any) => {
    if (!data.termsAccepted) {
      form.setError("termsAccepted", { message: "You must accept terms to continue" });
      return;
    }
    onDataChange(data);
    goToNext?.();
  };

  const handleFieldChange = (field: string, value: any) => {
    form.setValue(field as any, value);
    onDataChange({ [field]: value });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
        {/* Registration Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">Registration Summary</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Name:</strong> {formData?.firstName} {formData?.lastName}</p>
            <p><strong>Email:</strong> {formData?.email}</p>
            <p><strong>Squadron:</strong> {formData?.squadron} Squadron</p>
            <p><strong>Location:</strong> {formData?.currentLocation}</p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 border border-red-200 rounded-lg">
            <Checkbox
              id="termsAccepted"
              checked={form.watch("termsAccepted")}
              onCheckedChange={(checked) => {
                form.setValue("termsAccepted", !!checked);
                handleFieldChange("termsAccepted", !!checked);
              }}
              className="mt-1"
            />
            <Label htmlFor="termsAccepted" className="text-sm cursor-pointer">
              <strong className="text-red-600">*</strong> I accept the{" "}
              <a href="/terms" className="text-blue-600 underline" target="_blank">
                terms and conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-600 underline" target="_blank">
                privacy policy
              </a>
            </Label>
          </div>
          {form.formState.errors.termsAccepted && (
            <p className="text-red-600 text-sm">{form.formState.errors.termsAccepted.message}</p>
          )}

          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="emailUpdates"
              checked={form.watch("emailUpdates")}
              onCheckedChange={(checked) => {
                form.setValue("emailUpdates", !!checked);
                handleFieldChange("emailUpdates", !!checked);
              }}
              className="mt-1"
            />
            <Label htmlFor="emailUpdates" className="text-sm cursor-pointer">
              Send me updates about ExJAM events and activities
            </Label>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Your information is encrypted and secure. Payment will be processed on the next page.
          </p>
        </div>
      </div>

      <div className="block sm:hidden pt-4">
        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-blue-600"
          disabled={!form.watch("termsAccepted")}
        >
          Complete Registration
        </Button>
      </div>
    </form>
  );
}