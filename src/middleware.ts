import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;

  // Check if this is an admin API route (excluding auth and logout endpoints)
  const isAdminApiRoute = url.pathname.startsWith('/api/admin');
  const isAuthEndpoint = url.pathname === '/api/admin/auth';
  const isLogoutEndpoint = url.pathname === '/api/admin/logout';

  if (isAdminApiRoute && !isAuthEndpoint && !isLogoutEndpoint) {
    // Get session cookie
    const sessionCookie = cookies.get('session')?.value;
    const sessionSecret = import.meta.env.SESSION_SECRET || '';

    // Verify session token
    if (!sessionCookie || !verifySessionToken(sessionCookie, sessionSecret)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Please login to access this resource.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Continue to the next middleware or route handler
  return next();
});
