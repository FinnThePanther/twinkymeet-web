import type { APIRoute } from 'astro';
import { getAllActivities } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    // Optional status filter via query param
    const status = url.searchParams.get('status');

    const activities = status
      ? await getAllActivities(
          db,
          status as 'pending' | 'approved' | 'scheduled' | 'cancelled'
        )
      : await getAllActivities(db);

    return new Response(
      JSON.stringify({
        success: true,
        activities,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching activities:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch activities',
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
