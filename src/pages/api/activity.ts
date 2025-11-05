import type { APIRoute } from 'astro';
import { insertActivity, getSetting } from '../../lib/db';

const VALID_DURATIONS = [30, 60, 120, 180, 240];
const VALID_ACTIVITY_TYPES = ['Gaming', 'Outdoor', 'Creative', 'Social', '18+', 'Other'];
const VALID_TIME_PREFERENCES = ['Morning', 'Afternoon', 'Evening', 'Late Night', 'No Preference'];

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check if activity submissions are open
    const submissionsOpen = getSetting('activity_submissions_open');
    if (submissionsOpen !== 'true') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Activity submissions are currently closed'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      host_name,
      host_email,
      description,
      duration,
      activity_type,
      equipment_needed,
      capacity,
      time_preference
    } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Activity title is required';
    } else if (title.trim().length > 255) {
      errors.title = 'Title must be less than 255 characters';
    }

    if (!host_name || typeof host_name !== 'string' || host_name.trim().length === 0) {
      errors.host_name = 'Your name is required';
    } else if (host_name.trim().length > 255) {
      errors.host_name = 'Name must be less than 255 characters';
    }

    if (!host_email || typeof host_email !== 'string' || host_email.trim().length === 0) {
      errors.host_email = 'Your email is required';
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(host_email.trim())) {
        errors.host_email = 'Please enter a valid email address';
      }
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.description = 'Description is required';
    } else if (description.trim().length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    if (!duration || typeof duration !== 'number') {
      errors.duration = 'Duration is required';
    } else if (!VALID_DURATIONS.includes(duration)) {
      errors.duration = 'Invalid duration selected';
    }

    if (!activity_type || typeof activity_type !== 'string') {
      errors.activity_type = 'Activity type is required';
    } else if (!VALID_ACTIVITY_TYPES.includes(activity_type)) {
      errors.activity_type = 'Invalid activity type selected';
    }

    if (!time_preference || typeof time_preference !== 'string') {
      errors.time_preference = 'Time preference is required';
    } else if (!VALID_TIME_PREFERENCES.includes(time_preference)) {
      errors.time_preference = 'Invalid time preference selected';
    }

    // Validate optional fields if provided
    if (equipment_needed && equipment_needed.length > 1000) {
      errors.equipment_needed = 'Equipment description must be less than 1000 characters';
    }

    if (capacity !== undefined && capacity !== null) {
      if (typeof capacity !== 'number' || capacity < 1 || capacity > 999) {
        errors.capacity = 'Capacity must be between 1 and 999';
      }
    }

    // Check for validation errors
    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: errors
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trim and sanitize inputs
    const trimmedTitle = title.trim();
    const trimmedHostName = host_name.trim();
    const trimmedHostEmail = host_email.trim().toLowerCase();
    const trimmedDescription = description.trim();

    // Insert activity into database with status = 'pending'
    const activityId = insertActivity({
      title: trimmedTitle,
      host_name: trimmedHostName,
      host_email: trimmedHostEmail,
      description: trimmedDescription,
      duration,
      activity_type,
      equipment_needed: equipment_needed?.trim() || undefined,
      capacity: capacity || undefined,
      time_preference,
      status: 'pending'
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Activity submitted successfully. Thank you!',
        activityId: activityId
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing activity submission:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error. Please try again later.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
