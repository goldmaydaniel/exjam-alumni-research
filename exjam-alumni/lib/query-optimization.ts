import { NextRequest } from "next/server";

// Pagination utilities
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function parsePaginationParams(req: NextRequest): PaginationParams {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  return { page, limit, sortBy, sortOrder };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const { page = 1, limit = 10 } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

// Query optimization helpers
export function buildOrderBy(sortBy: string, sortOrder: "asc" | "desc") {
  const validSortFields = [
    "id",
    "createdAt",
    "updatedAt",
    "title",
    "startDate",
    "endDate",
    "email",
    "firstName",
    "lastName",
    "status",
    "amount",
    "ticketNumber",
  ];

  const field = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  return { [field]: sortOrder };
}

// Advanced filtering
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  role?: string;
  squadron?: string;
  eventId?: string;
  userId?: string;
}

export function parseFilterParams(req: NextRequest): FilterParams {
  const { searchParams } = new URL(req.url);

  return {
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    role: searchParams.get("role") || undefined,
    squadron: searchParams.get("squadron") || undefined,
    eventId: searchParams.get("eventId") || undefined,
    userId: searchParams.get("userId") || undefined,
  };
}

// Build search conditions for different entities
export function buildUserSearchConditions(filters: FilterParams) {
  const conditions: any = {};

  if (filters.search) {
    conditions.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { serviceNumber: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    conditions.status = filters.status;
  }

  if (filters.role) {
    conditions.role = filters.role;
  }

  if (filters.squadron) {
    conditions.squadron = filters.squadron;
  }

  if (filters.dateFrom || filters.dateTo) {
    conditions.createdAt = {};
    if (filters.dateFrom) {
      conditions.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.createdAt.lte = new Date(filters.dateTo);
    }
  }

  return conditions;
}

export function buildEventSearchConditions(filters: FilterParams) {
  const conditions: any = {};

  if (filters.search) {
    conditions.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { venue: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    conditions.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    conditions.startDate = {};
    if (filters.dateFrom) {
      conditions.startDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.startDate.lte = new Date(filters.dateTo);
    }
  }

  return conditions;
}

export function buildRegistrationSearchConditions(filters: FilterParams) {
  const conditions: any = {};

  if (filters.status) {
    conditions.status = filters.status;
  }

  if (filters.eventId) {
    conditions.eventId = filters.eventId;
  }

  if (filters.userId) {
    conditions.userId = filters.userId;
  }

  if (filters.dateFrom || filters.dateTo) {
    conditions.createdAt = {};
    if (filters.dateFrom) {
      conditions.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      conditions.createdAt.lte = new Date(filters.dateTo);
    }
  }

  return conditions;
}

// Database query optimization helpers
export const OPTIMIZED_INCLUDES = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      fullName: true,
      serviceNumber: true,
      squadron: true,
      role: true,
      status: true,
      createdAt: true,
      lastLogin: true,
    },
  },
  event: {
    select: {
      id: true,
      title: true,
      shortDescription: true,
      startDate: true,
      endDate: true,
      venue: true,
      capacity: true,
      price: true,
      status: true,
      imageUrl: true,
      createdAt: true,
    },
  },
  registration: {
    select: {
      id: true,
      ticketType: true,
      status: true,
      createdAt: true,
      User: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
        },
      },
      Event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
        },
      },
    },
  },
  ticket: {
    select: {
      id: true,
      ticketNumber: true,
      checkedIn: true,
      checkedInAt: true,
      createdAt: true,
      User: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      Event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          venue: true,
        },
      },
    },
  },
};

// Caching keys
export const CACHE_KEYS = {
  USERS_LIST: "users:list",
  EVENTS_LIST: "events:list",
  REGISTRATIONS_LIST: "registrations:list",
  ANALYTICS_DASHBOARD: "analytics:dashboard",
  USER_STATS: "stats:users",
  EVENT_STATS: "stats:events",
};

// Cache duration in seconds
export const CACHE_DURATIONS = {
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};
