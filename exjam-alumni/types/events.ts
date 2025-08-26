/**
 * Comprehensive Event Type Definitions
 * Optimized for performance and type safety
 */

import { z } from 'zod';

// Core Event Status Enum
export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  SOLD_OUT = 'SOLD_OUT',
}

// Event Priority Levels
export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Event Categories
export enum EventCategory {
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  REUNION = 'REUNION',
  NETWORKING = 'NETWORKING',
  SOCIAL = 'SOCIAL',
  FUNDRAISING = 'FUNDRAISING',
  CEREMONY = 'CEREMONY',
  TRAINING = 'TRAINING',
}

// Validation Schemas
export const eventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  shortDescription: z.string().min(1, 'Short description is required').max(500, 'Short description too long'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  venue: z.string().min(1, 'Venue is required').max(200, 'Venue name too long'),
  address: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  price: z.number().nonnegative('Price cannot be negative'),
  earlyBirdPrice: z.number().nonnegative('Early bird price cannot be negative').optional(),
  earlyBirdDeadline: z.string().datetime('Invalid early bird deadline format').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  status: z.nativeEnum(EventStatus).default(EventStatus.DRAFT),
  category: z.nativeEnum(EventCategory).default(EventCategory.CONFERENCE),
  priority: z.nativeEnum(EventPriority).default(EventPriority.MEDIUM),
  tags: z.array(z.string()).default([]),
  isVirtual: z.boolean().default(false),
  virtualMeetingUrl: z.string().url('Invalid meeting URL').optional(),
  requiresApproval: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  maxRegistrationsPerUser: z.number().int().positive().default(1),
  registrationDeadline: z.string().datetime().optional(),
  cancellationDeadline: z.string().datetime().optional(),
  refundPolicy: z.string().optional(),
  additionalInfo: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => !data.earlyBirdDeadline || new Date(data.earlyBirdDeadline) < new Date(data.startDate),
  {
    message: "Early bird deadline must be before event start date",
    path: ["earlyBirdDeadline"],
  }
);

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().uuid('Invalid event ID'),
});

export const eventQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  category: z.nativeEnum(EventCategory).optional(),
  priority: z.nativeEnum(EventPriority).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  venue: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isVirtual: z.boolean().optional(),
  showPast: z.boolean().default(false),
  showPrivate: z.boolean().default(false),
  organizerId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['startDate', 'createdAt', 'title', 'priority']).default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Core Event Interface
export interface BaseEvent {
  id: string;
  title: string;
  description?: string;
  shortDescription: string;
  startDate: string;
  endDate: string;
  venue: string;
  address?: string;
  capacity: number;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  imageUrl?: string;
  status: EventStatus;
  category: EventCategory;
  priority: EventPriority;
  tags: string[];
  isVirtual: boolean;
  virtualMeetingUrl?: string;
  requiresApproval: boolean;
  isPrivate: boolean;
  maxRegistrationsPerUser: number;
  registrationDeadline?: string;
  cancellationDeadline?: string;
  refundPolicy?: string;
  additionalInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  organizerId?: string;
}

// Extended Event with computed fields and relations
export interface Event extends BaseEvent {
  registrationCount: number;
  availableSpots: number;
  isEarlyBird: boolean;
  isRegistrationOpen: boolean;
  isSoldOut: boolean;
  isPastEvent: boolean;
  daysUntilEvent: number;
  organizer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  registrations?: EventRegistration[];
  waitlist?: EventWaitlist[];
}

// Event Registration Types
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';
  registrationDate: string;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dietary?: string;
    accessibility?: string;
    emergencyContact?: string;
    additionalInfo?: Record<string, any>;
  };
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  paymentId?: string;
  ticketId?: string;
  checkInTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventWaitlist {
  id: string;
  eventId: string;
  email: string;
  position: number;
  notified: boolean;
  createdAt: string;
}

// Event Statistics
export interface EventStats {
  eventId: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  waitlistCount: number;
  revenue: number;
  avgRating?: number;
  attendanceRate?: number;
  noShowRate?: number;
}

// Event Creation/Update DTOs
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;

// API Response Types
export interface EventsResponse {
  events: Event[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  stats?: {
    totalEvents: number;
    publishedEvents: number;
    upcomingEvents: number;
    pastEvents: number;
  };
}

export interface EventResponse {
  event: Event;
  stats?: EventStats;
  relatedEvents?: Event[];
}

// Event Card Display Props
export interface EventCardProps {
  event: Event;
  variant?: 'default' | 'featured' | 'compact' | 'minimal';
  showImage?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
  showTags?: boolean;
  showStatus?: boolean;
  showRegistrationInfo?: boolean;
  onRegister?: (eventId: string) => void;
  onShare?: (event: Event) => void;
  onFavorite?: (eventId: string) => void;
  className?: string;
}

// Fallback Event Data
export const FALLBACK_EVENT: Event = {
  id: 'pg-conference-2025-fallback',
  title: 'President General\'s Conference - Maiden Flight',
  shortDescription: 'Join us for "Maiden Flight" - the inaugural President General\'s Conference bringing together Ex-Junior Airmen from across Nigeria and the diaspora.',
  description: 'Three days of networking, professional development, and celebrating the bonds forged at the Academy. Experience keynote addresses, interactive workshops, and unforgettable entertainment.',
  startDate: '2025-11-28T09:00:00.000Z',
  endDate: '2025-11-30T18:00:00.000Z',
  venue: 'NAF Conference Centre',
  address: 'Federal Capital Territory (FCT), Abuja, Nigeria',
  capacity: 500,
  price: 20000,
  earlyBirdPrice: 15000,
  earlyBirdDeadline: '2025-10-28T23:59:59.000Z',
  imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop&crop=center',
  status: EventStatus.PUBLISHED,
  category: EventCategory.CONFERENCE,
  priority: EventPriority.HIGH,
  tags: ['conference', 'leadership', 'networking', 'alumni', 'maiden-flight'],
  isVirtual: false,
  requiresApproval: false,
  isPrivate: false,
  maxRegistrationsPerUser: 1,
  registrationDeadline: '2025-11-25T23:59:59.000Z',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  organizerId: undefined,
  // Computed fields
  registrationCount: 0,
  availableSpots: 500,
  isEarlyBird: true,
  isRegistrationOpen: true,
  isSoldOut: false,
  isPastEvent: false,
  daysUntilEvent: Math.ceil((new Date('2025-11-28').getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
};