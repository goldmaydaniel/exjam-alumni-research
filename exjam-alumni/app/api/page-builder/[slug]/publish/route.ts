import { NextRequest, NextResponse } from "next/server";
import { PageBuilderData } from "@/lib/page-builder/types";

// In-memory store (use database in production)
const pageDataStore = new Map<string, PageBuilderData>();
const publishedPagesStore = new Map<string, PageBuilderData>();

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const pageData: PageBuilderData = await request.json();

    // Validate the data
    if (!pageData.id || !pageData.sections) {
      return NextResponse.json({ error: "Invalid page data" }, { status: 400 });
    }

    // Update status to published
    const publishedData: PageBuilderData = {
      ...pageData,
      meta: {
        ...pageData.meta,
        status: "published",
        updatedAt: new Date().toISOString(),
      },
    };

    // Save both draft and published versions
    pageDataStore.set(slug, publishedData);
    publishedPagesStore.set(slug, publishedData);

    // In a real app, you might also:
    // - Generate static HTML files
    // - Clear CDN cache
    // - Send notifications
    // - Update search index
    // - Trigger deployment

    console.log(`Page "${slug}" published successfully`);

    return NextResponse.json({
      success: true,
      data: publishedData,
      message: "Page published successfully",
    });
  } catch (error) {
    console.error("Error publishing page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Get published page data
    const publishedData = publishedPagesStore.get(slug);

    if (!publishedData) {
      return NextResponse.json({ error: "Published page not found" }, { status: 404 });
    }

    return NextResponse.json(publishedData);
  } catch (error) {
    console.error("Error fetching published page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
