import { NextRequest, NextResponse } from "next/server";
import { AssetManager, STORAGE_BUCKETS } from "@/lib/supabase/storage";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const photo = formData.get("photo") as File;

    if (!userId || !photo) {
      return NextResponse.json({ error: "Missing userId or photo" }, { status: 400 });
    }

    // Validate file type
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = photo.name.split(".").pop() || "jpg";
    const fileName = `${userId}_${timestamp}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    // Delete old profile photos if they exist
    try {
      const { data: existingFiles } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .list(userId);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((file) => `${userId}/${file.name}`);
        await supabase.storage.from(STORAGE_BUCKETS.PROFILE_PHOTOS).remove(filesToDelete);
      }
    } catch (error) {
      console.error("Error deleting old photos:", error);
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload new photo to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
      .upload(filePath, buffer, {
        contentType: photo.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKETS.PROFILE_PHOTOS).getPublicUrl(filePath);

    // Update user profile with photo URL
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          profilePhoto: publicUrl,
          profilePhotoPath: filePath,
        },
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      // Photo uploaded but database update failed
      // Continue anyway as photo is stored
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to retrieve user's profile photo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get user's profile photo from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profilePhoto: true,
        profilePhotoPath: true,
      },
    });

    if (!user || !user.profilePhoto) {
      return NextResponse.json({ error: "No profile photo found" }, { status: 404 });
    }

    return NextResponse.json({
      url: user.profilePhoto,
      path: user.profilePhotoPath,
    });
  } catch (error) {
    console.error("Get photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to remove user's profile photo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get user's photo path from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhotoPath: true },
    });

    if (user?.profilePhotoPath) {
      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.PROFILE_PHOTOS)
        .remove([user.profilePhotoPath]);

      if (error) {
        console.error("Storage deletion error:", error);
      }
    }

    // Clear photo fields in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: null,
        profilePhotoPath: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile photo deleted successfully",
    });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
