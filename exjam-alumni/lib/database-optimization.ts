import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

// Ultra-optimized database client with connection pooling
class OptimizedPrismaClient extends PrismaClient {
  private queryCache = new Map<string, any>();
  private connectionPool: PrismaClient[] = [];
  private currentConnection = 0;

  constructor() {
    super({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Initialize connection pool
    this.initializeConnectionPool();
  }

  private initializeConnectionPool() {
    const poolSize = parseInt(process.env.DB_POOL_SIZE || "5");

    for (let i = 0; i < poolSize; i++) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
      this.connectionPool.push(client);
    }
  }

  // Round-robin connection distribution
  private getConnection(): PrismaClient {
    if (this.connectionPool.length === 0) return this;

    const connection = this.connectionPool[this.currentConnection];
    this.currentConnection = (this.currentConnection + 1) % this.connectionPool.length;
    return connection;
  }

  // Optimized event queries with smart caching
  async getEventsOptimized(
    filters: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
      includeRegistrations?: boolean;
    } = {}
  ) {
    const cacheKey = `events-${JSON.stringify(filters)}`;

    return unstable_cache(
      async () => {
        const connection = this.getConnection();
        const { status, search, limit = 50, offset = 0, includeRegistrations = true } = filters;

        // Build optimized query
        const where: any = {};

        if (status) {
          where.status = status;
        }

        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { shortDescription: { contains: search, mode: "insensitive" } },
            { venue: { contains: search, mode: "insensitive" } },
          ];
        }

        const select: any = {
          id: true,
          title: true,
          shortDescription: true,
          startDate: true,
          endDate: true,
          venue: true,
          address: true,
          price: true,
          capacity: true,
          imageUrl: true,
          status: true,
          createdAt: true,
        };

        if (includeRegistrations) {
          select._count = {
            select: { registrations: true },
          };
        }

        const [events, total] = await Promise.all([
          connection.event.findMany({
            where,
            select,
            orderBy: { startDate: "asc" },
            take: limit,
            skip: offset,
          }),
          connection.event.count({ where }),
        ]);

        return {
          events,
          total,
          hasMore: offset + limit < total,
        };
      },
      [cacheKey],
      {
        revalidate: status === "UPCOMING" ? 300 : 3600, // 5 min for upcoming, 1 hour for others
        tags: ["events"],
      }
    )();
  }

  // Streaming query results for large datasets
  async *streamEvents(batchSize = 100) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const connection = this.getConnection();
      const batch = await connection.event.findMany({
        take: batchSize,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          shortDescription: true,
          startDate: true,
          venue: true,
          price: true,
          _count: {
            select: { registrations: true },
          },
        },
      });

      if (batch.length === 0) {
        hasMore = false;
      } else {
        yield batch;
        offset += batchSize;
        hasMore = batch.length === batchSize;
      }

      // Small delay to prevent overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // Optimized user queries with relationship loading
  async getUserWithRegistrationsOptimized(userId: string) {
    const cacheKey = `user-${userId}-with-registrations`;

    return unstable_cache(
      async () => {
        const connection = this.getConnection();

        return connection.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            serviceNumber: true,
            squadron: true,
            phone: true,
            profilePhoto: true,
            role: true,
            registrations: {
              select: {
                id: true,
                status: true,
                ticketType: true,
                createdAt: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                    startDate: true,
                    venue: true,
                    price: true,
                  },
                },
                ticket: {
                  select: {
                    id: true,
                    ticketNumber: true,
                    checkedIn: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });
      },
      [cacheKey],
      {
        revalidate: 1800, // 30 minutes
        tags: [`user-${userId}`, "registrations"],
      }
    )();
  }

  // Batch operations for better performance
  async batchCreateRegistrations(registrations: any[]) {
    const connection = this.getConnection();

    return connection.$transaction(async (tx) => {
      const results = [];

      // Process in smaller batches to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < registrations.length; i += batchSize) {
        const batch = registrations.slice(i, i + batchSize);
        const batchResults = await tx.registration.createMany({
          data: batch,
          skipDuplicates: true,
        });
        results.push(batchResults);
      }

      return results;
    });
  }

  // Analytics queries with aggregation
  async getDashboardAnalytics() {
    return unstable_cache(
      async () => {
        const connection = this.getConnection();

        const [
          totalEvents,
          upcomingEvents,
          totalUsers,
          totalRegistrations,
          recentRegistrations,
          popularEvents,
        ] = await Promise.all([
          connection.event.count(),
          connection.event.count({
            where: {
              startDate: { gte: new Date() },
            },
          }),
          connection.user.count(),
          connection.registration.count(),
          connection.registration.findMany({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
            select: {
              id: true,
              createdAt: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              event: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          connection.event.findMany({
            select: {
              id: true,
              title: true,
              startDate: true,
              _count: {
                select: { registrations: true },
              },
            },
            orderBy: {
              registrations: {
                _count: "desc",
              },
            },
            take: 5,
          }),
        ]);

        return {
          totalEvents,
          upcomingEvents,
          totalUsers,
          totalRegistrations,
          recentRegistrations,
          popularEvents,
          registrationRate: totalRegistrations / Math.max(totalEvents, 1),
        };
      },
      ["dashboard-analytics"],
      {
        revalidate: 300, // 5 minutes
        tags: ["analytics"],
      }
    )();
  }

  // Search with full-text search capabilities
  async searchOptimized(query: string, type: "events" | "users" | "all" = "all") {
    const cacheKey = `search-${query}-${type}`;

    return unstable_cache(
      async () => {
        const connection = this.getConnection();
        const searchTerms = query.split(" ").filter((term) => term.length > 2);

        const results: any = {};

        if (type === "events" || type === "all") {
          results.events = await connection.event.findMany({
            where: {
              OR: searchTerms.flatMap((term) => [
                { title: { contains: term, mode: "insensitive" } },
                { shortDescription: { contains: term, mode: "insensitive" } },
                { venue: { contains: term, mode: "insensitive" } },
              ]),
            },
            select: {
              id: true,
              title: true,
              shortDescription: true,
              startDate: true,
              venue: true,
              price: true,
            },
            take: 10,
          });
        }

        if (type === "users" || type === "all") {
          results.users = await connection.user.findMany({
            where: {
              OR: searchTerms.flatMap((term) => [
                { firstName: { contains: term, mode: "insensitive" } },
                { lastName: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
                { serviceNumber: { contains: term, mode: "insensitive" } },
              ]),
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              serviceNumber: true,
              squadron: true,
            },
            take: 10,
          });
        }

        return results;
      },
      [cacheKey],
      {
        revalidate: 600, // 10 minutes
        tags: ["search"],
      }
    )();
  }

  // Connection cleanup
  async cleanup() {
    await Promise.all([
      this.$disconnect(),
      ...this.connectionPool.map((client) => client.$disconnect()),
    ]);
  }
}

// Global instance with proper cleanup
let globalPrisma: OptimizedPrismaClient;

if (process.env.NODE_ENV === "production") {
  globalPrisma = new OptimizedPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new OptimizedPrismaClient();
  }
  globalPrisma = global.prisma;
}

// Cleanup on process exit
process.on("beforeExit", async () => {
  await globalPrisma.cleanup();
});

export const optimizedPrisma = globalPrisma;

// Database health monitoring
export async function checkDatabaseHealth() {
  try {
    const start = Date.now();
    await optimizedPrisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;

    return {
      status: "healthy",
      responseTime: duration,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}

// Query performance monitoring
export class QueryProfiler {
  private static queries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }> = [];

  static startProfiling(query: string) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.queries.push({
        query,
        duration,
        timestamp: new Date(),
      });

      // Keep only last 100 queries
      if (this.queries.length > 100) {
        this.queries.shift();
      }
    };
  }

  static getStats() {
    if (this.queries.length === 0) return null;

    const durations = this.queries.map((q) => q.duration);
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return {
      totalQueries: this.queries.length,
      averageTime: average,
      maxTime: max,
      minTime: min,
      slowQueries: this.queries.filter((q) => q.duration > 1000), // Queries > 1s
    };
  }

  static clearStats() {
    this.queries = [];
  }
}
