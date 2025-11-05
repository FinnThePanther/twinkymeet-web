import type { APIRoute } from 'astro';
import { createExpiredSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    // Create expired session cookie to clear it
    const cookieHeader = createExpiredSessionCookie();

    // Return success with cleared cookie
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
  } catch (error) {
    console.error('Error during logout:', error);
    // Even on error, try to clear the cookie
    const cookieHeader = createExpiredSessionCookie();

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred during logout'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
      }
    );
  }
};
