import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { id: eventId } = params;
    const { searchParams } = new URL(req.url);
    const feedbackType = searchParams.get("type") || "";

    let query = supabase
      .from("event_feedback")
      .select(
        `
        id,
        event_id,
        rating,
        feedback_text,
        feedback_type,
        is_anonymous,
        created_at,
        user:User!user_id(
          id,
          firstName,
          lastName,
          fullName,
          profilePhoto
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (feedbackType) {
      query = query.eq("feedback_type", feedbackType);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error("Feedback fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
    }

    // Get aggregate statistics
    const { data: stats } = await supabase
      .from("event_feedback")
      .select("rating")
      .eq("event_id", eventId);

    const totalFeedback = stats?.length || 0;
    const averageRating =
      totalFeedback > 0 ? stats.reduce((sum, item) => sum + item.rating, 0) / totalFeedback : 0;

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: stats?.filter((s) => s.rating === rating).length || 0,
    }));

    // Anonymize feedback if needed
    const processedFeedback =
      feedback?.map((f) => ({
        ...f,
        user: f.is_anonymous ? null : f.user,
      })) || [];

    return NextResponse.json({
      feedback: processedFeedback,
      statistics: {
        total: totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = params;
    const body = await req.json();
    const { rating, feedback_text, feedback_type = "general", is_anonymous = false } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Valid rating (1-5) is required" }, { status: 400 });
    }

    // Check if event exists and user is registered
    const { data: registration, error: regError } = await supabase
      .from("Registration")
      .select("id")
      .eq("eventId", eventId)
      .eq("userId", user.id)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        {
          error: "You must be registered for this event to provide feedback",
        },
        { status: 403 }
      );
    }

    // Check if user already provided feedback of this type
    const { data: existingFeedback } = await supabase
      .from("event_feedback")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .eq("feedback_type", feedback_type)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from("event_feedback")
        .update({
          rating,
          feedback_text,
          is_anonymous,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFeedback.id)
        .select()
        .single();

      if (error) {
        console.error("Feedback update error:", error);
        return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Feedback updated successfully",
        feedback: data,
      });
    } else {
      // Create new feedback
      const { data, error } = await supabase
        .from("event_feedback")
        .insert({
          event_id: eventId,
          user_id: user.id,
          rating,
          feedback_text,
          feedback_type,
          is_anonymous,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Feedback creation error:", error);
        return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
      }

      return NextResponse.json({
        message: "Feedback submitted successfully",
        feedback: data,
      });
    }
  } catch (error) {
    console.error("Submit feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
