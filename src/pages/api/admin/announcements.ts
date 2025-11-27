import type { APIRoute } from 'astro';
import { insertAnnouncement } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB;
    const body = await request.json();
    const { message } = body;

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Announcement message is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Announcement message must be 500 characters or less',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const id = await insertAnnouncement(db, message.trim());

    return new Response(
      JSON.stringify({
        success: true,
        id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create announcement',
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
