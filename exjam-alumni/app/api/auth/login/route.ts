import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { signIn, AuthError } from "@/lib/auth/unified-auth";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  return withRateLimit(req, rateLimitConfigs.auth, async () => {
    try {
      const body = await req.json();
      const { email, password } = loginSchema.parse(body);

      // Use unified auth system
      const { user, session } = await signIn(email, password);

      if (!user || !session) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      // Update last login in User table
      const supabase = await createClient();
      await supabase
        .from("User")
        .update({ lastLogin: new Date().toISOString() })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.warn("Failed to update last login:", error);
        });

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("id, email, firstName, lastName, fullName, role, profilePhoto, emailVerified, squadron, graduationYear, serviceNumber")
        .eq("id", user.id)
        .single();

      const userResponse = {
        id: user.id,
        email: user.email!,
        firstName: userData?.firstName || user.user_metadata?.firstName,
        lastName: userData?.lastName || user.user_metadata?.lastName,
        fullName: userData?.fullName || user.user_metadata?.fullName,
        role: userData?.role || 'GUEST_MEMBER',
        profilePhoto: userData?.profilePhoto,
        emailVerified: user.email_confirmed_at ? true : false,
        squadron: userData?.squadron,
        graduationYear: userData?.graduationYear,
        serviceNumber: userData?.serviceNumber,
      };

      if (userError || !userData) {
        // User exists in auth but not in User table - need to sync
        return NextResponse.json({
          user: userResponse,
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
          needsProfileUpdate: true,
        });
      }

      return NextResponse.json({
        user: userResponse,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten() },
          { status: 400 }
        );
      }

      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }

      console.error("Login error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
