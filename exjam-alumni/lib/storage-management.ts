/**
 * Storage Management Utilities
 * Provides enhanced storage management with admin capabilities
 */

import { supabase } from "./supabase/client";
import { STORAGE_BUCKETS, STORAGE_FOLDERS, AssetManager } from "./supabase/storage";

export interface StorageStats {
  bucket: string;
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  avgSize: number;
  lastUpload: string;
}

export interface StorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

export interface FileUploadOptions {
  bucket: "EVENT_BADGES" | "BADGE_TEMPLATES" | "PROFILE_PHOTOS" | "EVENT_ASSETS";
  folder: string;
  userId?: string;
  eventId?: string;
  compress?: boolean;
  generateThumbnail?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export class StorageManager {
  /**
   * Get storage statistics for all buckets
   */
  static async getStorageStats(): Promise<StorageStats[]> {
    try {
      const { data, error } = await supabase.from("storage_usage").select("*");

      if (error) throw error;

      return data.map((item: any) => ({
        bucket: item.bucket_id,
        fileCount: item.file_count,
        totalSize: item.total_size_bytes,
        totalSizeFormatted: item.total_size,
        avgSize: item.avg_size_bytes,
        lastUpload: item.last_upload,
      }));
    } catch (error) {
      console.error("Error fetching storage stats:", error);
      return [];
    }
  }

  /**
   * Get detailed file listing for a bucket/folder
   */
  static async getFileList(
    bucket: "EVENT_BADGES" | "BADGE_TEMPLATES" | "PROFILE_PHOTOS" | "EVENT_ASSETS",
    folder: string = "",
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: "asc" | "desc" };
      search?: string;
    } = {}
  ): Promise<{ files: StorageFile[]; error?: string }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];
      const { data, error } = await supabase.storage.from(bucketName).list(folder, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: "created_at", order: "desc" },
      });

      if (error) {
        return { files: [], error: error.message };
      }

      let files = data || [];

      // Apply search filter if provided
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        files = files.filter((file) => file.name.toLowerCase().includes(searchLower));
      }

      return { files };
    } catch (error) {
      return {
        files: [],
        error: error instanceof Error ? error.message : "Failed to list files",
      };
    }
  }

  /**
   * Upload file with advanced options
   */
  static async uploadFile(
    file: File,
    options: FileUploadOptions
  ): Promise<{
    url?: string;
    path?: string;
    thumbnail?: string;
    error?: string;
  }> {
    try {
      const bucketName = STORAGE_BUCKETS[options.bucket];

      // Generate organized file path
      const filePath = this.generateFilePath(file, options);

      // Process file if needed
      let processedFile = file;
      if (options.compress && file.type.startsWith("image/")) {
        processedFile = await this.compressImage(file, {
          maxWidth: options.maxWidth || 1920,
          maxHeight: options.maxHeight || 1080,
          quality: options.quality || 0.8,
        });
      }

      // Upload main file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, processedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { error: error.message };
      }

      const url = supabase.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl;

      let thumbnail: string | undefined;

      // Generate thumbnail if requested
      if (options.generateThumbnail && file.type.startsWith("image/")) {
        const thumbnailResult = await this.generateThumbnail(file, bucketName, data.path);
        thumbnail = thumbnailResult.url;
      }

      // Log the upload
      await this.logStorageOperation("UPLOAD", bucketName, data.path, {
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        userId: options.userId,
        eventId: options.eventId,
      });

      return {
        url,
        path: data.path,
        thumbnail,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Bulk delete files
   */
  static async bulkDeleteFiles(
    bucket: "EVENT_BADGES" | "BADGE_TEMPLATES" | "PROFILE_PHOTOS" | "EVENT_ASSETS",
    filePaths: string[]
  ): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
  }> {
    const bucketName = STORAGE_BUCKETS[bucket];
    const errors: string[] = [];
    let deletedCount = 0;

    try {
      // Delete in chunks of 100 (Supabase limit)
      const chunks = this.chunkArray(filePaths, 100);

      for (const chunk of chunks) {
        const { error } = await supabase.storage.from(bucketName).remove(chunk);

        if (error) {
          errors.push(`Chunk error: ${error.message}`);
        } else {
          deletedCount += chunk.length;

          // Log deletions
          for (const path of chunk) {
            await this.logStorageOperation("DELETE", bucketName, path);
          }
        }
      }

      return {
        success: errors.length === 0,
        deletedCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        deletedCount,
        errors: [error instanceof Error ? error.message : "Bulk delete failed"],
      };
    }
  }

  /**
   * Move/rename files
   */
  static async moveFile(
    bucket: "EVENT_BADGES" | "BADGE_TEMPLATES" | "PROFILE_PHOTOS" | "EVENT_ASSETS",
    fromPath: string,
    toPath: string
  ): Promise<{ success: boolean; error?: string; newUrl?: string }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];

      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(fromPath);

      if (downloadError) {
        return { success: false, error: downloadError.message };
      }

      // Upload to new location
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(toPath, fileData, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Delete old file
      const { error: deleteError } = await supabase.storage.from(bucketName).remove([fromPath]);

      if (deleteError) {
        console.error("Warning: Failed to delete old file:", deleteError);
      }

      const newUrl = supabase.storage.from(bucketName).getPublicUrl(uploadData.path).data.publicUrl;

      // Log the move operation
      await this.logStorageOperation("UPDATE", bucketName, toPath, {
        operation: "MOVE",
        fromPath,
        toPath,
      });

      return { success: true, newUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Move failed",
      };
    }
  }

  /**
   * Cleanup orphaned files
   */
  static async cleanupOrphanedFiles(): Promise<{
    deletedCount: number;
    errors: string[];
  }> {
    try {
      const { data, error } = await supabase.rpc("cleanup_orphaned_storage_files");

      if (error) {
        return { deletedCount: 0, errors: [error.message] };
      }

      return { deletedCount: data || 0, errors: [] };
    } catch (error) {
      return {
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : "Cleanup failed"],
      };
    }
  }

  /**
   * Get storage logs for admin monitoring
   */
  static async getStorageLogs(
    options: {
      bucket?: string;
      operation?: "UPLOAD" | "DELETE" | "UPDATE";
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    try {
      let query = supabase
        .from("storage_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (options.bucket) {
        query = query.eq("bucket_id", options.bucket);
      }

      if (options.operation) {
        query = query.eq("operation", options.operation);
      }

      if (options.userId) {
        query = query.eq("user_id", options.userId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { logs: data || [], error: null };
    } catch (error) {
      return {
        logs: [],
        error: error instanceof Error ? error.message : "Failed to fetch logs",
      };
    }
  }

  // Private helper methods

  private static generateFilePath(file: File, options: FileUploadOptions): string {
    const timestamp = Date.now();
    const userId = options.userId || "anonymous";
    const eventId = options.eventId;

    const extension = file.name.split(".").pop()?.toLowerCase() || "unknown";

    // Clean filename
    const cleanName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Generate path based on bucket type
    let folderPath = options.folder;

    // Add user-specific paths for profiles and documents
    if (options.bucket === "PROFILE_PHOTOS" || options.bucket === "EVENT_ASSETS") {
      folderPath = `${options.folder}/${userId}`;
    }

    // Add event-specific paths for events
    if (options.bucket === "EVENT_BADGES" && eventId) {
      folderPath = `${options.folder}/${eventId}`;
    }

    const filename = `${timestamp}-${cleanName}`;
    return `${folderPath}/${filename}`;
  }

  private static async compressImage(
    file: File,
    options: { maxWidth: number; maxHeight: number; quality: number }
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        const { maxWidth, maxHeight } = options;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          options.quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private static async generateThumbnail(
    file: File,
    bucket: string,
    originalPath: string
  ): Promise<{ url?: string; error?: string }> {
    try {
      const thumbnailFile = await this.compressImage(file, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.7,
      });

      const thumbnailPath = originalPath.replace(/(\.[^.]+)$/, "-thumb$1");

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(thumbnailPath, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        return { error: error.message };
      }

      const url = supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;

      return { url };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Thumbnail generation failed",
      };
    }
  }

  private static async logStorageOperation(
    operation: "UPLOAD" | "DELETE" | "UPDATE",
    bucketId: string,
    filePath: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.from("storage_logs").insert({
        bucket_id: bucketId,
        file_path: filePath,
        operation,
        metadata,
      });
    } catch (error) {
      console.error("Failed to log storage operation:", error);
    }
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    file: File,
    allowedTypes: string[],
    maxSize: number
  ): { valid: boolean; error?: string } {
    // Check file type
    if (!allowedTypes.some((type) => file.type.startsWith(type))) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`,
      };
    }

    return { valid: true };
  }
}
