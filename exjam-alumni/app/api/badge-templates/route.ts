import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BadgeGenerator } from "@/lib/badge-generator";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const templateType = searchParams.get("type");
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("badge_templates")
      .select(
        `
        id,
        name,
        description,
        canvas_design_url,
        template_data,
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
      .order("created_at", { ascending: false });

    if (templateType) {
      query = query.eq("template_type", templateType);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Templates fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch badge templates" }, { status: 500 });
    }

    // Add default template if no templates exist
    let templatesWithDefault = templates || [];
    if (templatesWithDefault.length === 0) {
      const defaultTemplate = BadgeGenerator.getDefaultTemplate();
      templatesWithDefault = [
        {
          id: "default",
          name: "Default Template",
          description: "Built-in default badge template",
          canvas_design_url: null,
          template_data: defaultTemplate,
          template_type: "event",
          is_default: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          creator: null,
        },
      ];
    }

    return NextResponse.json({
      templates: templatesWithDefault,
      total: templatesWithDefault.length,
    });
  } catch (error) {
    console.error("Badge templates API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      template_data,
      template_type = "event",
      is_default = false,
      is_active = true,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    if (!template_data && !canvas_design_url) {
      return NextResponse.json(
        {
          error: "Either template data or Canvas design URL must be provided",
        },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("badge_templates")
        .update({ is_default: false })
        .eq("template_type", template_type)
        .eq("is_default", true);
    }

    const { data, error } = await supabase
      .from("badge_templates")
      .insert({
        name,
        description,
        canvas_design_url,
        template_data,
        template_type,
        is_default,
        is_active,
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
        template_data,
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
      message: "Badge template created successfully",
      template: data,
    });
  } catch (error) {
    console.error("Create badge template API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
