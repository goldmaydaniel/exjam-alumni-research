import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/middleware/auth";

interface SearchParams {
  query?: string;
  filter?: "all" | "alumni" | "events" | "content";
  limit?: number;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get("q") || "";
      const filter = (searchParams.get("filter") as SearchParams["filter"]) || "all";
      const limit = parseInt(searchParams.get("limit") || "10");

      if (!query.trim() || query.length < 2) {
        return NextResponse.json({ results: [] });
      }

      const results: any[] = [];
      const searchQuery = query.toLowerCase().trim();

      // Search Events
      if (filter === "all" || filter === "events") {
        const events = await prisma.event.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { venue: { contains: searchQuery, mode: "insensitive" } },
            ],
            status: { not: "CANCELLED" },
          },
          select: {
            id: true,
            title: true,
            description: true,
            venue: true,
            startDate: true,
            endDate: true,
            imageUrl: true,
            capacity: true,
            price: true,
            earlyBirdPrice: true,
            earlyBirdDeadline: true,
            _count: {
              select: {
                registrations: true,
              },
            },
          },
          orderBy: { startDate: "asc" },
          take: Math.floor(limit / 2),
        });

        events.forEach((event) => {
          results.push({
            id: event.id,
            type: "event",
            title: event.title,
            description:
              event.description ||
              `${event.venue} • ${new Date(event.startDate).toLocaleDateString()}`,
            url: `/events/${event.id}`,
            metadata: {
              location: event.venue,
              date: new Date(event.startDate).toLocaleDateString(),
              registrations: event._count.registrations,
              capacity: event.capacity,
              price: event.price,
              earlyBirdPrice: event.earlyBirdPrice,
              imageUrl: event.imageUrl,
            },
            relevanceScore: calculateRelevance(
              query,
              [event.title, event.description, event.venue].join(" ")
            ),
          });
        });
      }

      // Search Alumni/Users (only if user has permission)
      if (
        (filter === "all" || filter === "alumni") &&
        (user.userType === "ADMIN" || user.userType === "ALUMNI")
      ) {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: searchQuery, mode: "insensitive" } },
              { lastName: { contains: searchQuery, mode: "insensitive" } },
              { email: { contains: searchQuery, mode: "insensitive" } },
              { serviceNumber: { contains: searchQuery, mode: "insensitive" } },
            ],
            userType: { in: ["ALUMNI", "ADMIN"] },
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            userType: true,
            serviceNumber: true,
            createdAt: true,
          },
          orderBy: [
            { userType: "desc" }, // ADMIN first, then ALUMNI
            { firstName: "asc" },
          ],
          take: Math.floor(limit / 2),
        });

        users.forEach((user) => {
          results.push({
            id: user.id,
            type: "user",
            title: `${user.firstName} ${user.lastName}`,
            description: `${user.userType.toLowerCase()} • ${user.email}`,
            url: `/users/${user.id}`,
            metadata: {
              email: user.email,
              userType: user.userType,
              serviceNumber: user.serviceNumber,
              memberSince: new Date(user.createdAt).getFullYear(),
            },
            relevanceScore: calculateRelevance(
              query,
              [user.firstName, user.lastName, user.email, user.serviceNumber || ""].join(" ")
            ),
          });
        });
      }

      // Sort by relevance and limit results
      const sortedResults = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      return NextResponse.json({
        results: sortedResults,
        events: results.filter((r) => r.type === "event"),
        users: results.filter((r) => r.type === "user"),
        totalResults: results.length,
        query,
        filter,
      });
    } catch (error) {
      console.error("Search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { query, filter = "all", limit = 10 } = body;

      if (!query || !query.trim() || query.length < 2) {
        return NextResponse.json({ results: [] });
      }

      // Use the same logic as GET but with POST body
      const searchParams = new URLSearchParams({
        q: query,
        filter,
        limit: limit.toString(),
      });

      const getRequest = new NextRequest(`${request.nextUrl.origin}/api/search?${searchParams}`, {
        method: "GET",
        headers: request.headers,
      });

      return GET(getRequest);
    } catch (error) {
      console.error("Search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
  });
}

// Helper function to calculate text relevance
function calculateRelevance(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let score = 0;

  // Exact match bonus
  if (textLower.includes(queryLower)) {
    score += 100;
  }

  // Word match scoring
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);

  queryWords.forEach((queryWord) => {
    textWords.forEach((textWord) => {
      if (textWord.startsWith(queryWord)) {
        score += 50;
      } else if (textWord.includes(queryWord)) {
        score += 25;
      }
    });
  });

  return score;
}
