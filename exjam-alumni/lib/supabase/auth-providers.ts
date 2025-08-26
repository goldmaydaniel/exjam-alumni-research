import { createClient } from "@supabase/supabase-js";

export const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Social authentication providers configuration
export const authProviders = {
  google: {
    scopes: "email profile",
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  },
  linkedin: {
    scopes: "r_emailaddress r_liteprofile",
  },
  github: {
    scopes: "user:email",
  },
} as const;

// Social sign-in functions
export const signInWithGoogle = async (redirectTo?: string) => {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      queryParams: authProviders.google.queryParams,
      scopes: authProviders.google.scopes,
    },
  });

  if (error) {
    console.error("Google sign-in error:", error.message);
    throw error;
  }

  return data;
};

export const signInWithLinkedIn = async (redirectTo?: string) => {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "linkedin",
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      scopes: authProviders.linkedin.scopes,
    },
  });

  if (error) {
    console.error("LinkedIn sign-in error:", error.message);
    throw error;
  }

  return data;
};

export const signInWithGitHub = async (redirectTo?: string) => {
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      scopes: authProviders.github.scopes,
    },
  });

  if (error) {
    console.error("GitHub sign-in error:", error.message);
    throw error;
  }

  return data;
};

// Get current user session
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabaseAuth.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);
    return null;
  }

  return session;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabaseAuth.auth.signOut();

  if (error) {
    console.error("Sign out error:", error.message);
    throw error;
  }
};

// Listen to auth changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabaseAuth.auth.onAuthStateChange(callback);
};
