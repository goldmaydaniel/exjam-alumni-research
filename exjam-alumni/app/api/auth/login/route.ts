import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit, rateLimitConfigs } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  return withRateLimit(req, rateLimitConfigs.auth, async () => {
    try {
      const body = await req.json();
      const { email, password } = loginSchema.parse(body);

      // Use Supabase Auth for login
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!data.user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 });
      }

      // Get additional user data from User table
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("id, email, firstName, lastName, role")
        .eq("id", data.user.id)
        .single();

      if (userError || !userData) {
        // User exists in auth but not in User table - need to sync
        return NextResponse.json({
          user: {
            id: data.user.id,
            email: data.user.email!,
            firstName: null,
            lastName: null,
            role: "USER",
          },
          session: data.session,
          needsProfileUpdate: true,
        });
      }

      return NextResponse.json({
        user: userData,
        session: data.session,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.flatten() },
          { status: 400 }
        );
      }

      console.error("Login error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
