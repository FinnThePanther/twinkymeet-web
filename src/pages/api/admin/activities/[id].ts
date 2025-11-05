import type { APIRoute } from 'astro';
import { getActivityById, updateActivity, deleteActivity } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid activity ID'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const activity = getActivityById(id);

    if (!activity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Activity not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        activity
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching activity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch activity'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
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
          error: 'Invalid activity ID'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const existingActivity = getActivityById(id);

    if (!existingActivity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Activity not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      host_name,
      host_email,
      duration,
      activity_type,
      equipment_needed,
      capacity,
      time_preference,
      notes,
      status,
      scheduled_start,
      scheduled_end,
      location
    } = body;

    // Validate fields
    const errors: Record<string, string> = {};

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        errors.title = 'Title is required';
      } else if (title.trim().length > 255) {
        errors.title = 'Title must be 255 characters or less';
      }
    }

    if (description !== undefined) {
      if (description && typeof description === 'string' && description.length > 2000) {
        errors.description = 'Description must be 2000 characters or less';
      }
    }

    if (host_name !== undefined) {
      if (!host_name || typeof host_name !== 'string' || host_name.trim().length === 0) {
        errors.host_name = 'Host name is required';
      } else if (host_name.trim().length > 255) {
        errors.host_name = 'Host name must be 255 characters or less';
      }
    }

    if (host_email !== undefined) {
      if (!host_email || typeof host_email !== 'string' || host_email.trim().length === 0) {
        errors.host_email = 'Host email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(host_email)) {
        errors.host_email = 'Invalid email format';
      } else if (host_email.length > 255) {
        errors.host_email = 'Email must be 255 characters or less';
      }
    }

    if (duration !== undefined) {
      if (duration === null || duration === undefined || typeof duration !== 'number' || duration <= 0) {
        errors.duration = 'Duration must be a positive number';
      }
    }

    if (activity_type !== undefined) {
      if (activity_type && typeof activity_type === 'string' && activity_type.length > 100) {
        errors.activity_type = 'Activity type must be 100 characters or less';
      }
    }

    if (equipment_needed !== undefined) {
      if (equipment_needed && typeof equipment_needed === 'string' && equipment_needed.length > 500) {
        errors.equipment_needed = 'Equipment needed must be 500 characters or less';
      }
    }

    if (capacity !== undefined) {
      if (capacity !== null && (typeof capacity !== 'number' || capacity < 0)) {
        errors.capacity = 'Capacity must be a non-negative number';
      }
    }

    if (time_preference !== undefined) {
      if (time_preference && typeof time_preference === 'string' && time_preference.length > 500) {
        errors.time_preference = 'Time preference must be 500 characters or less';
      }
    }

    if (notes !== undefined) {
      if (notes && typeof notes === 'string' && notes.length > 1000) {
        errors.notes = 'Notes must be 1000 characters or less';
      }
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'approved', 'scheduled', 'cancelled'];
      if (!validStatuses.includes(status)) {
        errors.status = 'Invalid status value';
      }
    }

    if (scheduled_start !== undefined && scheduled_start !== null) {
      const startDate = new Date(scheduled_start);
      if (isNaN(startDate.getTime())) {
        errors.scheduled_start = 'Invalid scheduled start time';
      }
    }

    if (scheduled_end !== undefined && scheduled_end !== null) {
      const endDate = new Date(scheduled_end);
      if (isNaN(endDate.getTime())) {
        errors.scheduled_end = 'Invalid scheduled end time';
      }

      // Validate end is after start if both are provided
      if (scheduled_start && !errors.scheduled_start) {
        const startDate = new Date(scheduled_start);
        if (endDate <= startDate) {
          errors.scheduled_end = 'End time must be after start time';
        }
      }
    }

    if (location !== undefined) {
      if (location && typeof location === 'string' && location.length > 255) {
        errors.location = 'Location must be 255 characters or less';
      }
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          details: errors
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Build updates object
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (host_name !== undefined) updates.host_name = host_name.trim();
    if (host_email !== undefined) updates.host_email = host_email.trim();
    if (duration !== undefined) updates.duration = duration;
    if (activity_type !== undefined) updates.activity_type = activity_type ? activity_type.trim() : null;
    if (equipment_needed !== undefined) updates.equipment_needed = equipment_needed ? equipment_needed.trim() : null;
    if (capacity !== undefined) updates.capacity = capacity;
    if (time_preference !== undefined) updates.time_preference = time_preference ? time_preference.trim() : null;
    if (notes !== undefined) updates.notes = notes ? notes.trim() : null;
    if (status !== undefined) updates.status = status;
    if (scheduled_start !== undefined) updates.scheduled_start = scheduled_start;
    if (scheduled_end !== undefined) updates.scheduled_end = scheduled_end;
    if (location !== undefined) updates.location = location ? location.trim() : null;

    updateActivity(id, updates);

    const updatedActivity = getActivityById(id);

    return new Response(
      JSON.stringify({
        success: true,
        activity: updatedActivity
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error updating activity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update activity'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
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
          error: 'Invalid activity ID'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const existingActivity = getActivityById(id);

    if (!existingActivity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Activity not found'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    deleteActivity(id);

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error deleting activity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete activity'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
