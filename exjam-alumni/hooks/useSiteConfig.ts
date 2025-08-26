"use client";

import { useState, useEffect } from "react";

export interface SiteConfig {
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

const defaultConfig: SiteConfig = {
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
};

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/site-config");

      if (!response.ok) {
        throw new Error("Failed to fetch configuration");
      }

      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setError(null);
      } else {
        throw new Error(data.error || "Failed to load configuration");
      }
    } catch (err) {
      console.warn("Using default site configuration:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // Keep default config
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = () => {
    setLoading(true);
    fetchConfig();
  };

  // Return consistent values during SSR/hydration
  const safeConfig = isMounted ? config : defaultConfig;

  return {
    config: safeConfig,
    loading: loading && isMounted,
    error,
    refreshConfig,
    // Helper getters with safe fallbacks
    siteName: safeConfig.site_name || defaultConfig.site_name,
    mainLogo: safeConfig.main_logo_url || defaultConfig.main_logo_url,
    footerLogo: safeConfig.footer_logo_url || defaultConfig.footer_logo_url,
    favicon: safeConfig.favicon_url || defaultConfig.favicon_url,
    primaryColor: safeConfig.primary_color || defaultConfig.primary_color,
    secondaryColor: safeConfig.secondary_color || defaultConfig.secondary_color,
    heroTitle: safeConfig.hero_title || defaultConfig.hero_title,
    heroSubtitle: safeConfig.hero_subtitle || defaultConfig.hero_subtitle,
    contactEmail: safeConfig.contact_email || defaultConfig.contact_email,
    contactPhone: safeConfig.contact_phone || defaultConfig.contact_phone,
  };
}

// Global site config cache
let globalConfig: SiteConfig | null = null;

export async function getSiteConfigServer(): Promise<SiteConfig> {
  if (globalConfig) {
    return globalConfig;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/site-config`);
    const data = await response.json();

    if (data.success) {
      globalConfig = data.config;
      return data.config;
    }
  } catch (error) {
    console.warn("Failed to fetch server-side config, using defaults:", error);
  }

  return defaultConfig;
}
