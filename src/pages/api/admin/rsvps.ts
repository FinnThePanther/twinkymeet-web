import type { APIRoute } from 'astro';
import { getAllAttendees } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals.runtime.env.DB;
    // Get all attendees ordered by created_at DESC
    const attendees = await getAllAttendees(db);

    return new Response(
      JSON.stringify({
        success: true,
        attendees,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch RSVPs',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
