/**
 * Storage Migration Script
 * Migrates existing assets to the new organized bucket structure
 */

import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "../lib/supabase/storage";
import fs from "fs/promises";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface MigrationLog {
  timestamp: string;
  operation: "CREATE_BUCKET" | "MIGRATE_FILE" | "ERROR" | "SUCCESS";
  details: string;
  error?: string;
}

class StorageMigrator {
  private log: MigrationLog[] = [];

  private addLog(operation: MigrationLog["operation"], details: string, error?: string) {
    this.log.push({
      timestamp: new Date().toISOString(),
      operation,
      details,
      error,
    });
    console.log(`[${operation}] ${details}${error ? ` - Error: ${error}` : ""}`);
  }

  async createBuckets() {
    this.addLog("CREATE_BUCKET", "Starting bucket creation...");

    const buckets = [
      {
        id: "exjam-assets",
        name: "exjam-assets",
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
      },
      {
        id: "exjam-profiles",
        name: "exjam-profiles",
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
      },
      {
        id: "exjam-events",
        name: "exjam-events",
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"],
      },
      {
        id: "exjam-documents",
        name: "exjam-documents",
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      },
      {
        id: "exjam-badges",
        name: "exjam-badges",
        public: true,
        fileSizeLimit: 1 * 1024 * 1024, // 1MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml"],
      },
    ];

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes,
        });

        if (error && !error.message.includes("already exists")) {
          this.addLog("ERROR", `Failed to create bucket ${bucket.id}`, error.message);
        } else {
          this.addLog("CREATE_BUCKET", `Created bucket: ${bucket.id}`);
        }
      } catch (error) {
        this.addLog(
          "ERROR",
          `Exception creating bucket ${bucket.id}`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  async createFolderStructure() {
    this.addLog("CREATE_BUCKET", "Creating folder structure...");

    const folders = [
      // Assets bucket folders
      { bucket: "exjam-assets", path: "logos/.gitkeep" },
      { bucket: "exjam-assets", path: "banners/.gitkeep" },
      { bucket: "exjam-assets", path: "backgrounds/.gitkeep" },
      { bucket: "exjam-assets", path: "icons/.gitkeep" },

      // Profiles bucket folders
      { bucket: "exjam-profiles", path: "avatars/.gitkeep" },
      { bucket: "exjam-profiles", path: "covers/.gitkeep" },

      // Events bucket folders
      { bucket: "exjam-events", path: "images/.gitkeep" },
      { bucket: "exjam-events", path: "galleries/.gitkeep" },
      { bucket: "exjam-events", path: "thumbnails/.gitkeep" },

      // Documents bucket folders
      { bucket: "exjam-documents", path: "certificates/.gitkeep" },
      { bucket: "exjam-documents", path: "reports/.gitkeep" },
      { bucket: "exjam-documents", path: "presentations/.gitkeep" },

      // Badges bucket folders
      { bucket: "exjam-badges", path: "squadrons/.gitkeep" },
      { bucket: "exjam-badges", path: "achievements/.gitkeep" },
      { bucket: "exjam-badges", path: "ranks/.gitkeep" },
    ];

    for (const folder of folders) {
      try {
        const placeholderContent = new Blob([""], { type: "text/plain" });

        const { error } = await supabase.storage
          .from(folder.bucket)
          .upload(folder.path, placeholderContent, {
            upsert: true,
          });

        if (error) {
          this.addLog(
            "ERROR",
            `Failed to create folder ${folder.path} in ${folder.bucket}`,
            error.message
          );
        } else {
          this.addLog("CREATE_BUCKET", `Created folder: ${folder.bucket}/${folder.path}`);
        }
      } catch (error) {
        this.addLog(
          "ERROR",
          `Exception creating folder ${folder.path}`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  async migrateExistingAssets() {
    this.addLog("MIGRATE_FILE", "Starting asset migration...");

    // Check if there's an existing bucket to migrate from
    const { data: buckets } = await supabase.storage.listBuckets();
    const existingBucket = buckets?.find(
      (b) =>
        b.name !== "exjam-assets" &&
        b.name !== "exjam-profiles" &&
        b.name !== "exjam-events" &&
        b.name !== "exjam-documents" &&
        b.name !== "exjam-badges"
    );

    if (!existingBucket) {
      this.addLog("MIGRATE_FILE", "No existing buckets found to migrate from");
      return;
    }

    try {
      const { data: files } = await supabase.storage.from(existingBucket.name).list("", {
        limit: 1000,
        sortBy: { column: "created_at", order: "asc" },
      });

      if (!files || files.length === 0) {
        this.addLog("MIGRATE_FILE", `No files found in bucket ${existingBucket.name}`);
        return;
      }

      for (const file of files) {
        if (file.name === ".emptyFolderPlaceholder" || file.name.endsWith(".gitkeep")) {
          continue;
        }

        try {
          // Download the file
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(existingBucket.name)
            .download(file.name);

          if (downloadError) {
            this.addLog("ERROR", `Failed to download ${file.name}`, downloadError.message);
            continue;
          }

          // Determine target bucket and path based on file name/type
          const { targetBucket, targetPath } = this.determineTargetLocation(
            file.name,
            file.metadata
          );

          // Upload to new location
          const { error: uploadError } = await supabase.storage
            .from(targetBucket)
            .upload(targetPath, fileData, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            this.addLog(
              "ERROR",
              `Failed to upload ${file.name} to ${targetBucket}/${targetPath}`,
              uploadError.message
            );
          } else {
            this.addLog("MIGRATE_FILE", `Migrated ${file.name} -> ${targetBucket}/${targetPath}`);
          }
        } catch (error) {
          this.addLog(
            "ERROR",
            `Exception migrating ${file.name}`,
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    } catch (error) {
      this.addLog(
        "ERROR",
        "Exception during migration",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private determineTargetLocation(
    fileName: string,
    metadata: any
  ): { targetBucket: string; targetPath: string } {
    const lowerFileName = fileName.toLowerCase();
    const timestamp = Date.now();

    // Logo files
    if (
      lowerFileName.includes("logo") ||
      lowerFileName.includes("exjam") ||
      lowerFileName.includes("afms")
    ) {
      return {
        targetBucket: "exjam-assets",
        targetPath: `logos/${timestamp}-${fileName}`,
      };
    }

    // Banner files
    if (lowerFileName.includes("banner") || lowerFileName.includes("hero")) {
      return {
        targetBucket: "exjam-assets",
        targetPath: `banners/${timestamp}-${fileName}`,
      };
    }

    // Avatar/profile files
    if (lowerFileName.includes("avatar") || lowerFileName.includes("profile")) {
      return {
        targetBucket: "exjam-profiles",
        targetPath: `avatars/${timestamp}-${fileName}`,
      };
    }

    // Event files
    if (
      lowerFileName.includes("event") ||
      lowerFileName.includes("conference") ||
      lowerFileName.includes("meeting")
    ) {
      return {
        targetBucket: "exjam-events",
        targetPath: `images/${timestamp}-${fileName}`,
      };
    }

    // Badge files
    if (
      lowerFileName.includes("badge") ||
      lowerFileName.includes("achievement") ||
      lowerFileName.includes("rank")
    ) {
      return {
        targetBucket: "exjam-badges",
        targetPath: `achievements/${timestamp}-${fileName}`,
      };
    }

    // PDF documents
    if (lowerFileName.endsWith(".pdf")) {
      return {
        targetBucket: "exjam-documents",
        targetPath: `reports/${timestamp}-${fileName}`,
      };
    }

    // Default to assets
    return {
      targetBucket: "exjam-assets",
      targetPath: `icons/${timestamp}-${fileName}`,
    };
  }

  async migrateLocalAssets() {
    this.addLog("MIGRATE_FILE", "Starting local asset migration...");

    const publicDir = path.join(process.cwd(), "public");
    const assetsToMigrate = [
      { local: "exjam-logo.svg", bucket: "exjam-assets", path: "logos/exjam-logo-main.svg" },
      { local: "afms-logo.png", bucket: "exjam-assets", path: "logos/afms-logo-main.png" },
      {
        local: "images/hero-banner.jpg",
        bucket: "exjam-assets",
        path: "banners/hero-banner-main.jpg",
      },
      {
        local: "images/default-avatar.png",
        bucket: "exjam-profiles",
        path: "avatars/default-avatar.png",
      },
    ];

    for (const asset of assetsToMigrate) {
      try {
        const localPath = path.join(publicDir, asset.local);

        // Check if file exists
        try {
          await fs.access(localPath);
        } catch {
          this.addLog("MIGRATE_FILE", `Local file not found: ${asset.local}`);
          continue;
        }

        // Read file
        const fileBuffer = await fs.readFile(localPath);
        const mimeType = this.getMimeType(asset.local);

        // Upload to Supabase
        const { error } = await supabase.storage.from(asset.bucket).upload(asset.path, fileBuffer, {
          cacheControl: "3600",
          contentType: mimeType,
          upsert: true,
        });

        if (error) {
          this.addLog("ERROR", `Failed to upload ${asset.local}`, error.message);
        } else {
          this.addLog(
            "MIGRATE_FILE",
            `Uploaded local asset: ${asset.local} -> ${asset.bucket}/${asset.path}`
          );
        }
      } catch (error) {
        this.addLog(
          "ERROR",
          `Exception uploading ${asset.local}`,
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  async generateMigrationReport() {
    const reportPath = path.join(process.cwd(), "storage-migration-report.json");
    const summary = {
      timestamp: new Date().toISOString(),
      totalOperations: this.log.length,
      successful: this.log.filter((l) => l.operation === "SUCCESS" || l.operation !== "ERROR")
        .length,
      errors: this.log.filter((l) => l.operation === "ERROR").length,
      buckets: Object.keys(STORAGE_BUCKETS).length,
      log: this.log,
    };

    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    this.addLog("SUCCESS", `Migration report saved to: ${reportPath}`);

    return summary;
  }

  async run() {
    try {
      console.log("🚀 Starting Storage Migration...\n");

      // Step 1: Create buckets
      await this.createBuckets();

      // Step 2: Create folder structure
      await this.createFolderStructure();

      // Step 3: Migrate existing assets
      await this.migrateExistingAssets();

      // Step 4: Migrate local assets
      await this.migrateLocalAssets();

      // Step 5: Generate report
      const summary = await this.generateMigrationReport();

      console.log("\n✅ Migration Complete!");
      console.log(`📊 Summary: ${summary.successful} successful, ${summary.errors} errors`);

      if (summary.errors > 0) {
        console.log("❌ There were errors during migration. Check the report for details.");
        process.exit(1);
      }
    } catch (error) {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new StorageMigrator();
  migrator.run();
}

export { StorageMigrator };
