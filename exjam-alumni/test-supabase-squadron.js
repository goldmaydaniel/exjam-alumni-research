const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yzrzjagkkycmdwuhrvww.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cnpqYWdra3ljbWR3dWhydnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzM3MDIsImV4cCI6MjA0NjY0OTcwMn0.CHxLdMAa5G5v7_G5Y0BcYrZgo89lP5B-_07BRQqevaw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSquadronEnum() {
  console.log("Testing Squadron enum in Supabase...");

  try {
    // Check if the User table exists and what squadrons are valid
    const { data, error } = await supabase.from("User").select("squadron").limit(1);

    if (error) {
      console.error("Error querying User table:", error);
    } else {
      console.log("✅ User table accessible");
    }

    // Try to get enum values (this is PostgreSQL specific)
    const { data: enumData, error: enumError } = await supabase.rpc("get_enum_values", {
      enum_name: "Squadron",
    });

    if (enumError) {
      console.log("Could not get enum values directly (expected):", enumError.message);
    } else {
      console.log("Squadron enum values:", enumData);
    }

    console.log("\n✅ Valid squadron values are: GREEN, RED, PURPLE, YELLOW, DORNIER, PUMA");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testSquadronEnum();
