import { NextRequest, NextResponse } from "next/server";
import { AssetManager, SiteConfigManager } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const logoType = formData.get("logoType") as
      | "main_logo_url"
      | "footer_logo_url"
      | "favicon_url";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!logoType || !["main_logo_url", "footer_logo_url", "favicon_url"].includes(logoType)) {
      return NextResponse.json({ error: "Invalid logo type" }, { status: 400 });
    }

    // TODO: Add authentication check here
    // const { user } = useAuth();
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 5MB.",
        },
        { status: 400 }
      );
    }

    const logoUrl = await SiteConfigManager.uploadAndSetLogo(file, logoType);

    return NextResponse.json({
      success: true,
      logoUrl,
      message: "Logo uploaded and updated successfully",
    });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
