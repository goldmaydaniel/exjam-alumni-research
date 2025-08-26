import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

const getDefaultConfig = (): SiteConfig => ({
  id: 1,
  site_name: "The ExJAM Association",
  main_logo_url: "/exjam-logo.svg",
  footer_logo_url: "/exjam-logo.svg",
  favicon_url: "/favicon.ico",
  primary_color: "#1e40af",
  secondary_color: "#3b82f6",
  hero_title: "Welcome to The ExJAM Association",
  hero_subtitle: "Connecting Air Force Military School Jos Alumni",
  contact_email: "contact@exjamalumni.org",
  contact_phone: "+234 801 234 5678",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_config").select("*").single();

    if (error && error.code !== "PGRST116") {
      console.warn("No site config found, using defaults:", error);
    }

    const config = data || getDefaultConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error fetching site config:", error);
    return NextResponse.json({ success: true, config: getDefaultConfig() });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // TODO: Add authentication check here
    // const { user } = useAuth();
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    const { error } = await supabase.from("site_config").upsert({
      id: 1,
      ...body,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error updating site config:", error);
      throw new Error("Failed to update site configuration");
    }

    // Fetch updated config
    const { data: updatedConfig } = await supabase.from("site_config").select("*").single();

    return NextResponse.json({
      success: true,
      config: updatedConfig || getDefaultConfig(),
      message: "Site configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating site config:", error);
    return NextResponse.json({ error: "Failed to update site configuration" }, { status: 500 });
  }
}
