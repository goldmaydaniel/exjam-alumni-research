/**
 * Event Service Layer
 * Handles all event-related business logic with robust error handling
 */

import { supabaseService, executeWithRetry, checkConnectionHealth } from '@/lib/supabase/connection';
import {
  Event,
  EventCreateInput,
  EventUpdateInput,
  EventQueryInput,
  EventsResponse,
  EventResponse,
  EventStats,
  EventStatus,
  FALLBACK_EVENT,
  eventCreateSchema,
  eventUpdateSchema,
  eventQuerySchema,
} from '@/types/events';
import { z } from 'zod';

export class EventService {
  private static instance: EventService;

  private constructor() {}

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Get all events with advanced filtering and pagination
   */
  async getEvents(query: EventQueryInput = {}): Promise<EventsResponse> {
    const validatedQuery = eventQuerySchema.parse(query);
    
    return executeWithRetry(
      async (client) => {
        let queryBuilder = client
          .from('Event')
          .select(`
            *,
            Organizer:User!EventOrganizer(id, name, email),
            _count:Registration(count)
          `, { count: 'exact' });

        // Apply filters
        if (validatedQuery.status) {
          queryBuilder = queryBuilder.eq('status', validatedQuery.status);
        } else {
          // Default: show published and completed events for public access
          queryBuilder = queryBuilder.in('status', [EventStatus.PUBLISHED, EventStatus.COMPLETED]);
        }

        if (validatedQuery.category) {
          queryBuilder = queryBuilder.eq('category', validatedQuery.category);
        }

        if (validatedQuery.priority) {
          queryBuilder = queryBuilder.eq('priority', validatedQuery.priority);
        }

        if (validatedQuery.venue) {
          queryBuilder = queryBuilder.ilike('venue', `%${validatedQuery.venue}%`);
        }

        if (validatedQuery.organizerId) {
          queryBuilder = queryBuilder.eq('organizerId', validatedQuery.organizerId);
        }

        if (validatedQuery.isVirtual !== undefined) {
          queryBuilder = queryBuilder.eq('isVirtual', validatedQuery.isVirtual);
        }

        if (!validatedQuery.showPrivate) {
          queryBuilder = queryBuilder.eq('isPrivate', false);
        }

        // Date filtering
        const now = new Date().toISOString();
        if (!validatedQuery.showPast) {
          queryBuilder = queryBuilder.gte('endDate', now);
        }

        if (validatedQuery.startDate) {
          queryBuilder = queryBuilder.gte('startDate', validatedQuery.startDate);
        }

        if (validatedQuery.endDate) {
          queryBuilder = queryBuilder.lte('startDate', validatedQuery.endDate);
        }

        // Price filtering
        if (validatedQuery.minPrice !== undefined) {
          queryBuilder = queryBuilder.gte('price', validatedQuery.minPrice);
        }
        if (validatedQuery.maxPrice !== undefined) {
          queryBuilder = queryBuilder.lte('price', validatedQuery.maxPrice);
        }

        // Search functionality
        if (validatedQuery.search?.trim()) {
          const searchTerm = validatedQuery.search.trim();
          queryBuilder = queryBuilder.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,venue.ilike.%${searchTerm}%`
          );
        }

        // Tag filtering
        if (validatedQuery.tags && validatedQuery.tags.length > 0) {
          queryBuilder = queryBuilder.overlaps('tags', validatedQuery.tags);
        }

        // Sorting
        const sortColumn = validatedQuery.sortBy || 'startDate';
        const sortOrder = validatedQuery.sortOrder || 'asc';
        queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' });

        // Pagination
        queryBuilder = queryBuilder
          .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1);

        const { data: events, error, count } = await queryBuilder;

        if (error) throw error;

        // Transform events with computed fields
        const transformedEvents = (events || []).map(this.transformEvent);

        // Get stats
        const statsPromise = this.getEventsStats();
        const stats = await statsPromise.catch(() => undefined);

        return {
          events: transformedEvents,
          total: count || 0,
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: (count || 0) > validatedQuery.offset + validatedQuery.limit,
          stats,
        };
      },
      {
        clientType: 'service',
        fallback: () => this.getFallbackEventsResponse(validatedQuery),
      }
    );
  }

  /**
   * Get a single event by ID
   */
  async getEventById(id: string): Promise<EventResponse> {
    if (!id?.trim()) {
      throw new Error('Event ID is required');
    }

    return executeWithRetry(
      async (client) => {
        const { data: event, error } = await client
          .from('Event')
          .select(`
            *,
            Organizer:User!EventOrganizer(id, name, email),
            Registration(*),
            Waitlist(*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Event not found');
          }
          throw error;
        }

        const transformedEvent = this.transformEvent(event);
        
        // Get event stats
        const statsPromise = this.getEventStats(id);
        const stats = await statsPromise.catch(() => undefined);

        // Get related events
        const relatedEventsPromise = this.getRelatedEvents(id, transformedEvent.category);
        const relatedEvents = await relatedEventsPromise.catch(() => []);

        return {
          event: transformedEvent,
          stats,
          relatedEvents: relatedEvents.slice(0, 3), // Limit to 3 related events
        };
      },
      {
        clientType: 'service',
        fallback: () => this.getFallbackEventResponse(id),
      }
    );
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: EventCreateInput): Promise<Event> {
    const validatedData = eventCreateSchema.parse(eventData);

    return executeWithRetry(
      async (client) => {
        const eventId = crypto.randomUUID();
        
        const { data: event, error } = await client
          .from('Event')
          .insert({
            id: eventId,
            ...validatedData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select(`
            *,
            Organizer:User!EventOrganizer(id, name, email)
          `)
          .single();

        if (error) throw error;

        return this.transformEvent(event);
      },
      {
        clientType: 'service',
      }
    );
  }

  /**
   * Update an existing event
   */
  async updateEvent(id: string, updates: Partial<EventUpdateInput>): Promise<Event> {
    if (!id?.trim()) {
      throw new Error('Event ID is required');
    }

    const validatedUpdates = eventUpdateSchema.partial().parse(updates);

    return executeWithRetry(
      async (client) => {
        const { data: event, error } = await client
          .from('Event')
          .update({
            ...validatedUpdates,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', id)
          .select(`
            *,
            Organizer:User!EventOrganizer(id, name, email)
          `)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Event not found');
          }
          throw error;
        }

        return this.transformEvent(event);
      },
      {
        clientType: 'service',
      }
    );
  }

  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<void> {
    if (!id?.trim()) {
      throw new Error('Event ID is required');
    }

    return executeWithRetry(
      async (client) => {
        const { error } = await client
          .from('Event')
          .delete()
          .eq('id', id);

        if (error) throw error;
      },
      {
        clientType: 'service',
      }
    );
  }

  /**
   * Get event statistics
   */
  async getEventStats(eventId: string): Promise<EventStats> {
    return executeWithRetry(
      async (client) => {
        // Get registration counts
        const { data: registrationStats, error: regError } = await client
          .from('Registration')
          .select('status, amount')
          .eq('eventId', eventId);

        if (regError) throw regError;

        // Get waitlist count
        const { count: waitlistCount, error: waitlistError } = await client
          .from('Waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('eventId', eventId);

        if (waitlistError) throw waitlistError;

        const stats = registrationStats || [];
        const totalRegistrations = stats.length;
        const confirmedRegistrations = stats.filter(r => r.status === 'CONFIRMED').length;
        const pendingRegistrations = stats.filter(r => r.status === 'PENDING').length;
        const cancelledRegistrations = stats.filter(r => r.status === 'CANCELLED').length;
        const revenue = stats.reduce((sum, r) => sum + (r.amount || 0), 0);

        return {
          eventId,
          totalRegistrations,
          confirmedRegistrations,
          pendingRegistrations,
          cancelledRegistrations,
          waitlistCount: waitlistCount || 0,
          revenue,
        };
      },
      {
        clientType: 'service',
        fallback: () => ({
          eventId,
          totalRegistrations: 0,
          confirmedRegistrations: 0,
          pendingRegistrations: 0,
          cancelledRegistrations: 0,
          waitlistCount: 0,
          revenue: 0,
        }),
      }
    );
  }

  /**
   * Get overall events statistics
   */
  private async getEventsStats() {
    return executeWithRetry(
      async (client) => {
        const { count: totalEvents, error: totalError } = await client
          .from('Event')
          .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        const { count: publishedEvents, error: publishedError } = await client
          .from('Event')
          .select('*', { count: 'exact', head: true })
          .eq('status', EventStatus.PUBLISHED);

        if (publishedError) throw publishedError;

        const now = new Date().toISOString();
        const { count: upcomingEvents, error: upcomingError } = await client
          .from('Event')
          .select('*', { count: 'exact', head: true })
          .gte('startDate', now);

        if (upcomingError) throw upcomingError;

        const { count: pastEvents, error: pastError } = await client
          .from('Event')
          .select('*', { count: 'exact', head: true })
          .lt('endDate', now);

        if (pastError) throw pastError;

        return {
          totalEvents: totalEvents || 0,
          publishedEvents: publishedEvents || 0,
          upcomingEvents: upcomingEvents || 0,
          pastEvents: pastEvents || 0,
        };
      },
      {
        clientType: 'service',
        fallback: () => ({
          totalEvents: 0,
          publishedEvents: 0,
          upcomingEvents: 0,
          pastEvents: 0,
        }),
      }
    );
  }

  /**
   * Get related events by category
   */
  private async getRelatedEvents(excludeId: string, category: string): Promise<Event[]> {
    return executeWithRetry(
      async (client) => {
        const { data: events, error } = await client
          .from('Event')
          .select(`
            *,
            Organizer:User!EventOrganizer(id, name, email)
          `)
          .eq('category', category)
          .eq('status', EventStatus.PUBLISHED)
          .neq('id', excludeId)
          .gte('endDate', new Date().toISOString())
          .order('startDate', { ascending: true })
          .limit(5);

        if (error) throw error;

        return (events || []).map(this.transformEvent);
      },
      {
        clientType: 'service',
        fallback: () => [],
      }
    );
  }

  /**
   * Transform raw database event to typed Event with computed fields
   */
  private transformEvent(rawEvent: any): Event {
    const now = new Date();
    const startDate = new Date(rawEvent.startDate);
    const endDate = new Date(rawEvent.endDate);
    const earlyBirdDeadline = rawEvent.earlyBirdDeadline ? new Date(rawEvent.earlyBirdDeadline) : null;

    const registrationCount = rawEvent._count?.Registration || rawEvent.Registration?.length || 0;
    const availableSpots = Math.max(0, rawEvent.capacity - registrationCount);
    const isEarlyBird = earlyBirdDeadline ? now < earlyBirdDeadline : false;
    const isRegistrationOpen = now < startDate && 
      (!rawEvent.registrationDeadline || now < new Date(rawEvent.registrationDeadline));
    const isSoldOut = availableSpots === 0;
    const isPastEvent = endDate < now;
    const daysUntilEvent = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...rawEvent,
      price: Number(rawEvent.price),
      earlyBirdPrice: rawEvent.earlyBirdPrice ? Number(rawEvent.earlyBirdPrice) : undefined,
      capacity: Number(rawEvent.capacity),
      registrationCount,
      availableSpots,
      isEarlyBird,
      isRegistrationOpen,
      isSoldOut,
      isPastEvent,
      daysUntilEvent,
      organizer: rawEvent.Organizer ? {
        id: rawEvent.Organizer.id,
        name: rawEvent.Organizer.name,
        email: rawEvent.Organizer.email,
        avatar: rawEvent.Organizer.avatar,
      } : undefined,
      registrations: rawEvent.Registration || undefined,
      waitlist: rawEvent.Waitlist || undefined,
    };
  }

  /**
   * Fallback response when database is unavailable
   */
  private getFallbackEventsResponse(query: EventQueryInput): EventsResponse {
    const events = query.search && !FALLBACK_EVENT.title.toLowerCase().includes(query.search.toLowerCase()) 
      ? [] 
      : [FALLBACK_EVENT];

    return {
      events,
      total: events.length,
      limit: query.limit || 20,
      offset: query.offset || 0,
      hasMore: false,
      stats: {
        totalEvents: events.length,
        publishedEvents: events.length,
        upcomingEvents: events.length,
        pastEvents: 0,
      },
    };
  }

  /**
   * Fallback response for single event when database is unavailable
   */
  private getFallbackEventResponse(id: string): EventResponse {
    // Return fallback only for known demo IDs
    if (id === 'pg-conference-2025' || id === 'e1f202a0-d1a5-4a77-9e25-616a2e97e8e0' || id.includes('fallback')) {
      return {
        event: { ...FALLBACK_EVENT, id },
        stats: {
          eventId: id,
          totalRegistrations: 0,
          confirmedRegistrations: 0,
          pendingRegistrations: 0,
          cancelledRegistrations: 0,
          waitlistCount: 0,
          revenue: 0,
        },
        relatedEvents: [],
      };
    }
    
    throw new Error('Event not found');
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{ healthy: boolean; connectionStatus: boolean; latency?: number }> {
    const startTime = Date.now();
    
    try {
      const connectionStatus = await checkConnectionHealth('service');
      const latency = Date.now() - startTime;
      
      return {
        healthy: connectionStatus,
        connectionStatus,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        connectionStatus: false,
        latency: Date.now() - startTime,
      };
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance();
export default eventService;