import { createClient } from "@/lib/supabase/client";
import { Provider } from "@supabase/supabase-js";

export type SocialProvider = "google" | "github" | "azure";

interface SocialAuthOptions {
  redirectTo?: string;
  scopes?: string[];
  queryParams?: Record<string, string>;
}

/**
 * Sign in with social provider
 */
export async function signInWithProvider(
  provider: SocialProvider,
  options: SocialAuthOptions = {}
) {
  const supabase = createClient();
  
  const redirectUrl = options.redirectTo || `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: redirectUrl,
      scopes: options.scopes?.join(" "),
      queryParams: options.queryParams,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(redirectTo?: string) {
  return signInWithProvider("google", {
    redirectTo,
    scopes: ["email", "profile"],
  });
}

/**
 * Sign in with Microsoft/Azure
 */
export async function signInWithMicrosoft(redirectTo?: string) {
  return signInWithProvider("azure", {
    redirectTo,
    scopes: ["email", "profile"],
    queryParams: {
      prompt: "select_account",
    },
  });
}

/**
 * Sign in with GitHub
 */
export async function signInWithGitHub(redirectTo?: string) {
  return signInWithProvider("github", {
    redirectTo,
    scopes: ["read:user", "user:email"],
  });
}

/**
 * Link social provider to existing account
 */
export async function linkProvider(provider: SocialProvider) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.linkIdentity({
    provider: provider as Provider,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Unlink social provider from account
 */
export async function unlinkProvider(provider: SocialProvider) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("No authenticated user");
  }

  // Find the identity to unlink
  const identity = user.identities?.find(id => id.provider === provider);
  
  if (!identity) {
    throw new Error(`No ${provider} identity linked to this account`);
  }

  const { error } = await supabase.auth.unlinkIdentity({
    identity_id: identity.identity_id!,
  });

  if (error) {
    throw error;
  }
}

/**
 * Get linked providers for current user
 */
export async function getLinkedProviders(): Promise<SocialProvider[]> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return [];
  }

  return (user.identities?.map(id => id.provider as SocialProvider) || []);
}

/**
 * Check if provider is linked
 */
export async function isProviderLinked(provider: SocialProvider): Promise<boolean> {
  const linkedProviders = await getLinkedProviders();
  return linkedProviders.includes(provider);
}