"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Save, Image, Settings, Palette, Globe, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/lib/store/consolidated-auth";
import toast from "react-hot-toast";

interface SiteConfig {
  id: number;
  site_name: string;
  main_logo_url?: string;
  footer_logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  hero_title?: string;
  hero_subtitle?: string;
  contact_email?: string;
  contact_phone?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_instagram?: string;
  created_at: string;
  updated_at: string;
}

export default function SiteConfigPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const mainLogoRef = useRef<HTMLInputElement>(null);
  const footerLogoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  const fetchSiteConfig = async () => {
    try {
      const response = await fetch("/api/admin/site-config");
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        toast.error("Failed to load site configuration");
      }
    } catch (error) {
      console.error("Error fetching site config:", error);
      toast.error("Failed to load site configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Site configuration saved successfully!");
        setConfig(data.config);
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (
    file: File,
    logoType: "main_logo_url" | "footer_logo_url" | "favicon_url"
  ) => {
    setUploadingLogo(logoType);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("logoType", logoType);

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setConfig((prev) => (prev ? { ...prev, [logoType]: data.logoUrl } : null));
        toast.success("Logo uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(null);
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    logoType: "main_logo_url" | "footer_logo_url" | "favicon_url"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleLogoUpload(file, logoType);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading site configuration...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <X className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold">Failed to Load Configuration</h2>
          <Button onClick={fetchSiteConfig}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Configuration</h1>
          <p className="text-muted-foreground">
            Manage your site's appearance, branding, and content settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Logo Management
              </CardTitle>
              <CardDescription>
                Upload and manage your site logos. Recommended formats: PNG, SVG, or JPG.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Logo */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="main-logo">Main Logo</Label>
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                    {config.main_logo_url ? (
                      <div className="space-y-2">
                        <img
                          src={config.main_logo_url}
                          alt="Main Logo"
                          className="mx-auto h-16 object-contain"
                        />
                        <Badge variant="success">Active</Badge>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Image className="mx-auto mb-2 h-12 w-12" />
                        <p>No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => mainLogoRef.current?.click()}
                    disabled={uploadingLogo === "main_logo_url"}
                    className="w-full"
                  >
                    {uploadingLogo === "main_logo_url" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Main Logo
                  </Button>
                  <input
                    ref={mainLogoRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "main_logo_url")}
                    className="hidden"
                  />
                </div>

                {/* Footer Logo */}
                <div className="space-y-3">
                  <Label htmlFor="footer-logo">Footer Logo</Label>
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                    {config.footer_logo_url ? (
                      <div className="space-y-2">
                        <img
                          src={config.footer_logo_url}
                          alt="Footer Logo"
                          className="mx-auto h-16 object-contain"
                        />
                        <Badge variant="success">Active</Badge>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Image className="mx-auto mb-2 h-12 w-12" />
                        <p>No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => footerLogoRef.current?.click()}
                    disabled={uploadingLogo === "footer_logo_url"}
                    className="w-full"
                  >
                    {uploadingLogo === "footer_logo_url" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Footer Logo
                  </Button>
                  <input
                    ref={footerLogoRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "footer_logo_url")}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Site Name */}
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={config.site_name}
                  onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
                  placeholder="Enter site name"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Site Content
              </CardTitle>
              <CardDescription>Manage your site's main content and messaging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Input
                    id="hero-title"
                    value={config.hero_title || ""}
                    onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                    placeholder="Main hero title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Input
                    id="hero-subtitle"
                    value={config.hero_subtitle || ""}
                    onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                    placeholder="Hero subtitle"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={config.contact_email || ""}
                    onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={config.contact_phone || ""}
                    onChange={(e) => setConfig({ ...config, contact_phone: e.target.value })}
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>Customize your site's color scheme and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primary_color || "#1e40af"}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="h-10 w-16 rounded border p-1"
                    />
                    <Input
                      value={config.primary_color || "#1e40af"}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondary_color || "#3b82f6"}
                      onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                      className="h-10 w-16 rounded border p-1"
                    />
                    <Input
                      value={config.secondary_color || "#3b82f6"}
                      onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Add your social media profiles to appear in the footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input
                    id="facebook"
                    value={config.social_facebook || ""}
                    onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter URL</Label>
                  <Input
                    id="twitter"
                    value={config.social_twitter || ""}
                    onChange={(e) => setConfig({ ...config, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={config.social_linkedin || ""}
                    onChange={(e) => setConfig({ ...config, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    value={config.social_instagram || ""}
                    onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
