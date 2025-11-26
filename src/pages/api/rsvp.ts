import type { APIRoute } from 'astro';
import { insertAttendee, getAttendeeByEmail, getSetting } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if RSVPs are open
    const rsvpOpen = getSetting('rsvp_open');
    if (rsvpOpen !== 'true') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RSVPs are currently closed',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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
    } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trim and sanitize inputs
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // Check for duplicate email
    const existingAttendee = getAttendeeByEmail(trimmedEmail);
    if (existingAttendee) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'An RSVP with this email already exists. If you need to make changes, please contact us.',
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional fields if provided
    if (dietary_restrictions && dietary_restrictions.length > 500) {
      errors.dietary_restrictions =
        'Dietary restrictions must be less than 500 characters';
    }

    if (excited_about && excited_about.length > 500) {
      errors.excited_about = 'Response must be less than 500 characters';
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert attendee into database
    const attendeeId = insertAttendee({
      name: trimmedName,
      email: trimmedEmail,
      dietary_restrictions: dietary_restrictions?.trim() || undefined,
      plus_one: plus_one ? 1 : 0,
      arrival_time: arrival_time?.trim() || undefined,
      departure_time: departure_time?.trim() || undefined,
      excited_about: excited_about?.trim() || undefined,
      payment_status: 'pending',
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'RSVP submitted successfully',
        attendeeId: attendeeId,
        email: trimmedEmail,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing RSVP:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error. Please try again later.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
