import type { APIRoute } from 'astro';
import {
  getAnnouncementById,
  toggleAnnouncementActive,
} from '../../../../../lib/db';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id || '0', 10);

    if (isNaN(id) || id <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid announcement ID',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const existingAnnouncement = getAnnouncementById(id);

    if (!existingAnnouncement) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Announcement not found',
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
    const { active } = body;

    if (typeof active !== 'boolean') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Active status must be a boolean value',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    toggleAnnouncementActive(id, active);

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error toggling announcement:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to toggle announcement',
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
