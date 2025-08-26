import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TemplateStorageManager } from "@/lib/supabase/storage";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userProfile || (userProfile.role !== "ADMIN" && userProfile.role !== "ORGANIZER")) {
      return NextResponse.json(
        {
          error: "Only admins and organizers can create badge templates",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      canvas_design_url,
      template_type = "event",
      is_default = false,
    } = body;

    // Validate required fields
    if (!name || !canvas_design_url) {
      return NextResponse.json(
        {
          error: "Template name and Canvas design URL are required",
        },
        { status: 400 }
      );
    }

    // Validate Canvas URL format
    if (!canvas_design_url.includes("canva.com")) {
      return NextResponse.json(
        {
          error: "Please provide a valid Canva design URL",
        },
        { status: 400 }
      );
    }

    // Convert Canvas design to template data
    const templateData = await convertCanvasDesignToTemplate(canvas_design_url);

    // Upload template to storage
    const templateId = crypto.randomUUID();
    const { templateUrl } = await TemplateStorageManager.uploadTemplate(templateId, templateData);

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("badge_templates")
        .update({ is_default: false })
        .eq("template_type", template_type)
        .eq("is_default", true);
    }

    // Save template to database
    const { data, error } = await supabase
      .from("badge_templates")
      .insert({
        id: templateId,
        name,
        description,
        canvas_design_url,
        template_data: templateData,
        template_type,
        is_default,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        name,
        description,
        canvas_design_url,
        template_type,
        is_default,
        is_active,
        created_at,
        updated_at,
        creator:User!created_by(
          id,
          firstName,
          lastName,
          fullName
        )
      `
      )
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return NextResponse.json({ error: "Failed to create badge template" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Canvas template imported successfully",
      template: {
        ...data,
        storage_url: templateUrl,
      },
    });
  } catch (error) {
    console.error("Canvas template import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Convert Canvas design URL to badge template data
 * This is a placeholder - in production you'd integrate with Canvas API
 */
async function convertCanvasDesignToTemplate(canvasUrl: string) {
  // For now, create a basic template structure that can be enhanced
  // In production, you would:
  // 1. Use Canvas API to get design elements
  // 2. Convert Canvas elements to our template format
  // 3. Extract colors, fonts, and positioning

  const templateId = crypto.randomUUID();

  return {
    id: templateId,
    name: "Canvas Imported Template",
    width: 400,
    height: 600,
    backgroundColor: "#ffffff",
    canvasUrl: canvasUrl,
    elements: [
      // Header background (you can extract from Canvas)
      {
        id: "header",
        type: "shape",
        x: 0,
        y: 0,
        width: 400,
        height: 80,
        zIndex: 1,
        style: {
          backgroundColor: "#1e40af", // This could be extracted from Canvas
        },
      },
      // Canvas design embed area
      {
        id: "canvas-design",
        type: "canvas_embed",
        x: 0,
        y: 0,
        width: 400,
        height: 400,
        zIndex: 0,
        canvasUrl: canvasUrl,
        style: {},
      },
      // Profile photo area
      {
        id: "photo",
        type: "image",
        x: 150,
        y: 420,
        width: 100,
        height: 100,
        zIndex: 2,
        dynamicField: "profilePhoto",
        style: {
          borderRadius: 50,
          backgroundColor: "#f3f4f6",
        },
      },
      // Name field
      {
        id: "name",
        type: "text",
        x: 20,
        y: 540,
        width: 360,
        height: 30,
        zIndex: 2,
        dynamicField: "displayName",
        style: {
          fontSize: 20,
          fontWeight: "bold",
          color: "#1f2937",
          textAlign: "center",
        },
      },
      // QR Code
      {
        id: "qr-code",
        type: "qr_code",
        x: 20,
        y: 420,
        width: 80,
        height: 80,
        zIndex: 2,
        style: {
          backgroundColor: "#ffffff",
        },
      },
    ],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const canvasUrl = searchParams.get("url");

    if (!canvasUrl) {
      return NextResponse.json({ error: "Canvas URL is required" }, { status: 400 });
    }

    // Preview Canvas template conversion
    const templateData = await convertCanvasDesignToTemplate(canvasUrl);

    return NextResponse.json({
      preview: templateData,
      message: "Canvas design preview generated",
    });
  } catch (error) {
    console.error("Canvas preview error:", error);
    return NextResponse.json({ error: "Failed to preview Canvas design" }, { status: 500 });
  }
}
