import { NextRequest, NextResponse } from "next/server";
import { PageBuilderData } from "@/lib/page-builder/types";

// In a real app, you'd use a database like Prisma
// For now, we'll use a simple in-memory store (this will be lost on restart)
const pageDataStore = new Map<string, PageBuilderData>();

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Get page data from store (in real app, from database)
    const pageData = pageDataStore.get(slug);

    if (!pageData) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(pageData);
  } catch (error) {
    console.error("Error fetching page data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const pageData: PageBuilderData = await request.json();

    // Validate the data
    if (!pageData.id || !pageData.sections) {
      return NextResponse.json({ error: "Invalid page data" }, { status: 400 });
    }

    // Update timestamp
    pageData.meta.updatedAt = new Date().toISOString();

    // Save to store (in real app, save to database)
    pageDataStore.set(slug, pageData);

    // In a real app, you might also:
    // - Validate user permissions
    // - Log the change
    // - Trigger webhooks
    // - Clear CDN cache

    return NextResponse.json({ success: true, data: pageData });
  } catch (error) {
    console.error("Error saving page data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Delete from store (in real app, from database)
    const existed = pageDataStore.delete(slug);

    if (!existed) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting page data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
