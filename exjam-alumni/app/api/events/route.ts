/**
 * Optimized Events API Routes
 * Uses new EventService with robust Supabase connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/lib/services/event-service';
import {
  EventQueryInput,
  EventCreateInput,
  eventQuerySchema,
  eventCreateSchema,
  EventStatus,
} from '@/types/events';
import { z } from 'zod';

/**
 * GET /api/events - Retrieve events with advanced filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Build query parameters with proper type handling and validation
    const rawQuery = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') === 'ALL' ? undefined : searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      venue: searchParams.get('venue') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      isVirtual: searchParams.get('isVirtual') === 'true' ? true : searchParams.get('isVirtual') === 'false' ? false : undefined,
      showPast: searchParams.get('showPast') === 'true',
      showPrivate: searchParams.get('showPrivate') === 'true',
      organizerId: searchParams.get('organizerId') || undefined,
      limit: Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100),
      offset: Math.max(Number(searchParams.get('offset')) || 0, 0),
      sortBy: searchParams.get('sortBy') || 'startDate',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    };

    // Remove undefined values to let defaults work
    const query = Object.fromEntries(
      Object.entries(rawQuery).filter(([_, value]) => value !== undefined)
    ) as EventQueryInput;

    // Use EventService for robust data retrieval
    const result = await eventService.getEvents(query);
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Events API GET error:', error);
    
    // Return structured error response
    return NextResponse.json(
      {
        error: 'Failed to retrieve events',
        message: error instanceof Error ? error.message : 'Unknown error',
        events: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events - Create a new event
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const validatedData = eventCreateSchema.parse(body);
    
    // Use EventService for robust event creation
    const event = await eventService.createEvent(validatedData);
    
    return NextResponse.json(
      {
        success: true,
        data: event,
        message: 'Event created successfully',
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Events API POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid event data provided',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
