#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorageBuckets() {
  console.log("🔧 Setting up Supabase Storage buckets...\n");

  try {
    // List existing buckets
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    console.log("📋 Existing buckets:", existingBuckets?.map((b) => b.name).join(", ") || "None");

    const bucketsToCreate = [
      {
        name: "event-badges",
        config: {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "application/pdf", "text/html"],
          fileSizeLimit: 5242880, // 5MB
        },
        description: "Event badges and QR codes",
      },
      {
        name: "badge-templates",
        config: {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "application/json"],
          fileSizeLimit: 2097152, // 2MB
        },
        description: "Badge templates and designs",
      },
      {
        name: "profile-photos",
        config: {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
          fileSizeLimit: 2097152, // 2MB
        },
        description: "User profile photos",
      },
      {
        name: "event-resources",
        config: {
          public: false,
          allowedMimeTypes: ["application/pdf", "image/png", "image/jpeg", "video/mp4"],
          fileSizeLimit: 52428800, // 50MB
        },
        description: "Event resources and documents",
      },
    ];

    let successCount = 0;
    let skipCount = 0;

    for (const bucket of bucketsToCreate) {
      const exists = existingBuckets?.some((b) => b.name === bucket.name);

      if (exists) {
        console.log(`⏭️  Bucket '${bucket.name}' already exists - ${bucket.description}`);
        skipCount++;
        continue;
      }

      console.log(`🚀 Creating bucket '${bucket.name}'...`);

      const { error } = await supabase.storage.createBucket(bucket.name, bucket.config);

      if (error) {
        console.error(`❌ Failed to create bucket '${bucket.name}':`, error.message);
      } else {
        console.log(`✅ Created bucket '${bucket.name}' - ${bucket.description}`);
        successCount++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`✅ Created: ${successCount} buckets`);
    console.log(`⏭️  Skipped: ${skipCount} buckets (already exist)`);

    // Set up RLS policies for event-resources bucket (private)
    if (successCount > 0) {
      console.log("\n🔒 Setting up RLS policies...");

      try {
        // Note: RLS policies for storage are typically set up via SQL or Supabase dashboard
        // This is a placeholder for documentation
        console.log("📝 Remember to set up RLS policies for private buckets in Supabase dashboard");
        console.log(
          "   - event-resources: Authenticated users can access based on event registration"
        );
        console.log("   - Other buckets are public by default");
      } catch (error) {
        console.warn("⚠️  Could not set up RLS policies automatically");
      }
    }

    console.log("\n🎉 Storage bucket setup complete!");
    console.log("\n📖 Bucket Usage:");
    console.log("   - event-badges: Badge HTML files, QR codes, generated badge images");
    console.log("   - badge-templates: Custom badge templates from Canvas or admin uploads");
    console.log("   - profile-photos: User profile pictures for badges and directory");
    console.log("   - event-resources: Private event documents, presentations, recordings");
  } catch (error) {
    console.error("❌ Storage setup failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Storage setup interrupted");
  process.exit(1);
});

setupStorageBuckets().catch((error) => {
  console.error("❌ Storage setup failed:", error);
  process.exit(1);
});
