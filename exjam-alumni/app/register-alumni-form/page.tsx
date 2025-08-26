"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ServiceNumberInput } from "@/components/service-number-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  GraduationCap,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Shield,
  Briefcase,
  Building,
  FileText,
  ChevronRight,
  Camera,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import PhotoCapture from "@/components/photo-capture";
import { AssetManager, STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Squadron options based on the schema
const squadronOptions = ["GREEN", "RED", "PURPLE", "YELLOW", "DORNIER", "PUMA"];

// Chapter options - All 36 Nigerian States + FCT + International
const chapterOptions = [
  // FCT
  { value: "FCT_ABUJA", label: "FCT Abuja", state: "Federal Capital Territory" },

  // All 36 States (alphabetical order)
  { value: "ABIA", label: "Abia", state: "Abia State", capital: "Umuahia" },
  { value: "ADAMAWA", label: "Adamawa", state: "Adamawa State", capital: "Yola" },
  { value: "AKWA_IBOM", label: "Akwa Ibom", state: "Akwa Ibom State", capital: "Uyo" },
  { value: "ANAMBRA", label: "Anambra", state: "Anambra State", capital: "Awka" },
  { value: "BAUCHI", label: "Bauchi", state: "Bauchi State", capital: "Bauchi" },
  { value: "BAYELSA", label: "Bayelsa", state: "Bayelsa State", capital: "Yenagoa" },
  { value: "BENUE", label: "Benue", state: "Benue State", capital: "Makurdi" },
  { value: "BORNO", label: "Borno", state: "Borno State", capital: "Maiduguri" },
  { value: "CROSS_RIVER", label: "Cross River", state: "Cross River State", capital: "Calabar" },
  { value: "DELTA", label: "Delta", state: "Delta State", capital: "Asaba" },
  { value: "EBONYI", label: "Ebonyi", state: "Ebonyi State", capital: "Abakaliki" },
  { value: "EDO", label: "Edo", state: "Edo State", capital: "Benin City" },
  { value: "EKITI", label: "Ekiti", state: "Ekiti State", capital: "Ado Ekiti" },
  { value: "ENUGU", label: "Enugu", state: "Enugu State", capital: "Enugu" },
  { value: "GOMBE", label: "Gombe", state: "Gombe State", capital: "Gombe" },
  { value: "IMO", label: "Imo", state: "Imo State", capital: "Owerri" },
  { value: "JIGAWA", label: "Jigawa", state: "Jigawa State", capital: "Dutse" },
  { value: "KADUNA", label: "Kaduna", state: "Kaduna State", capital: "Kaduna" },
  { value: "KANO", label: "Kano", state: "Kano State", capital: "Kano" },
  { value: "KATSINA", label: "Katsina", state: "Katsina State", capital: "Katsina" },
  { value: "KEBBI", label: "Kebbi", state: "Kebbi State", capital: "Birnin Kebbi" },
  { value: "KOGI", label: "Kogi", state: "Kogi State", capital: "Lokoja" },
  { value: "KWARA", label: "Kwara", state: "Kwara State", capital: "Ilorin" },
  { value: "LAGOS", label: "Lagos", state: "Lagos State", capital: "Ikeja" },
  { value: "NASARAWA", label: "Nasarawa", state: "Nasarawa State", capital: "Lafia" },
  { value: "NIGER", label: "Niger", state: "Niger State", capital: "Minna" },
  { value: "OGUN", label: "Ogun", state: "Ogun State", capital: "Abeokuta" },
  { value: "ONDO", label: "Ondo", state: "Ondo State", capital: "Akure" },
  { value: "OSUN", label: "Osun", state: "Osun State", capital: "Osogbo" },
  { value: "OYO", label: "Oyo", state: "Oyo State", capital: "Ibadan" },
  { value: "PLATEAU", label: "Plateau", state: "Plateau State", capital: "Jos" },
  { value: "RIVERS", label: "Rivers", state: "Rivers State", capital: "Port Harcourt" },
  { value: "SOKOTO", label: "Sokoto", state: "Sokoto State", capital: "Sokoto" },
  { value: "TARABA", label: "Taraba", state: "Taraba State", capital: "Jalingo" },
  { value: "YOBE", label: "Yobe", state: "Yobe State", capital: "Damaturu" },
  { value: "ZAMFARA", label: "Zamfara", state: "Zamfara State", capital: "Gusau" },

  // International
  { value: "INTERNATIONAL", label: "International", state: "Outside Nigeria" },
];

interface FormStep {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
  }[];
  isPhotoStep?: boolean;
}

const steps: FormStep[] = [
  {
    id: "welcome",
    title: "Welcome to EXJAM Association",
    subtitle: "Let's get you registered as an alumni member",
    icon: <GraduationCap className="h-8 w-8" />,
    fields: [],
  },
  {
    id: "name",
    title: "What's your name?",
    subtitle: "Let's start with the basics",
    icon: <User className="h-8 w-8" />,
    fields: [
      { name: "firstName", label: "First Name", type: "text", placeholder: "John", required: true },
      { name: "lastName", label: "Last Name", type: "text", placeholder: "Doe", required: true },
    ],
  },
  {
    id: "photo",
    title: "Add your profile photo",
    subtitle: "This will be used for your profile and event badges",
    icon: <Camera className="h-8 w-8" />,
    fields: [],
    isPhotoStep: true,
  },
  {
    id: "contact",
    title: "How can we reach you?",
    subtitle: "We'll use this to keep you updated",
    icon: <Mail className="h-8 w-8" />,
    fields: [
      {
        name: "email",
        label: "Email Address",
        type: "email",
        placeholder: "john@example.com",
        required: true,
      },
      {
        name: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "+234 801 234 5678",
        required: false,
      },
    ],
  },
  {
    id: "password",
    title: "Create a secure password",
    subtitle: "You'll use this to access your account",
    icon: <Lock className="h-8 w-8" />,
    fields: [
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter a strong password",
        required: true,
      },
    ],
  },
  {
    id: "location",
    title: "Where are you currently based?",
    subtitle: "This helps us connect you with alumni in your area",
    icon: <MapPin className="h-8 w-8" />,
    fields: [
      {
        name: "currentLocation",
        label: "Current Location",
        type: "text",
        placeholder: "Lagos, Nigeria",
        required: false,
      },
    ],
  },
  {
    id: "alumni",
    title: "Your AFMS Details",
    subtitle: "These will be verified by our admin team",
    icon: <Shield className="h-8 w-8" />,
    fields: [
      {
        name: "serviceNumber",
        label: "Service Number",
        type: "text",
        placeholder: "NAF/123456",
        required: true,
      },
      {
        name: "squadron",
        label: "Squadron",
        type: "select",
        placeholder: "Select your squadron",
        required: true,
      },
      {
        name: "chapter",
        label: "Chapter",
        type: "select",
        placeholder: "Select your chapter",
        required: true,
      },
    ],
  },
  {
    id: "professional",
    title: "What do you do?",
    subtitle: "Optional - helps with networking",
    icon: <Briefcase className="h-8 w-8" />,
    fields: [
      {
        name: "currentOccupation",
        label: "Current Occupation",
        type: "text",
        placeholder: "Software Engineer",
        required: false,
      },
      {
        name: "company",
        label: "Company/Organization",
        type: "text",
        placeholder: "Tech Corp",
        required: false,
      },
    ],
  },
  {
    id: "bio",
    title: "Tell us about yourself",
    subtitle: "Optional - share your journey since AFMS",
    icon: <FileText className="h-8 w-8" />,
    fields: [
      {
        name: "bio",
        label: "Brief Bio",
        type: "textarea",
        placeholder: "Share your story...",
        required: false,
        rows: 4,
      },
    ],
  },
  {
    id: "preferences",
    title: "Stay connected",
    subtitle: "Choose your preferences",
    icon: <Mail className="h-8 w-8" />,
    fields: [
      {
        name: "newsletter",
        label: "Subscribe to newsletter and updates",
        type: "checkbox",
        required: false,
      },
    ],
  },
  {
    id: "terms",
    title: "Almost done!",
    subtitle: "Please review and accept our terms",
    icon: <Shield className="h-8 w-8" />,
    fields: [
      {
        name: "terms",
        label: "I agree to the Terms and Conditions and Privacy Policy",
        type: "checkbox",
        required: true,
      },
    ],
  },
];

export default function TypeformStyleRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [chapterOpen, setChapterOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    currentLocation: "",
    serviceNumber: "",
    squadron: "",
    chapter: "",
    currentOccupation: "",
    company: "",
    bio: "",
    newsletter: true,
    terms: false,
  });

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});

  useEffect(() => {
    // Auto-focus first input of current step
    const currentStepData = steps[currentStep];
    if (currentStepData.fields.length > 0) {
      const firstField = currentStepData.fields[0];
      setTimeout(() => {
        inputRefs.current[firstField.name]?.focus();
      }, 300);
    }
  }, [currentStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    if (currentStepData.id === "welcome") return true;

    // Check if photo step and photo is required
    if (currentStepData.isPhotoStep) {
      // Photo is optional, so always allow proceeding
      return true;
    }

    for (const field of currentStepData.fields) {
      if (field.required) {
        const value = formData[field.name as keyof typeof formData];
        if (!value || value === false) return false;
      }
    }
    return true;
  };

  const handlePhotoCapture = (photo: File | null) => {
    setProfilePhoto(photo);
    if (photo) {
      setProfilePhotoUrl(URL.createObjectURL(photo));
    } else {
      setProfilePhotoUrl("");
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const currentStepData = steps[currentStep];
      const isTextarea = currentStepData.fields.some((f) => f.type === "textarea");

      if (!isTextarea) {
        e.preventDefault();
        if (currentStep === steps.length - 1) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.terms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Prepare data for AFMS registration endpoint
      const registrationData = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        serviceNumber: formData.serviceNumber,
        squadron: formData.squadron,
        chapter: formData.chapter,
        currentLocation: formData.currentLocation,
        emergencyContact: formData.phone, // Use phone as emergency contact for now

        // Set default event dates (these could be made optional later)
        arrivalDate: new Date().toISOString(),
        departureDate: new Date(Date.now() + 86400000).toISOString(), // 24 hours later

        // Optional fields
        expectations: formData.bio || "",
        specialRequests: "",
        profilePhoto: profilePhotoUrl,

        // Mark as non-guest registration
        isGuest: false,
      };

      // Register with AFMS-specific endpoint
      const response = await fetch("/api/auth/register/afms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const userData = await response.json();

      toast.success("Registration successful! Welcome to The EXJAM Association.");
      router.push("/login?registered=true");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Progress Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Step Counter */}
          <div className="mb-8 text-center">
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl transition-all duration-500 md:p-12">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                {currentStepData.icon}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                {currentStepData.title}
              </h2>
              {currentStepData.subtitle && (
                <p className="text-gray-600">{currentStepData.subtitle}</p>
              )}
            </div>

            {/* Form Fields */}
            {currentStepData.isPhotoStep ? (
              <div className="space-y-6">
                <PhotoCapture
                  onPhotoCapture={handlePhotoCapture}
                  existingPhotoUrl={profilePhotoUrl}
                />

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevious}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {profilePhoto ? "Continue" : "Skip Photo"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : currentStepData.id === "welcome" ? (
              <div className="space-y-6 text-center">
                <p className="text-lg text-gray-700">
                  Connect with Air Force Military School alumni and stay updated with your fellow
                  Ex-Junior Airmen.
                </p>
                <Button
                  onClick={handleNext}
                  className="mx-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-lg hover:from-blue-700 hover:to-indigo-700"
                >
                  Let's Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6" onKeyPress={handleKeyPress}>
                {currentStepData.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    {field.type === "checkbox" ? (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={field.name}
                          checked={formData[field.name as keyof typeof formData] as boolean}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(field.name, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={field.name}
                          className="text-sm leading-relaxed text-gray-700"
                        >
                          {field.label}
                          {field.name === "terms" && (
                            <span className="mt-1 block">
                              <Link
                                href="/terms"
                                className="text-blue-600 hover:underline"
                                target="_blank"
                              >
                                Terms and Conditions
                              </Link>
                              {" and "}
                              <Link
                                href="/privacy"
                                className="text-blue-600 hover:underline"
                                target="_blank"
                              >
                                Privacy Policy
                              </Link>
                            </span>
                          )}
                        </label>
                      </div>
                    ) : field.type === "textarea" ? (
                      <>
                        <label className="text-sm font-medium text-gray-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Textarea
                          ref={(el) => {
                            inputRefs.current[field.name] = el;
                          }}
                          name={field.name}
                          value={formData[field.name as keyof typeof formData] as string}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          rows={field.rows || 3}
                          className="w-full rounded-lg border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
                          required={field.required}
                        />
                      </>
                    ) : field.type === "select" ? (
                      <>
                        <label className="text-sm font-medium text-gray-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.name === "chapter" ? (
                          <Popover open={chapterOpen} onOpenChange={setChapterOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={chapterOpen}
                                className="h-12 w-full justify-between rounded-lg border-gray-300 text-lg"
                              >
                                {formData.chapter
                                  ? chapterOptions.find(
                                      (chapter) => chapter.value === formData.chapter
                                    )?.label
                                  : field.placeholder}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="max-h-80 w-full p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search by state, capital, or region..."
                                  className="h-9"
                                />
                                <CommandList className="max-h-72">
                                  <CommandEmpty>
                                    No chapter found. Try a different search term.
                                  </CommandEmpty>

                                  {/* Federal Capital Territory */}
                                  <CommandGroup heading="🏛️ Federal Capital Territory">
                                    {chapterOptions
                                      .filter((chapter) => chapter.value === "FCT_ABUJA")
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} FCT`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  {/* States by regions */}
                                  <CommandGroup heading="🌍 South West">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        ["LAGOS", "OGUN", "OYO", "OSUN", "ONDO", "EKITI"].includes(
                                          chapter.value
                                        )
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} south west`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🌿 South East">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        ["ABIA", "ANAMBRA", "EBONYI", "ENUGU", "IMO"].includes(
                                          chapter.value
                                        )
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} south east`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🛢️ South South">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        [
                                          "AKWA_IBOM",
                                          "BAYELSA",
                                          "CROSS_RIVER",
                                          "DELTA",
                                          "EDO",
                                          "RIVERS",
                                        ].includes(chapter.value)
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} south south`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🏔️ North Central">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        [
                                          "BENUE",
                                          "KOGI",
                                          "KWARA",
                                          "NASARAWA",
                                          "NIGER",
                                          "PLATEAU",
                                        ].includes(chapter.value)
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} north central`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🏜️ North East">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        [
                                          "ADAMAWA",
                                          "BAUCHI",
                                          "BORNO",
                                          "GOMBE",
                                          "TARABA",
                                          "YOBE",
                                        ].includes(chapter.value)
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} north east`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🏛️ North West">
                                    {chapterOptions
                                      .filter((chapter) =>
                                        [
                                          "JIGAWA",
                                          "KADUNA",
                                          "KANO",
                                          "KATSINA",
                                          "KEBBI",
                                          "SOKOTO",
                                          "ZAMFARA",
                                        ].includes(chapter.value)
                                      )
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} ${chapter.capital} north west`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {chapter.state} • Capital: {chapter.capital}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>

                                  <CommandGroup heading="🌍 International">
                                    {chapterOptions
                                      .filter((chapter) => chapter.value === "INTERNATIONAL")
                                      .map((chapter) => (
                                        <CommandItem
                                          key={chapter.value}
                                          value={`${chapter.label} ${chapter.state} international diaspora overseas`}
                                          onSelect={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              chapter: chapter.value,
                                            }));
                                            setChapterOpen(false);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.chapter === chapter.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-1 flex-col">
                                            <span className="font-medium">{chapter.label}</span>
                                            <span className="text-sm text-muted-foreground">
                                              For alumni based outside Nigeria
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Select
                            name={field.name}
                            value={formData[field.name as keyof typeof formData] as string}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, [field.name]: value }))
                            }
                          >
                            <SelectTrigger className="w-full rounded-lg border-gray-300 text-lg">
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.name === "squadron"
                                ? squadronOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))
                                : null}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    ) : field.name === "password" ? (
                      <>
                        <label className="mb-2 block text-sm font-bold text-gray-700 sm:text-base">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <PasswordInput
                          ref={(el) => {
                            inputRefs.current[field.name] = el;
                          }}
                          name={field.name}
                          value={formData[field.name as keyof typeof formData] as string}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
                          required={field.required}
                        />
                      </>
                    ) : field.name === "serviceNumber" ? (
                      <>
                        <label className="mb-2 block text-sm font-bold text-gray-700 sm:text-base">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <ServiceNumberInput
                          ref={(el) => {
                            inputRefs.current[field.name] = el;
                          }}
                          name={field.name}
                          value={formData[field.name as keyof typeof formData] as string}
                          onChange={handleInputChange}
                          className="w-full rounded-lg text-lg"
                          required={field.required}
                          showValidation={true}
                        />
                      </>
                    ) : (
                      <>
                        <label className="mb-2 block text-sm font-bold text-gray-700 sm:text-base">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          ref={(el) => {
                            inputRefs.current[field.name] = el;
                          }}
                          type={field.type}
                          name={field.name}
                          value={formData[field.name as keyof typeof formData] as string}
                          onChange={handleInputChange}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
                          required={field.required}
                        />
                      </>
                    )}
                  </div>
                ))}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  {currentStep === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading || !canProceed()}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-6 hover:from-green-700 hover:to-emerald-700"
                    >
                      {loading ? "Creating Account..." : "Complete Registration"}
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Skip for optional fields */}
            {currentStep > 0 &&
              !currentStepData.fields.some((f) => f.required) &&
              currentStep !== steps.length - 1 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleNext}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Skip this step →
                  </button>
                </div>
              )}
          </div>

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
    </div>
  );
}
