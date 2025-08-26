import { createClient } from "@supabase/supabase-js";

// Create admin client lazily to avoid issues during import
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

// Storage buckets configuration
export const STORAGE_BUCKETS = {
  EVENT_BADGES: "event-badges",
  BADGE_TEMPLATES: "badge-templates",
  PROFILE_PHOTOS: "profile-photos",
  EVENT_ASSETS: "event-assets",
} as const;

// Storage folders configuration
export const STORAGE_FOLDERS = {
  BADGES: "badges",
  TEMPLATES: "templates",
  PHOTOS: "photos",
  QR_CODES: "qr-codes",
} as const;

// Asset manager class
export class AssetManager {
  static async uploadAsset(bucket: string, path: string, file: File): Promise<string> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return urlData.publicUrl;
  }

  static async deleteAsset(bucket: string, path: string): Promise<void> {
    const { error } = await getSupabaseAdmin().storage.from(bucket).remove([path]);

    if (error) throw error;
  }
}

export class BadgeStorageManager {
  private static bucketName = "event-badges";

  /**
   * Initialize storage bucket for badges
   */
  static async initializeBucket() {
    try {
      // Check if bucket exists
      const { data: buckets } = await getSupabaseAdmin().storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error } = await getSupabaseAdmin().storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf", "text/html"],
          fileSizeLimit: 5242880, // 5MB
        });

        if (error) {
          console.error("Error creating badge bucket:", error);
          throw error;
        }

        console.log("Badge storage bucket created successfully");
      }

      return true;
    } catch (error) {
      console.error("Error initializing badge bucket:", error);
      throw error;
    }
  }

  /**
   * Upload badge image to Supabase Storage
   */
  static async uploadBadgeImage(
    eventId: string,
    userId: string,
    imageData: string,
    format: "html" | "png" | "pdf" = "html"
  ): Promise<string> {
    try {
      await this.initializeBucket();

      // Generate proper file naming with timestamp
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const fileName = `events/${eventId}/badges/${timestamp}-${userId}-badge.${format}`;
      let fileData: string | Buffer;
      let contentType: string;

      if (format === "html") {
        // For HTML badges, store as HTML file
        fileData = imageData;
        contentType = "text/html";
      } else {
        // For base64 image data, convert to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
        fileData = Buffer.from(base64Data, "base64");
        contentType = format === "png" ? "image/png" : "application/pdf";
      }

      const { data, error } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .upload(fileName, fileData, {
          contentType,
          upsert: true,
          cacheControl: "3600",
        });

      if (error) {
        console.error("Error uploading badge:", error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = getSupabaseAdmin()
        .storage.from(this.bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading badge image:", error);
      throw error;
    }
  }

  /**
   * Upload QR code image to storage
   */
  static async uploadQRCode(
    eventId: string,
    userId: string,
    qrCodeDataUrl: string
  ): Promise<string> {
    try {
      await this.initializeBucket();

      // Generate proper file naming with timestamp
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const fileName = `events/${eventId}/qrcodes/${timestamp}-${userId}-qrcode.png`;
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
      const fileData = Buffer.from(base64Data, "base64");

      const { data, error } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .upload(fileName, fileData, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "3600",
        });

      if (error) {
        console.error("Error uploading QR code:", error);
        throw error;
      }

      const { data: urlData } = getSupabaseAdmin()
        .storage.from(this.bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading QR code:", error);
      throw error;
    }
  }

  /**
   * Delete badge files from storage
   */
  static async deleteBadgeFiles(eventId: string, userId: string): Promise<void> {
    try {
      // List all files for this user and event, then delete them
      const { data: badgeFiles } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .list(`events/${eventId}/badges`, {
          search: `${userId}-badge`,
        });

      const { data: qrFiles } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .list(`events/${eventId}/qrcodes`, {
          search: `${userId}-qrcode`,
        });

      const filesToDelete = [
        ...(badgeFiles?.map((f) => `events/${eventId}/badges/${f.name}`) || []),
        ...(qrFiles?.map((f) => `events/${eventId}/qrcodes/${f.name}`) || []),
      ];

      const { error } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .remove(filesToDelete);

      if (error) {
        console.error("Error deleting badge files:", error);
        // Don't throw error for deletion failures
      }
    } catch (error) {
      console.error("Error deleting badge files:", error);
    }
  }

  /**
   * Generate signed URL for private access
   */
  static async getSignedBadgeUrl(
    eventId: string,
    userId: string,
    format: "html" | "png" | "pdf" = "html",
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      // Find the latest badge file for this user
      const { data: files } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .list(`events/${eventId}/badges`, {
          search: `${userId}-badge.${format}`,
        });

      if (!files || files.length === 0) {
        throw new Error("Badge file not found");
      }

      // Get the most recent file (sorted by name with timestamp)
      const latestFile = files.sort((a, b) => b.name.localeCompare(a.name))[0];
      const fileName = `events/${eventId}/badges/${latestFile.name}`;

      const { data, error } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        console.error("Error creating signed URL:", error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed badge URL:", error);
      throw error;
    }
  }

  /**
   * List all badges for an event
   */
  static async listEventBadges(eventId: string): Promise<string[]> {
    try {
      const { data: badgeData, error: badgeError } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .list(`events/${eventId}/badges`);

      const { data: qrData, error: qrError } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .list(`events/${eventId}/qrcodes`);

      if (badgeError && qrError) {
        console.error("Error listing event files:", { badgeError, qrError });
        throw badgeError;
      }

      const allFiles = [
        ...(badgeData?.map((file) => `badges/${file.name}`) || []),
        ...(qrData?.map((file) => `qrcodes/${file.name}`) || []),
      ];

      return allFiles;
    } catch (error) {
      console.error("Error listing event badges:", error);
      throw error;
    }
  }
}

export class SiteConfigManager {
  /**
   * Get site configuration from database
   */
  static async getSiteConfig() {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("SiteConfig")
        .select("*")
        .eq("id", 1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching site config:", error);
      }

      return {
        siteName: data?.site_name || "ExJAM Alumni Association",
        mainLogoUrl: data?.main_logo_url || "/exjam-logo.svg",
        footerLogoUrl: data?.footer_logo_url || "/exjam-logo.svg",
        faviconUrl: data?.favicon_url || "/favicon.ico",
        primaryColor: data?.primary_color || "#1e40af",
        secondaryColor: data?.secondary_color || "#3b82f6",
        heroTitle: data?.hero_title || "Welcome to ExJAM Alumni",
        heroSubtitle: data?.hero_subtitle || "Connecting Nigerian Air Force Academy Alumni",
        contactEmail: data?.contact_email,
        contactPhone: data?.contact_phone,
        socialFacebook: data?.social_facebook,
        socialTwitter: data?.social_twitter,
        socialLinkedin: data?.social_linkedin,
        socialInstagram: data?.social_instagram,
      };
    } catch (error) {
      console.error("Error getting site config:", error);
      // Return defaults if error
      return {
        siteName: "ExJAM Alumni Association",
        mainLogoUrl: "/exjam-logo.svg",
        footerLogoUrl: "/exjam-logo.svg",
        faviconUrl: "/favicon.ico",
        primaryColor: "#1e40af",
        secondaryColor: "#3b82f6",
        heroTitle: "Welcome to ExJAM Alumni",
        heroSubtitle: "Connecting Nigerian Air Force Academy Alumni",
        contactEmail: null,
        contactPhone: null,
        socialFacebook: null,
        socialTwitter: null,
        socialLinkedin: null,
        socialInstagram: null,
      };
    }
  }
}

export class TemplateStorageManager {
  private static bucketName = "badge-templates";

  /**
   * Initialize template storage bucket
   */
  static async initializeBucket() {
    try {
      const { data: buckets } = await getSupabaseAdmin().storage.listBuckets();
      const bucketExists = buckets?.some((bucket) => bucket.name === this.bucketName);

      if (!bucketExists) {
        const { error } = await getSupabaseAdmin().storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "application/json"],
          fileSizeLimit: 2097152, // 2MB
        });

        if (error) {
          console.error("Error creating template bucket:", error);
          throw error;
        }
      }

      return true;
    } catch (error) {
      console.error("Error initializing template bucket:", error);
      throw error;
    }
  }

  /**
   * Upload badge template
   */
  static async uploadTemplate(
    templateId: string,
    templateData: any,
    previewImage?: string
  ): Promise<{ templateUrl: string; previewUrl?: string }> {
    try {
      await this.initializeBucket();

      // Generate proper template file path with timestamp
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const templateFileName = `templates/${timestamp}-${templateId}/template.json`;

      const { data, error } = await getSupabaseAdmin()
        .storage.from(this.bucketName)
        .upload(templateFileName, JSON.stringify(templateData), {
          contentType: "application/json",
          upsert: true,
        });

      if (error) {
        console.error("Error uploading template:", error);
        throw error;
      }

      const { data: templateUrlData } = getSupabaseAdmin()
        .storage.from(this.bucketName)
        .getPublicUrl(templateFileName);

      let previewUrl;
      if (previewImage) {
        const previewFileName = `templates/${timestamp}-${templateId}/preview.png`;
        const base64Data = previewImage.replace(/^data:image\/png;base64,/, "");

        await getSupabaseAdmin()
          .storage.from(this.bucketName)
          .upload(previewFileName, Buffer.from(base64Data, "base64"), {
            contentType: "image/png",
            upsert: true,
          });

        const { data: previewUrlData } = getSupabaseAdmin()
          .storage.from(this.bucketName)
          .getPublicUrl(previewFileName);

        previewUrl = previewUrlData.publicUrl;
      }

      return {
        templateUrl: templateUrlData.publicUrl,
        previewUrl,
      };
    } catch (error) {
      console.error("Error uploading template:", error);
      throw error;
    }
  }
}
