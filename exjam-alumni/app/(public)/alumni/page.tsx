import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, MessageCircle, Calendar, Trophy, ArrowRight } from "lucide-react";

export default function AlumniPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
          ExJAM Network
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
          Connect with fellow Ex-Junior Airmen from Air Force Military School Jos. Build lasting
          professional relationships and support each other's growth across the globe.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/alumni/directory">
              <Users className="mr-2 h-5 w-5" />
              Browse Alumni Directory
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">
              Join the Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <CardHeader>
            <Users className="mx-auto mb-4 h-12 w-12 text-blue-600" />
            <CardTitle>Alumni Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Find and connect with alumni worldwide. Search by graduation year, industry, location,
              and interests.
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 text-center">
          <CardHeader>
            <MessageCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <CardTitle>Professional Networking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Build meaningful professional connections, find mentorship opportunities, and expand
              your network.
            </p>
          </CardContent>
        </Card>

        <Card className="p-6 text-center">
          <CardHeader>
            <Calendar className="mx-auto mb-4 h-12 w-12 text-purple-600" />
            <CardTitle>Events & Reunions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Stay updated on alumni events, reunions, and professional development opportunities.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="mb-16 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-8">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold">Alumni Network Impact</h2>
          <p className="text-gray-600">Building connections across generations and continents</p>
        </div>
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4">
          <div>
            <div className="mb-2 text-3xl font-bold text-blue-600">500+</div>
            <div className="text-gray-600">Alumni Members</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-green-600">25+</div>
            <div className="text-gray-600">Countries</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-purple-600">50+</div>
            <div className="text-gray-600">Industries</div>
          </div>
          <div>
            <div className="mb-2 text-3xl font-bold text-orange-600">30+</div>
            <div className="text-gray-600">Years Active</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <h2 className="mb-4 text-3xl font-bold">Ready to Connect?</h2>
        <p className="mx-auto mb-6 max-w-2xl text-gray-600">
          Join hundreds of Ex-Junior Airmen who are networking, mentoring, and achieving excellence
          together. "Strive to Excel" - our shared commitment to success.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/register">
              Create Your Profile
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/alumni/directory">Explore Directory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
