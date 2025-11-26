import type { APIRoute } from 'astro';
import { getAnnouncementById, deleteAnnouncement } from '../../../../lib/db';

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
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

    deleteAnnouncement(id);

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
    console.error('Error deleting announcement:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to delete announcement',
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
