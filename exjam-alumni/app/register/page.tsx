"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle,
  Shield,
  Star,
  Calendar,
  UserCheck,
  Building,
  Sparkles,
} from "lucide-react";

interface RegistrationType {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  features: string[];
  recommended?: boolean;
}

export default function RegisterTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const registrationTypes: RegistrationType[] = [
    {
      id: "alumni",
      title: "Alumni Member",
      description: "For verified Ex-Junior Airmen from Air Force Military School Jos",
      href: "/register-alumni",
      icon: <GraduationCap className="h-6 w-6" />,
      badge: "Verified",
      recommended: true,
      features: [
        "Full alumni directory access",
        "Alumni events access",
        "Squadron reunions",
        "Career networking",
        "Mentorship programs",
        "Alumni badge & certificates",
      ],
    },
    {
      id: "general",
      title: "General Member",
      description: "For supporters, family members, and friends of AFMS alumni",
      href: "/register/general",
      icon: <Users className="h-6 w-6" />,
      badge: "Open Access",
      features: [
        "Public events access",
        "Community newsletters",
        "General networking",
        "Social events",
        "Support AFMS initiatives",
      ],
    },
  ];

  // Check for redirect parameters
  useEffect(() => {
    const type = searchParams.get("type");
    const eventId = searchParams.get("event");

    if (type === "alumni") {
      if (eventId) {
        // Event-specific alumni registration
        router.push(`/events/${eventId}/register`);
      } else {
        // General alumni registration
        router.push("/register-alumni");
      }
    } else if (type === "general") {
      router.push("/register/general");
    }
  }, [searchParams, router]);

  const handleRegistrationSelect = (type: RegistrationType) => {
    setSelectedType(type.id);

    // Add some delay for visual feedback then redirect
    setTimeout(() => {
      router.push(type.href);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-16">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-10 translate-x-20 transform rounded-full bg-yellow-500 opacity-10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-20 translate-y-10 transform rounded-full bg-green-500 opacity-10 blur-3xl" />
        </div>

        <div className="container relative z-10 text-center">
          <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Join The EXJAM Association
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-blue-100">
            Select the registration type that best describes you and unlock your community benefits
          </p>
        </div>
      </section>

      {/* Registration Options */}
      <section className="container relative z-10 -mt-10 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {registrationTypes.map((type) => (
              <Card
                key={type.id}
                className={`group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  type.recommended
                    ? "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
                    : "border-gray-200 bg-white hover:border-blue-200"
                } ${selectedType === type.id ? "border-blue-500 ring-4 ring-blue-500/20" : ""}`}
                onClick={() => handleRegistrationSelect(type)}
              >
                {type.recommended && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold text-white">Recommended for Alumni</span>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                    {type.icon}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      <CardTitle className="text-2xl font-bold">{type.title}</CardTitle>
                      {type.badge && (
                        <Badge
                          variant={type.recommended ? "default" : "secondary"}
                          className={type.recommended ? "bg-blue-600" : ""}
                        >
                          {type.badge}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      {type.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="mb-6 space-y-3">
                    <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      What you'll get:
                    </h4>
                    <ul className="space-y-2">
                      {type.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`h-12 w-full rounded-xl font-semibold transition-all duration-300 ${
                      type.recommended
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700"
                        : "bg-gray-900 hover:bg-gray-800"
                    }`}
                    disabled={selectedType === type.id}
                  >
                    {selectedType === type.id ? (
                      "Redirecting..."
                    ) : (
                      <>
                        {type.recommended ? "Start Alumni Registration" : "Start Registration"}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>


        </div>
      </section>
    </div>
  );
}
