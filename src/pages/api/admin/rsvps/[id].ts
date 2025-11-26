import type { APIRoute } from 'astro';
import {
  getAttendeeById,
  updateAttendee,
  deleteAttendee,
} from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid attendee ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const attendee = getAttendeeById(id);

    if (!attendee) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Attendee not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendee,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching attendee:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch attendee',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid attendee ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if attendee exists
    const existingAttendee = getAttendeeById(id);
    if (!existingAttendee) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Attendee not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      email,
      dietary_restrictions,
      plus_one,
      arrival_time,
      departure_time,
      excited_about,
      payment_status,
    } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Name is required';
      } else if (name.trim().length > 255) {
        errors.name = 'Name must be less than 255 characters';
      }
    }

    if (email !== undefined) {
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        errors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          errors.email = 'Please enter a valid email address';
        }
      }
    }

    // Validate optional fields if provided
    if (
      dietary_restrictions !== undefined &&
      dietary_restrictions &&
      dietary_restrictions.length > 500
    ) {
      errors.dietary_restrictions =
        'Dietary restrictions must be less than 500 characters';
    }

    if (
      excited_about !== undefined &&
      excited_about &&
      excited_about.length > 500
    ) {
      errors.excited_about = 'Response must be less than 500 characters';
    }

    if (payment_status !== undefined) {
      const validStatuses = ['pending', 'completed', 'refunded', 'cancelled'];
      if (!validStatuses.includes(payment_status)) {
        errors.payment_status = 'Invalid payment status';
      }
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build updates object (only include provided fields)
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (dietary_restrictions !== undefined)
      updates.dietary_restrictions = dietary_restrictions?.trim() || null;
    if (plus_one !== undefined) updates.plus_one = plus_one ? 1 : 0;
    if (arrival_time !== undefined)
      updates.arrival_time = arrival_time?.trim() || null;
    if (departure_time !== undefined)
      updates.departure_time = departure_time?.trim() || null;
    if (excited_about !== undefined)
      updates.excited_about = excited_about?.trim() || null;
    if (payment_status !== undefined) updates.payment_status = payment_status;

    // Update attendee
    updateAttendee(id, updates);

    // Get updated attendee
    const updatedAttendee = getAttendeeById(id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendee updated successfully',
        attendee: updatedAttendee,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating attendee:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update attendee',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid attendee ID',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if attendee exists
    const existingAttendee = getAttendeeById(id);
    if (!existingAttendee) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Attendee not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete attendee
    deleteAttendee(id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendee deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting attendee:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete attendee',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
