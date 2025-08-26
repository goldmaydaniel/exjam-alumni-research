"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Globe,
  Heart,
  Shield,
  Target,
  Trophy,
  Users,
  GraduationCap,
  Building,
  Star,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";

// Animated counter component
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    let startTime: number;
    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 2000, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };
    if (isVisible) {
      requestAnimationFrame(animateCount);
    }
  }, [target, isVisible]);

  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [showAllLeaders, setShowAllLeaders] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const values = [
    {
      icon: Trophy,
      title: "Excellence",
      description: "Striving to excel in all endeavors",
      color: "text-yellow-600",
      bgColor: "bg-gradient-to-br from-yellow-50 to-orange-50",
      borderColor: "border-yellow-200",
    },
    {
      icon: Shield,
      title: "Discipline",
      description: "Military precision in thought and action",
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
    },
    {
      icon: Users,
      title: "Brotherhood",
      description: "United bonds that last a lifetime",
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
      borderColor: "border-green-200",
    },
    {
      icon: Heart,
      title: "Service",
      description: "Dedication to nation and community",
      color: "text-red-600",
      bgColor: "bg-gradient-to-br from-red-50 to-pink-50",
      borderColor: "border-red-200",
    },
  ];

  const milestones = [
    {
      year: "1980",
      title: "Foundation",
      description: "AFMS established on August 18, 1980 by Nigerian Air Force",
      icon: Building,
      color: "from-blue-500 to-indigo-600",
    },
    {
      year: "1987",
      title: "First Graduation",
      description: "Pioneer set of Junior Airmen graduate",
      icon: GraduationCap,
      color: "from-green-500 to-emerald-600",
    },
    {
      year: "2005",
      title: "Silver Jubilee",
      description: "25 years of excellence and discipline",
      icon: Award,
      color: "from-yellow-500 to-orange-600",
    },
    {
      year: "2022",
      title: "3,794 Graduates",
      description: "Over 3,794 Junior Airmen have graduated",
      icon: Users,
      color: "from-purple-500 to-pink-600",
    },
    {
      year: "2025",
      title: "45th Anniversary",
      description: "Continuing the legacy of excellence",
      icon: Star,
      color: "from-red-500 to-rose-600",
    },
  ];

  const allLeadership = [
    {
      name: "Ahmed A. Mimi",
      role: "President General",
      squadron: "Green",
      year: "'88",
      svc: "88/886",
    },
    { name: "Francis Odim", role: "Vice President", squadron: "Red", year: "'00", svc: "00/2749" },
    {
      name: "Ikechukwu S. Oparah",
      role: "Secretary General",
      squadron: "Purple",
      year: "'88",
      svc: "88/986",
    },
    {
      name: "Muhammed Bello Buhari",
      role: "Asst. Secretary General",
      squadron: "Dornier",
      year: "'08",
      svc: "08/3979",
    },
    {
      name: "David Obadiah",
      role: "Public Relations Officer",
      squadron: "Yellow",
      year: "'95",
      svc: "95/2147",
    },
    {
      name: "Aminu Lawal Dangaji",
      role: "Financial Secretary",
      squadron: "Purple",
      year: "'90",
      svc: "90/1279",
    },
    {
      name: "Great Chimmeka Osu",
      role: "National Treasurer",
      squadron: "Puma",
      year: "'02",
      svc: "02/3023",
    },
    {
      name: "Adebayo Johnson",
      role: "Welfare Officer",
      squadron: "Green",
      year: "'92",
      svc: "92/1456",
    },
  ];

  const leadership = showAllLeaders ? allLeadership : allLeadership.slice(0, 4);

  const squadronColors = {
    Alpha: "from-red-500 to-red-600",
    Jaguar: "from-green-500 to-green-600",
    Dornier: "from-blue-500 to-blue-600",
    Puma: "from-orange-500 to-orange-600",
    Green: "from-green-500 to-green-600",
    Red: "from-red-500 to-red-600",
    Purple: "from-purple-500 to-purple-600",
    Yellow: "from-yellow-500 to-yellow-600",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-24">
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-blue-100 opacity-30 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-indigo-100 opacity-30 blur-3xl"></div>

        <div className="container relative">
          <div
            className={`mx-auto max-w-4xl transform text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >


            <h1 className="mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl lg:text-7xl">
              The EXJAM Association
            </h1>

            <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-600 md:text-2xl">
              Alumni of the Air Force Military School Jos, united by shared values and a commitment
              to excellence
            </p>

            <div className="mx-auto grid max-w-3xl grid-cols-3 gap-8">
              <div className="rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
                  <AnimatedCounter target={3794} suffix="+" />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600">Alumni Worldwide</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-4xl font-bold text-transparent">
                  <AnimatedCounter target={45} />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600">Years Active</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
                  <AnimatedCounter target={6} />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600">Squadrons</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Enhanced Cards */}
      <section className="bg-gray-50 py-24">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Our Purpose</h2>
              <p className="text-lg text-gray-600">
                Guiding principles that drive our association forward
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="group overflow-hidden border-0 shadow-lg transition-all hover:shadow-2xl">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 transition-transform group-hover:scale-110">
                    <Target className="h-7 w-7 text-yellow-600" />
                  </div>
                  <CardTitle className="text-2xl">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-gray-600">
                    To foster a strong network of AFMS alumni, promoting lifelong friendships,
                    professional growth, and service to Nigeria while upholding our motto "Strive to
                    Excel"
                  </p>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-0 shadow-lg transition-all hover:shadow-2xl">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <CardHeader className="pb-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 transition-transform group-hover:scale-110">
                    <Globe className="h-7 w-7 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed text-gray-600">
                    To be the premier Ex-Junior Airmen association bridging generations, creating
                    opportunities for mentorship and collective impact on Nigeria's development
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values - Enhanced Grid */}
      <section className="bg-white py-24">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Our Core Values</h2>
              <p className="text-lg text-gray-600">The principles that define our character</p>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {values.map((value, index) => (
                <div key={index} className="group">
                  <div
                    className={`${value.bgColor} ${value.borderColor} h-full cursor-pointer rounded-2xl border-2 p-8 transition-transform hover:scale-105`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
                        <value.icon className={`h-8 w-8 ${value.color}`} />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900">{value.title}</h3>
                      <p className="text-sm text-gray-600">{value.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* History Timeline - Enhanced Horizontal */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="container">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Our Journey</h2>
              <p className="text-lg text-gray-600">45 years of excellence and growing</p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-0 right-0 top-24 hidden h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 md:block"></div>

              {/* Timeline Items */}
              <div className="grid gap-8 md:grid-cols-5">
                {milestones.map((milestone, index) => (
                  <div key={index} className="group relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-16 w-16 bg-gradient-to-br ${milestone.color} z-10 mb-4 flex items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110`}
                      >
                        <milestone.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
                        <p className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent">
                          {milestone.year}
                        </p>
                        <h3 className="mb-2 font-bold text-gray-900">{milestone.title}</h3>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section - Enhanced */}
      <section className="bg-white py-24">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Leadership</h2>
              <p className="text-lg text-gray-600">2025-2027 National Executive Committee</p>
            </div>

            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {leadership.map((leader, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-gradient-to-b from-gray-50 to-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={`h-24 w-24 bg-gradient-to-br ${squadronColors[leader.squadron as keyof typeof squadronColors]} mx-auto mb-4 flex items-center justify-center rounded-full text-xl font-bold text-white shadow-lg`}
                  >
                    {leader.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900">{leader.name}</h3>
                    <p className="mb-2 text-sm text-gray-600">{leader.role}</p>
                    <p className="text-xs text-blue-700">
                      {leader.squadron} {leader.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => setShowAllLeaders(!showAllLeaders)}
                variant="outline"
                className="transition-colors hover:bg-blue-50"
              >
                {showAllLeaders ? "Show Less" : "View All EXCO Members"}
                <ChevronRight
                  className={`ml-2 h-4 w-4 transition-transform ${showAllLeaders ? "rotate-90" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Squadrons Grid - Enhanced */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Our Squadrons</h2>
              <p className="text-lg text-gray-600">Four squadrons, one brotherhood</p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Object.entries(squadronColors)
                .slice(0, 4)
                .map(([name, gradient]) => (
                  <div key={name} className="group cursor-pointer">
                    <div
                      className={`relative bg-gradient-to-br ${gradient} flex h-40 flex-col items-center justify-center overflow-hidden rounded-2xl text-white shadow-lg transition-all hover:scale-105 hover:shadow-2xl`}
                    >
                      <div className="absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-10"></div>
                      <Star className="mb-2 h-10 w-10" />
                      <p className="font-bold">{name}</p>
                      <p className="text-xs opacity-90">Squadron</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notable Alumni Section */}
      <section className="bg-white py-24">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">Distinguished Alumni</h2>
              <p className="text-lg text-gray-600">
                Ex-Junior Airmen making their mark across sectors
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-b from-blue-50 to-white p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white">
                  AVM
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Air Vice Marshal Abiola I. Amodu
                  </h3>
                  <p className="mb-2 text-sm text-blue-600">Chief of Aircraft Engineering, NAF</p>
                  <p className="text-xs text-gray-600">AFMS Jos Class of 1987</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Leading aviation engineering excellence
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-b from-green-50 to-white p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-xl font-bold text-white">
                  CEO
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">Dr. Adebayo Johnson</h3>
                  <p className="mb-2 text-sm text-green-600">Healthcare Innovation Leader</p>
                  <p className="text-xs text-gray-600">AFMS Jos Class of 1992</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Pioneering medical technology solutions
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-b from-purple-50 to-white p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-xl font-bold text-white">
                  HON
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">Hon. Muhammad Bello</h3>
                  <p className="mb-2 text-sm text-purple-600">Public Service Excellence</p>
                  <p className="text-xs text-gray-600">AFMS Jos Class of 1995</p>
                  <p className="mt-2 text-xs text-gray-500">Serving communities with distinction</p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="mb-4 text-gray-600">
                AFMS has produced military officers and highly placed civilians across Nigeria
              </p>
              <Link href="/alumni">
                <Button variant="outline" className="transition-colors hover:bg-blue-50">
                  View Alumni Directory
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 py-24 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">

            <h2 className="mb-6 text-4xl font-bold md:text-5xl">Join The EXJAM Association</h2>
            <p className="mb-10 text-xl text-blue-100">
              Connect with Ex-Junior Airmen making a difference worldwide
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white px-8 py-6 text-lg font-semibold text-blue-900 shadow-xl hover:bg-gray-100"
                >
                  Become a Member
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white px-8 py-6 text-lg font-semibold text-white hover:bg-white/10"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
