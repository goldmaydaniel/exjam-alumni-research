const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yzrzjagkkycmdwuhrvww.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTc2MzksImV4cCI6MjA3MTQ5MzYzOX0.p_S5zIZHE9fBDL4ZiP-NZd8vDKIyHvfxje4WqaE-KoA";

async function testAuth() {
  console.log("🔄 Testing Supabase authentication...");

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Try to sign in with the admin credentials
    console.log("📝 Attempting to sign in with admin credentials...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@exjamalumni.org",
      password: "Admin@2025!",
    });

    if (error) {
      console.error("❌ Authentication failed:", error.message);
      console.error("📋 Full error:", error);
      return;
    }

    if (data.user) {
      console.log("✅ Authentication successful!");
      console.log("🔑 User ID:", data.user.id);
      console.log("📧 Email:", data.user.email);
      console.log("✅ Email confirmed:", data.user.email_confirmed_at !== null);
    } else {
      console.log("❌ No user data returned");
    }
  } catch (error) {
    console.error("❌ Error during authentication:", error.message);
  }
}

// Run the test
testAuth();
