"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Users,
  Shield,
  Calendar,
  Award,
  Building,
  Globe,
  Star,
  Zap,
  Heart,
  Briefcase,
  GraduationCap,
  UserPlus,
  ArrowRight,
} from "lucide-react";

const MEMBERSHIP_BENEFITS = [
  {
    icon: Users,
    title: "Alumni Network Access",
    description: "Connect with fellow EXJAM alumni worldwide",
  },
  {
    icon: Calendar,
    title: "Special Events",
    description: "Access to reunions, conferences, and special gatherings",
  },
  {
    icon: Shield,
    title: "Verified Profile",
    description: "Official verification badge on your alumni profile",
  },
  {
    icon: Building,
    title: "Chapter Activities",
    description: "Participate in local chapter meetings and initiatives",
  },
  {
    icon: Award,
    title: "Recognition Programs",
    description: "Eligibility for alumni awards and honors",
  },
  {
    icon: Briefcase,
    title: "Career Support",
    description: "Job opportunities and networking",
  },
  {
    icon: Heart,
    title: "Give Back",
    description: "Mentorship and support programs for current cadets",
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Join alumni chapters in 15+ countries",
  },
];

const MEMBERSHIP_TIERS = [
  {
    name: "Annual Membership",
    price: "₦10,000",
    period: "/year",
    description: "Perfect for staying connected",
    features: [
      "Full alumni directory access",
      "Event invitations",
      "Verified profile badge",
      "Chapter participation",
      "Quarterly newsletter",
      "Voting rights",
    ],
    popular: false,
  },
  {
    name: "Lifetime Membership",
    price: "₦150,000",
    period: "one-time",
    description: "Best value for committed alumni",
    features: [
      "All annual benefits",
      "Lifetime verification",
      "Priority event booking",
      "Special recognition",
      "Guest passes to events",
      "Lifetime member status",
      "Special lifetime badge",
      "Mentorship opportunities",
    ],
    popular: true,
  },
  {
    name: "Student Membership",
    price: "₦5,000",
    period: "/year",
    description: "For recent graduates (within 2 years)",
    features: [
      "Alumni directory access",
      "Career resources",
      "Networking events",
      "Mentorship matching",
      "Job board access",
    ],
    popular: false,
  },
];

const SQUADRON_COLORS = {
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500",
  dornier: "bg-blue-500",
  puma: "bg-gray-600",
};

export default function MembershipPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="outline">
              <Star className="mr-1 h-3 w-3" />
              The ExJAM Association
            </Badge>
            <h1 className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              Become a Member
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              Join the Air Force Military School alumni network. Connect, contribute, and continue
              the tradition of excellence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/membership/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <UserPlus className="mr-2 h-5 w-5" />
                  Join Now
                </Button>
              </Link>
              <Link href="/alumni">
                <Button size="lg" variant="outline">
                  View Alumni Directory
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Squadron Bar */}
      <section className="border-y bg-white py-8">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <span className="text-sm font-semibold text-gray-600">OUR SQUADRONS:</span>
            {Object.entries(SQUADRON_COLORS).map(([squadron, color]) => (
              <div key={squadron} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${color}`}></div>
                <span className="text-sm font-bold capitalize">{squadron}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Membership Benefits</h2>
            <p className="text-gray-600">
              Your gateway to a lifetime of connections and opportunities
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {MEMBERSHIP_BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="mb-2 font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="bg-gray-50 py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Choose Your Membership</h2>
            <p className="text-gray-600">
              Select the plan that best suits your commitment to the EXJAM community
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {MEMBERSHIP_TIERS.map((tier, index) => (
              <Card
                key={index}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  tier.popular ? "shadow-lg ring-2 ring-blue-500" : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <Zap className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-8">
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="ml-1 text-gray-600">/{tier.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/membership/register" className="mt-6 block">
                    <Button
                      className={`w-full ${
                        tier.popular ? "bg-gradient-to-r from-blue-600 to-indigo-600" : ""
                      }`}
                      variant={tier.popular ? "default" : "outline"}
                    >
                      Select {tier.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-white py-16">
        <div className="container">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-4xl font-bold text-blue-600">1500+</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-green-600">45+</div>
              <div className="text-gray-600">Years of Excellence</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-purple-600">15+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold text-yellow-600">6</div>
              <div className="text-gray-600">Squadrons</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container text-center">
          <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">
            Ready to Join the EXJAM Family?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
            Take the first step towards reconnecting with your squadron, accessing special benefits,
            and making a lasting impact.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/membership/register">
              <Button size="lg" variant="secondary" className="bg-white hover:bg-gray-100">
                <GraduationCap className="mr-2 h-5 w-5" />
                Create Your Alumni Profile
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            Already a member?{" "}
            <Link href="/login" className="underline">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* Motto */}
      <section className="bg-gray-900 py-8 text-center">
        <div className="container">
          <p className="text-lg font-bold text-yellow-400">"Strive to Excel"</p>
          <p className="mt-1 text-sm text-gray-400">
            The EXJAM Association • Air Force Military School Jos
          </p>
        </div>
      </section>
    </div>
  );
}
