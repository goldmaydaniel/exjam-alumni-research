import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const supabase = await createClient();

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const { data: dbUser, error: dbError } = await supabase
      .from("User")
      .select("id, password")
      .eq("id", user.id)
      .single();

    if (dbError || !dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const { error: updateError } = await supabase
      .from("User")
      .update({
        password: hashedNewPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    // Update password in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (authUpdateError) {
      console.error("Supabase auth password update error:", authUpdateError);
      // Don't fail the request if auth update fails, database is updated
    }

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }

    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
