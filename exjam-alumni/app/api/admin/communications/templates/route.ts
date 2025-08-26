import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock template data - in production, this would come from a database table
const defaultTemplates = [
  {
    id: "welcome",
    name: "Welcome Message",
    subject: "Welcome to The ExJAM Association!",
    content:
      "Dear {{firstName}},\n\nWelcome to The ExJAM Association! We're excited to have you as part of our community.\n\nBest regards,\nThe ExJAM Association Team",
    variables: ["firstName"],
    type: "WELCOME",
  },
  {
    id: "event-reminder",
    name: "Event Reminder",
    subject: "Reminder: {{eventTitle}} is coming up!",
    content:
      "Hi {{firstName}},\n\nThis is a friendly reminder that {{eventTitle}} is scheduled for {{eventDate}} at {{venue}}.\n\nWe look forward to seeing you there!\n\nBest regards,\nThe ExJAM Association Team",
    variables: ["firstName", "eventTitle", "eventDate", "venue"],
    type: "EVENT_REMINDER",
  },
  {
    id: "payment-confirmation",
    name: "Payment Confirmation",
    subject: "Payment Confirmation - {{eventTitle}}",
    content:
      "Dear {{firstName}},\n\nYour payment of ₦{{amount}} for {{eventTitle}} has been successfully processed.\n\nTransaction Reference: {{reference}}\n\nThank you!\nThe ExJAM Association Team",
    variables: ["firstName", "eventTitle", "amount", "reference"],
    type: "PAYMENT_CONFIRMATION",
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For now, return default templates
    // In production, you'd query from a templates table
    return NextResponse.json({ templates: defaultTemplates });
  } catch (error) {
    console.error("Templates fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, content, variables, type } = body;

    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: dbUser } = await supabase.from("User").select("role").eq("id", user.id).single();

    if (dbUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new template
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      content,
      variables: variables || [],
      type: type || "CUSTOM",
      createdAt: new Date().toISOString(),
    };

    // In production, save to database
    // For now, return the created template
    return NextResponse.json({
      success: true,
      template: newTemplate,
    });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
