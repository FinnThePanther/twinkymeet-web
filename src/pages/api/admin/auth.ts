import type { APIRoute } from 'astro';
import {
  verifyPassword,
  generateSessionToken,
  createSessionCookie,
} from '../../../lib/auth';
import {
  isIpLocked,
  recordFailedLogin,
  clearLoginAttempts,
  getRemainingAttempts,
} from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  try {
    const db = locals.runtime.env.DB;

    // Get client IP address (use clientAddress or fallback to header)
    const ipAddress =
      clientAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    // Check if IP is currently locked out
    if (await isIpLocked(db, ipAddress)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Too many failed login attempts. Please try again in 15 minutes.',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password } = body;

    // Validate password field
    if (
      !password ||
      typeof password !== 'string' ||
      password.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get admin password hash from environment
    const adminPasswordHash = locals.runtime.env.ADMIN_PASSWORD_HASH;

    if (!adminPasswordHash) {
      console.error('ADMIN_PASSWORD_HASH environment variable is not set');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Server configuration error. Please contact the administrator.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, adminPasswordHash);

    if (!isValid) {
      // Record failed login attempt
      const isLocked = await recordFailedLogin(db, ipAddress);
      const remainingAttempts = await getRemainingAttempts(db, ipAddress);

      const errorMessage = isLocked
        ? 'Too many failed login attempts. You have been locked out for 15 minutes.'
        : `Invalid password. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`;

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Password is valid - clear any failed attempts
    await clearLoginAttempts(db, ipAddress);

    // Get session secret
    const sessionSecret = locals.runtime.env.SESSION_SECRET;
    if (!sessionSecret) {
      console.error('SESSION_SECRET environment variable is not set');
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Server configuration error. Please contact the administrator.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken(sessionSecret);

    // Create session cookie
    const cookieHeader = createSessionCookie(sessionToken);

    // Return success with session cookie
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Login successful',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader,
        },
      }
    );
  } catch (error) {
    console.error('Error processing login:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
