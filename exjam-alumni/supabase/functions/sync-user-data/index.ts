import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseServiceClient } from "../_shared/supabase.ts";
import { corsHeaders } from "../_shared/cors.ts";
import {
  createResponse,
  createErrorResponse,
  handleOptions,
  logRequest,
  validateAuth,
} from "../_shared/utils.ts";

interface SyncRequest {
  userId?: string;
  email?: string;
  action: "create" | "update" | "sync_all";
  userData?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    rank?: string;
    service_number?: string;
    graduation_year?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleOptions();
  }

  logRequest("sync-user-data", req.method);

  try {
    const supabase = createSupabaseServiceClient();
    const authToken = validateAuth(req);

    if (!authToken) {
      return createErrorResponse("Authorization required", 401);
    }

    if (req.method === "POST") {
      const { userId, email, action, userData }: SyncRequest = await req.json();

      switch (action) {
        case "create":
          return await handleCreateUser(supabase, userData);

        case "update":
          return await handleUpdateUser(supabase, userId, userData);

        case "sync_all":
          return await handleSyncAll(supabase);

        default:
          return createErrorResponse("Invalid action", 400);
      }
    }

    // GET request - fetch sync status
    if (req.method === "GET") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");

      if (userId) {
        // Get specific user sync status
        const { data: user, error } = await supabase
          .from("users")
          .select(
            `
            *,
            auth_user_id,
            last_synced_at,
            registrations(count)
          `
          )
          .eq("id", userId)
          .single();

        if (error) {
          return createErrorResponse("User not found", 404, error);
        }

        return createResponse(user);
      } else {
        // Get overall sync stats
        const { count: totalUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        const { count: syncedUsers } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .not("auth_user_id", "is", null);

        const { count: pendingSync } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .is("auth_user_id", null);

        return createResponse({
          totalUsers: totalUsers || 0,
          syncedUsers: syncedUsers || 0,
          pendingSync: pendingSync || 0,
          syncPercentage: totalUsers ? Math.round(((syncedUsers || 0) / totalUsers) * 100) : 0,
        });
      }
    }

    return createErrorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Sync user data error:", error);
    return createErrorResponse("Internal server error", 500, error.message);
  }
});

async function handleCreateUser(supabase: any, userData: any) {
  if (!userData?.email) {
    return createErrorResponse("Email is required", 400);
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", userData.email)
      .single();

    if (existingUser) {
      return createErrorResponse("User already exists", 409);
    }

    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    });

    if (authError) {
      return createErrorResponse("Failed to create auth user", 500, authError);
    }

    // Create user in users table
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUser.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        rank: userData.rank,
        service_number: userData.service_number,
        graduation_year: userData.graduation_year,
        last_synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError) {
      // Clean up auth user if users table creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return createErrorResponse("Failed to create user", 500, userError);
    }

    logRequest("sync-user-data", "CREATE", { userId: newUser.id, email: userData.email });
    return createResponse({ success: true, user: newUser, authUser: authUser.user });
  } catch (error) {
    return createErrorResponse("Create user failed", 500, error.message);
  }
}

async function handleUpdateUser(supabase: any, userId: string, userData: any) {
  if (!userId) {
    return createErrorResponse("userId is required", 400);
  }

  try {
    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      return createErrorResponse("User not found", 404, fetchError);
    }

    // Update user data
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        ...userData,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return createErrorResponse("Failed to update user", 500, updateError);
    }

    // Update auth metadata if needed
    if (currentUser.auth_user_id && (userData.first_name || userData.last_name)) {
      await supabase.auth.admin.updateUserById(currentUser.auth_user_id, {
        user_metadata: {
          first_name: userData.first_name || currentUser.first_name,
          last_name: userData.last_name || currentUser.last_name,
        },
      });
    }

    logRequest("sync-user-data", "UPDATE", { userId, changes: Object.keys(userData) });
    return createResponse({ success: true, user: updatedUser });
  } catch (error) {
    return createErrorResponse("Update user failed", 500, error.message);
  }
}

async function handleSyncAll(supabase: any) {
  try {
    // Get users without auth_user_id
    const { data: unsynced, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .is("auth_user_id", null)
      .limit(50); // Process in batches

    if (fetchError) {
      return createErrorResponse("Failed to fetch unsynced users", 500, fetchError);
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const user of unsynced || []) {
      results.processed++;

      try {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
          },
        });

        if (authError) {
          results.failed++;
          results.errors.push(`Failed to create auth for ${user.email}: ${authError.message}`);
          continue;
        }

        // Update user with auth_user_id
        const { error: updateError } = await supabase
          .from("users")
          .update({
            auth_user_id: authUser.user.id,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed to update user ${user.email}: ${updateError.message}`);
          // Clean up auth user
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } else {
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${user.email}: ${error.message}`);
      }
    }

    logRequest("sync-user-data", "SYNC_ALL", results);
    return createResponse(results);
  } catch (error) {
    return createErrorResponse("Sync all failed", 500, error.message);
  }
}
