import type { APIRoute } from 'astro';
import { getAllSettings, setSetting } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = getAllSettings();

    // Convert array of settings to object for easier access
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return new Response(
      JSON.stringify({
        success: true,
        settings: settingsObj
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch settings'
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      event_date_start,
      event_date_end,
      location,
      rsvp_open,
      activity_submissions_open
    } = body;

    const errors: Record<string, string> = {};

    // Validate event dates
    if (event_date_start !== undefined) {
      if (!event_date_start || typeof event_date_start !== 'string') {
        errors.event_date_start = 'Event start date is required';
      } else {
        const startDate = new Date(event_date_start);
        if (isNaN(startDate.getTime())) {
          errors.event_date_start = 'Invalid event start date';
        }
      }
    }

    if (event_date_end !== undefined) {
      if (!event_date_end || typeof event_date_end !== 'string') {
        errors.event_date_end = 'Event end date is required';
      } else {
        const endDate = new Date(event_date_end);
        if (isNaN(endDate.getTime())) {
          errors.event_date_end = 'Invalid event end date';
        }

        // Validate end is after start
        if (event_date_start && !errors.event_date_start && !errors.event_date_end) {
          const startDate = new Date(event_date_start);
          if (endDate < startDate) {
            errors.event_date_end = 'Event end date must be after start date';
          }
        }
      }
    }

    // Validate location
    if (location !== undefined) {
      if (!location || typeof location !== 'string' || location.trim().length === 0) {
        errors.location = 'Location is required';
      } else if (location.length > 255) {
        errors.location = 'Location must be 255 characters or less';
      }
    }

    // Validate boolean toggles
    if (rsvp_open !== undefined) {
      if (typeof rsvp_open !== 'boolean' && rsvp_open !== 'true' && rsvp_open !== 'false') {
        errors.rsvp_open = 'RSVP open must be a boolean value';
      }
    }

    if (activity_submissions_open !== undefined) {
      if (typeof activity_submissions_open !== 'boolean' && activity_submissions_open !== 'true' && activity_submissions_open !== 'false') {
        errors.activity_submissions_open = 'Activity submissions open must be a boolean value';
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

    // Update settings
    if (event_date_start !== undefined) {
      setSetting('event_date_start', event_date_start);
    }

    if (event_date_end !== undefined) {
      setSetting('event_date_end', event_date_end);
    }

    if (location !== undefined) {
      setSetting('location', location.trim());
    }

    if (rsvp_open !== undefined) {
      const value = typeof rsvp_open === 'boolean' ? rsvp_open.toString() : rsvp_open;
      setSetting('rsvp_open', value);
    }

    if (activity_submissions_open !== undefined) {
      const value = typeof activity_submissions_open === 'boolean'
        ? activity_submissions_open.toString()
        : activity_submissions_open;
      setSetting('activity_submissions_open', value);
    }

    // Fetch updated settings
    const settings = getAllSettings();
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return new Response(
      JSON.stringify({
        success: true,
        settings: settingsObj
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to update settings'
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
