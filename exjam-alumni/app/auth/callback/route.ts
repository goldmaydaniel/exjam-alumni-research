import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this user exists in our User table
      const { data: existingUser, error: userError } = await supabase
        .from("User")
        .select("id, role, emailVerified")
        .eq("id", data.user.id)
        .single();

      if (userError && userError.code === "PGRST116") {
        // User doesn't exist in our database, create them
        const { error: createError } = await supabase.from("User").insert({
          id: data.user.id,
          email: data.user.email!,
          password: "oauth_user", // OAuth users don't need password
          firstName:
            data.user.user_metadata?.given_name ||
            data.user.user_metadata?.name?.split(" ")[0] ||
            "User",
          lastName:
            data.user.user_metadata?.family_name ||
            data.user.user_metadata?.name?.split(" ").slice(1).join(" ") ||
            "",
          fullName:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            `${data.user.user_metadata?.given_name || "User"} ${data.user.user_metadata?.family_name || ""}`,
          profilePhoto: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
          emailVerified: data.user.email_confirmed_at ? true : false,
          role: "ATTENDEE",
          status: "ACTIVE",
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (createError) {
          console.error("Error creating user:", createError);
          return NextResponse.redirect(`${origin}/auth/error?message=account-creation-failed`);
        }

        // Redirect new users to complete their profile
        const redirectUrl = `${origin}/dashboard/profile?setup=true`;
        return getRedirectResponse(request, origin, redirectUrl);
      } else if (!userError && existingUser) {
        // Update existing user's profile and last login
        const updates: any = { lastLogin: new Date().toISOString() };

        // Update profile photo if available and not already set
        if (data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture) {
          updates.profilePhoto =
            data.user.user_metadata.avatar_url || data.user.user_metadata.picture;
        }

        await supabase.from("User").update(updates).eq("id", data.user.id);

        // Redirect existing users to dashboard
        const redirectUrl = `${origin}${next}`;
        return getRedirectResponse(request, origin, redirectUrl);
      }
    }

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
      );
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}

function getRedirectResponse(request: Request, origin: string, fallbackUrl: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(fallbackUrl);
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${new URL(fallbackUrl).pathname}`);
  } else {
    return NextResponse.redirect(fallbackUrl);
  }
}
