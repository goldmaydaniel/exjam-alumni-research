import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const supabase = await createClient();

    // Check if user is authenticated and admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get target user
    const { data: targetUser, error: targetError } = await supabase
      .from("User")
      .select("id, firstName, lastName, email")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from("User")
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Reset password in Supabase Auth if user exists there
    try {
      await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
    } catch (authError) {
      console.log("Supabase auth update failed:", authError);
      // Don't fail the request if auth update fails
    }

    // Send email with new password
    const emailData = {
      to: targetUser.email,
      subject: "Password Reset - The ExJAM Association",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Dear ${targetUser.firstName},</p>
          
          <p>Your password has been reset by an administrator.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Temporary Password</h3>
            <p style="font-family: monospace; font-size: 18px; background: white; padding: 10px; border-radius: 4px;">
              <strong>${tempPassword}</strong>
            </p>
          </div>
          
          <p><strong>Important:</strong> Please log in and change this temporary password immediately for security.</p>
          
          <p>If you did not request this password reset, please contact our support team immediately.</p>
          
          <p>Best regards,<br>The ExJAM Association Administration</p>
        </div>
      `,
    };

    await sendEmail(emailData);

    // Create audit log
    await supabase.from("AuditLog").insert({
      userId: user.id,
      action: "RESET_USER_PASSWORD",
      entity: "User",
      entityId: userId,
      changes: {
        targetUser: targetUser.email,
        resetBy: user.id,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. Temporary password sent to user's email.",
      tempPassword: tempPassword, // For admin reference only
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
