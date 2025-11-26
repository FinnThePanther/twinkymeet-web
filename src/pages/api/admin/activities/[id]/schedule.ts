import type { APIRoute } from 'astro';
import { getActivityById, updateActivity } from '../../../../../lib/db';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid activity ID',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const existingActivity = getActivityById(id);

    if (!existingActivity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Activity not found',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await request.json();
    const { scheduled_start, scheduled_end, location } = body;

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!scheduled_start) {
      errors.scheduled_start = 'Scheduled start time is required';
    } else {
      const startDate = new Date(scheduled_start);
      if (isNaN(startDate.getTime())) {
        errors.scheduled_start = 'Invalid scheduled start time';
      }
    }

    if (!scheduled_end) {
      errors.scheduled_end = 'Scheduled end time is required';
    } else {
      const endDate = new Date(scheduled_end);
      if (isNaN(endDate.getTime())) {
        errors.scheduled_end = 'Invalid scheduled end time';
      }

      // Validate end is after start
      if (scheduled_start && !errors.scheduled_start) {
        const startDate = new Date(scheduled_start);
        if (endDate <= startDate) {
          errors.scheduled_end = 'End time must be after start time';
        }
      }
    }

    if (
      !location ||
      typeof location !== 'string' ||
      location.trim().length === 0
    ) {
      errors.location = 'Location is required';
    } else if (location.length > 255) {
      errors.location = 'Location must be 255 characters or less';
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
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Update activity with schedule information and set status to 'scheduled'
    updateActivity(id, {
      scheduled_start,
      scheduled_end,
      location: location.trim(),
      status: 'scheduled',
    });

    const updatedActivity = getActivityById(id);

    return new Response(
      JSON.stringify({
        success: true,
        activity: updatedActivity,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error scheduling activity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to schedule activity',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
