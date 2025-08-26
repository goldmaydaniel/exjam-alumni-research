"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Mail,
  Send,
  Database,
  Palette,
  Globe,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="container flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">
          Manage site configuration, communications, and system settings
        </p>
      </div>

      <Tabs defaultValue="site-config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site-config">
            <Settings className="mr-2 h-4 w-4" />
            Site Config
          </TabsTrigger>
          <TabsTrigger value="communications">
            <Mail className="mr-2 h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system">
            <Database className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Settings className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">Site Configuration</h3>
                <p className="mb-4 text-muted-foreground">
                  Configure site name, logos, colors, and contact information
                </p>
                <Button asChild>
                  <a href="/admin/site-config" className="inline-flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Open Site Configuration
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5 text-blue-500" />
                  Email Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Create and manage email templates for events
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="mr-2 h-5 w-5 text-green-500" />
                  Send Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Send notifications to event participants
                </p>
                <Button variant="outline" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Compose Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-purple-500" />
                  Message History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  View sent messages and delivery status
                </p>
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Communication Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Welcome Email
                </Button>
                <Button size="sm" variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Event Reminder
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Payment Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme & Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Palette className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">Appearance Settings</h3>
                <p className="mb-4 text-muted-foreground">
                  Customize colors, fonts, and visual elements
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline">
                    <Palette className="mr-2 h-4 w-4" />
                    Color Scheme
                  </Button>
                  <Button variant="outline">
                    <Globe className="mr-2 h-4 w-4" />
                    Logo Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-orange-500" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Connection Status</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage Used</span>
                    <span>2.3 GB / 10 GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Connections</span>
                    <span>8 / 100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Database Backup
                  </Button>
                  <Button size="sm" variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    System Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
