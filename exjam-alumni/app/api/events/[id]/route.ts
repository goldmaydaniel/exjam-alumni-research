/**
 * Optimized Event by ID API Routes
 * Uses new EventService with robust Supabase connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/lib/services/event-service';
import {
  EventUpdateInput,
  eventUpdateSchema,
} from '@/types/events';
import { z } from 'zod';

/**
 * GET /api/events/[id] - Retrieve a single event by ID
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id?.trim()) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Use EventService for robust event retrieval
    const result = await eventService.getEventById(id);
    
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Event by ID API GET error:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id] - Update an existing event
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    if (!id?.trim()) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Validate the request body (partial update)
    const validatedData = eventUpdateSchema.partial().parse(body);
    
    // Use EventService for robust event update
    const event = await eventService.updateEvent(id, validatedData);
    
    return NextResponse.json(
      {
        success: true,
        data: event,
        message: 'Event updated successfully',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Event by ID API PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Invalid update data provided',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to update event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id] - Delete an event
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id?.trim()) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Use EventService for robust event deletion
    await eventService.deleteEvent(id);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Event deleted successfully',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Event by ID API DELETE error:', error);
    
    if (error instanceof Error && error.message === 'Event not found') {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Failed to delete event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
