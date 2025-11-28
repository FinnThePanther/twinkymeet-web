import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, locals } = context;

  // Check if this is an admin API route (excluding auth and logout endpoints)
  const isAdminApiRoute = url.pathname.startsWith('/api/admin');
  const isAuthEndpoint = url.pathname === '/api/admin/auth';
  const isLogoutEndpoint = url.pathname === '/api/admin/logout';

  if (isAdminApiRoute && !isAuthEndpoint && !isLogoutEndpoint) {
    // Get session cookie
    const sessionCookie = cookies.get('session')?.value;
    const sessionSecret = process.env.SESSION_SECRET || '';

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

  // Get response from next handler
  const response = await next();

  // Add cache headers for images and static assets
  const pathname = url.pathname;

  // Cache images for 1 year (immutable since they're hashed)
  if (
    pathname.match(/\.(jpg|jpeg|png|webp|avif|svg|gif|ico)$/i) ||
    pathname.includes('/_image/')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache fonts for 1 year
  if (pathname.match(/\.(woff|woff2|ttf|eot)$/i)) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache CSS/JS for 1 day (they may be rebuilt)
  if (pathname.match(/\.(css|js)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=86400');
  }

  // Cache HTML pages for 5 minutes (allows revalidation without breaking)
  if (pathname.match(/\.(html)?$/i) || pathname === '/') {
    response.headers.set('Cache-Control', 'public, max-age=300');
  }

  return response;
});
