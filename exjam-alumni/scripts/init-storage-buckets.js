const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORAGE_BUCKETS = {
  PROFILE_PHOTOS: "profile-photos",
  EVENT_BADGES: "event-badges",
  BADGE_TEMPLATES: "badge-templates",
  EVENT_ASSETS: "event-assets",
};

async function initializeStorageBuckets() {
  console.log("Initializing storage buckets...");

  for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
    try {
      // Check if bucket exists
      const { data: existingBuckets } = await supabase.storage.listBuckets();
      const bucketExists = existingBuckets?.some((b) => b.name === bucketName);

      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);

        // Set different configurations for different buckets
        let bucketConfig = {
          public: true,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          fileSizeLimit: 5242880, // 5MB
        };

        if (bucketName === "event-badges" || bucketName === "badge-templates") {
          bucketConfig.allowedMimeTypes.push("application/pdf", "text/html");
        }

        const { error } = await supabase.storage.createBucket(bucketName, bucketConfig);

        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error.message);
        } else {
          console.log(`✅ Bucket ${bucketName} created successfully`);
        }
      } else {
        console.log(`✓ Bucket ${bucketName} already exists`);
      }
    } catch (error) {
      console.error(`Error processing bucket ${bucketName}:`, error);
    }
  }

  console.log("\nStorage buckets initialization complete!");
}

// Run the initialization
initializeStorageBuckets().catch(console.error);
