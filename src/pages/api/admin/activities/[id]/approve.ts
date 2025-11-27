import type { APIRoute } from 'astro';
import { getActivityById, updateActivity } from '../../../../../lib/db';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB;
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

    const existingActivity = await getActivityById(db, id);

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

    // Update status to 'approved'
    await updateActivity(db, id, { status: 'approved' });

    const updatedActivity = await getActivityById(db, id);

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
    console.error('Error approving activity:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to approve activity',
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
