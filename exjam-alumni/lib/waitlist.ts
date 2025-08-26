import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  getWaitlistNotificationTemplate,
  getWaitlistConvertedTemplate,
} from "@/lib/email";
import crypto from "crypto";

export interface WaitlistEntry {
  id: string;
  userId: string;
  eventId: string;
  position: number;
  status: string;
  ticketType: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName?: string;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    venue: string;
    capacity: number;
  };
}

/**
 * Add a user to the waitlist for an event
 */
export async function addToWaitlist({
  userId,
  eventId,
  ticketType = "REGULAR",
}: {
  userId: string;
  eventId: string;
  ticketType?: string;
}): Promise<{ success: boolean; position?: number; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if user is already on waitlist for this event
    const { data: existingEntry, error: checkError } = await supabase
      .from("Waitlist")
      .select("id")
      .eq("userId", userId)
      .eq("eventId", eventId)
      .single();

    if (existingEntry) {
      return { success: false, error: "User is already on waitlist for this event" };
    }

    // Get the next position in the waitlist
    const { count: waitlistCount, error: countError } = await supabase
      .from("Waitlist")
      .select("*", { count: "exact", head: true })
      .eq("eventId", eventId)
      .eq("status", "ACTIVE");

    if (countError) {
      throw new Error(`Failed to count waitlist entries: ${countError.message}`);
    }

    const position = (waitlistCount || 0) + 1;

    // Add user to waitlist
    const { data: waitlistEntry, error: insertError } = await supabase
      .from("Waitlist")
      .insert({
        userId,
        eventId,
        position,
        ticketType,
        status: "ACTIVE",
      })
      .select(
        `
        id,
        position,
        user:User!userId(
          email,
          firstName,
          lastName,
          fullName
        ),
        event:Event!eventId(
          title,
          startDate,
          venue
        )
      `
      )
      .single();

    if (insertError) {
      throw new Error(`Failed to add to waitlist: ${insertError.message}`);
    }

    // Send waitlist notification email
    try {
      const emailHtml = getWaitlistNotificationTemplate({
        name:
          waitlistEntry.user.fullName ||
          `${waitlistEntry.user.firstName} ${waitlistEntry.user.lastName}`,
        eventTitle: waitlistEntry.event.title,
        position: waitlistEntry.position,
        eventDate: new Date(waitlistEntry.event.startDate).toLocaleDateString("en-NG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        eventVenue: waitlistEntry.event.venue,
      });

      await sendEmail({
        to: waitlistEntry.user.email,
        subject: `You're on the waitlist for ${waitlistEntry.event.title}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send waitlist notification email:", emailError);
      // Don't fail the waitlist addition if email fails
    }

    return { success: true, position };
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add to waitlist",
    };
  }
}

/**
 * Check if an event is full and has capacity
 */
export async function isEventFull(
  eventId: string
): Promise<{ isFull: boolean; capacity: number; registeredCount: number }> {
  const supabase = await createClient();

  // Get event capacity
  const { data: event, error: eventError } = await supabase
    .from("Event")
    .select("capacity")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    throw new Error("Event not found");
  }

  // Count confirmed registrations
  const { count: registeredCount, error: countError } = await supabase
    .from("Registration")
    .select("*", { count: "exact", head: true })
    .eq("eventId", eventId)
    .eq("status", "CONFIRMED");

  if (countError) {
    throw new Error("Failed to count registrations");
  }

  return {
    isFull: (registeredCount || 0) >= event.capacity,
    capacity: event.capacity,
    registeredCount: registeredCount || 0,
  };
}

/**
 * Convert waitlist entry to registration when space becomes available
 */
export async function convertWaitlistToRegistration(
  waitlistId: string
): Promise<{ success: boolean; registrationId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get waitlist entry with user and event details
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from("Waitlist")
      .select(
        `
        id,
        userId,
        eventId,
        ticketType,
        position,
        user:User!userId(
          email,
          firstName,
          lastName,
          fullName
        ),
        event:Event!eventId(
          title,
          startDate,
          venue
        )
      `
      )
      .eq("id", waitlistId)
      .eq("status", "ACTIVE")
      .single();

    if (waitlistError || !waitlistEntry) {
      return { success: false, error: "Waitlist entry not found" };
    }

    // Check if event still has capacity
    const { isFull } = await isEventFull(waitlistEntry.eventId);
    if (isFull) {
      return { success: false, error: "Event is still full" };
    }

    // Create registration
    const registrationId = crypto.randomUUID();
    const { data: registration, error: registrationError } = await supabase
      .from("Registration")
      .insert({
        id: registrationId,
        userId: waitlistEntry.userId,
        eventId: waitlistEntry.eventId,
        ticketType: waitlistEntry.ticketType,
        status: "CONFIRMED",
      })
      .select()
      .single();

    if (registrationError) {
      throw new Error(`Failed to create registration: ${registrationError.message}`);
    }

    // Mark waitlist entry as converted
    const { error: updateError } = await supabase
      .from("Waitlist")
      .update({
        status: "CONVERTED",
        convertedAt: new Date().toISOString(),
      })
      .eq("id", waitlistId);

    if (updateError) {
      console.error("Failed to update waitlist status:", updateError);
    }

    // Send conversion notification email
    try {
      const emailHtml = getWaitlistConvertedTemplate({
        name:
          waitlistEntry.user.fullName ||
          `${waitlistEntry.user.firstName} ${waitlistEntry.user.lastName}`,
        eventTitle: waitlistEntry.event.title,
        eventDate: new Date(waitlistEntry.event.startDate).toLocaleDateString("en-NG", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        eventVenue: waitlistEntry.event.venue,
        registrationId,
      });

      await sendEmail({
        to: waitlistEntry.user.email,
        subject: `Great news! You're now registered for ${waitlistEntry.event.title}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send conversion notification email:", emailError);
    }

    return { success: true, registrationId };
  } catch (error) {
    console.error("Error converting waitlist to registration:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert waitlist entry",
    };
  }
}

/**
 * Process waitlist when registration is cancelled
 */
export async function processWaitlistOnCancellation(eventId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Check if event still has capacity
    const { isFull } = await isEventFull(eventId);
    if (isFull) {
      return; // No space available
    }

    // Get the next person in waitlist
    const { data: nextInLine, error: waitlistError } = await supabase
      .from("Waitlist")
      .select("id")
      .eq("eventId", eventId)
      .eq("status", "ACTIVE")
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (waitlistError || !nextInLine) {
      return; // No one on waitlist
    }

    // Convert the next person
    await convertWaitlistToRegistration(nextInLine.id);
  } catch (error) {
    console.error("Error processing waitlist on cancellation:", error);
  }
}

/**
 * Get waitlist entries for an event
 */
export async function getWaitlistForEvent(eventId: string): Promise<WaitlistEntry[]> {
  const supabase = await createClient();

  const { data: waitlist, error } = await supabase
    .from("Waitlist")
    .select(
      `
      id,
      userId,
      eventId,
      position,
      status,
      ticketType,
      createdAt,
      user:User!userId(
        id,
        email,
        firstName,
        lastName,
        fullName
      ),
      event:Event!eventId(
        id,
        title,
        startDate,
        venue,
        capacity
      )
    `
    )
    .eq("eventId", eventId)
    .eq("status", "ACTIVE")
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to get waitlist: ${error.message}`);
  }

  return waitlist || [];
}
