import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BadgeGenerator, BadgeData } from "@/lib/badge-generator";
import { SiteConfigManager, BadgeStorageManager } from "@/lib/supabase/storage";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id: eventId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const badgeType = searchParams.get("badgeType");

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query for badges
    let query = supabase
      .from("event_badges")
      .select(
        `
        *,
        registration:Registration!registration_id(
          id,
          status,
          ticketType
        ),
        user:User!user_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto,
          email,
          serviceNumber,
          currentOccupation,
          company
        ),
        template:badge_templates!template_id(
          id,
          name,
          template_data
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (badgeType) {
      query = query.eq("badge_type", badgeType);
    }

    const { data: badges, error } = await query;

    if (error) {
      console.error("Badges fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }

    // Get badge statistics
    const { data: stats } = await supabase
      .from("event_badges")
      .select("badge_type, status")
      .eq("event_id", eventId);

    const statistics = {
      total: stats?.length || 0,
      byType:
        stats?.reduce(
          (acc, badge) => {
            acc[badge.badge_type] = (acc[badge.badge_type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {},
      byStatus:
        stats?.reduce(
          (acc, badge) => {
            acc[badge.status] = (acc[badge.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {},
    };

    return NextResponse.json({
      badges: badges || [],
      statistics,
    });
  } catch (error) {
    console.error("Badges API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id: eventId } = params;
    const body = await req.json();
    const {
      user_id,
      registration_id,
      template_id,
      badge_type = "attendee",
      regenerate = false,
    } = body;

    // Check if user is admin or event organizer
    const { data: userProfile } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: event } = await supabase
      .from("Event")
      .select("organizerId")
      .eq("id", eventId)
      .single();

    if (
      !userProfile ||
      (userProfile.role !== "ADMIN" &&
        userProfile.role !== "ORGANIZER" &&
        event?.organizerId !== user.id)
    ) {
      return NextResponse.json(
        {
          error: "Only event organizers and admins can generate badges",
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!user_id || !registration_id) {
      return NextResponse.json(
        {
          error: "User ID and Registration ID are required",
        },
        { status: 400 }
      );
    }

    // Get user and registration data
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("*")
      .eq("id", user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: registrationData, error: regError } = await supabase
      .from("Registration")
      .select("*")
      .eq("id", registration_id)
      .eq("eventId", eventId)
      .eq("userId", user_id)
      .single();

    if (regError || !registrationData) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if badge already exists
    const { data: existingBadge, error: badgeCheckError } = await supabase
      .from("event_badges")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user_id)
      .single();

    if (existingBadge && !regenerate) {
      return NextResponse.json(
        {
          error: "Badge already exists for this user. Set regenerate=true to recreate.",
        },
        { status: 409 }
      );
    }

    // Prepare badge data
    const badgeData: BadgeData = {
      userId: user_id,
      eventId,
      registrationId: registration_id,
      displayName: userData.fullName || `${userData.firstName} ${userData.lastName}`,
      title: userData.currentOccupation || undefined,
      company: userData.company || undefined,
      badgeType: badge_type,
      email: userData.email,
      profilePhoto: userData.profilePhoto || undefined,
    };

    // Generate badge ID
    const badgeId = existingBadge?.id || crypto.randomUUID();

    // Generate QR code data and image
    const qrCodeData = BadgeGenerator.generateQRCodeData(badgeData, badgeId);
    const qrCodeImageURL = await BadgeGenerator.generateQRCodeImage(qrCodeData);

    // Upload QR code to Supabase Storage
    const storedQRCodeURL = await BadgeStorageManager.uploadQRCode(
      eventId,
      user_id,
      qrCodeImageURL
    );

    // Get site configuration for dynamic branding
    const siteConfig = await SiteConfigManager.getSiteConfig();

    // Get template (use default if not specified)
    let template;
    if (template_id) {
      const { data: templateData } = await supabase
        .from("badge_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (templateData && templateData.template_data) {
        template = templateData.template_data;
      }
    }

    if (!template) {
      template = BadgeGenerator.getDefaultTemplate(
        siteConfig.mainLogoUrl,
        siteConfig.siteName,
        siteConfig.primaryColor
      );
    }

    // Generate badge HTML
    const badgeHTML = BadgeGenerator.generateBadgeHTML(badgeData, template, storedQRCodeURL);

    // Upload badge HTML to Supabase Storage
    const badgeImageURL = await BadgeStorageManager.uploadBadgeImage(
      eventId,
      user_id,
      badgeHTML,
      "html"
    );

    if (existingBadge) {
      // Update existing badge
      const { data, error } = await supabase
        .from("event_badges")
        .update({
          template_id,
          display_name: badgeData.displayName,
          title: badgeData.title,
          company: badgeData.company,
          badge_type: badge_type,
          qr_code_data: qrCodeData,
          qr_code_url: storedQRCodeURL,
          badge_image_url: badgeImageURL,
          status: "generated",
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingBadge.id)
        .select()
        .single();

      if (error) {
        console.error("Badge update error:", error);
        return NextResponse.json({ error: "Failed to update badge" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Badge regenerated successfully",
        badge: data,
      });
    } else {
      // Create new badge
      const { data, error } = await supabase
        .from("event_badges")
        .insert({
          id: badgeId,
          event_id: eventId,
          registration_id,
          user_id,
          template_id,
          display_name: badgeData.displayName,
          title: badgeData.title,
          company: badgeData.company,
          badge_type: badge_type,
          qr_code_data: qrCodeData,
          qr_code_url: storedQRCodeURL,
          badge_image_url: badgeImageURL,
          status: "generated",
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Badge creation error:", error);
        return NextResponse.json({ error: "Failed to create badge" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Badge generated successfully",
        badge: data,
      });
    }
  } catch (error) {
    console.error("Badge generation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
