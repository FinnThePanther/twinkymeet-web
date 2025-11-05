import bcrypt from 'bcrypt';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a secure session token with expiration timestamp
 * Format: {randomBytes}.{expiresAt}.{signature}
 */
export function generateSessionToken(sessionSecret: string): string {
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is required');
  }

  const randomData = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION;

  // Create HMAC signature to prevent tampering
  const payload = `${randomData}.${expiresAt}`;
  const signature = createHmac('sha256', sessionSecret)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verify a session token and check if it's expired
 */
export function verifySessionToken(token: string, sessionSecret: string): boolean {
  try {
    if (!sessionSecret) {
      console.error('SESSION_SECRET is required');
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [randomData, expiresAtStr, providedSignature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    // Check if token is expired
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }

    // Verify signature to prevent tampering
    const payload = `${randomData}.${expiresAt}`;
    const expectedSignature = createHmac('sha256', sessionSecret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error verifying session token:', error);
    return false;
  }
}

/**
 * Create a session cookie string with security flags
 */
export function createSessionCookie(token: string): string {
  const maxAge = SESSION_DURATION / 1000; // Convert to seconds
  const isProduction = process.env.NODE_ENV === 'production';

  // Build cookie string with security flags
  const cookieParts = [
    `session=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];

  // Only set Secure flag in production (requires HTTPS)
  if (isProduction) {
    cookieParts.push('Secure');
  }

  return cookieParts.join('; ');
}

/**
 * Create an expired session cookie for logout
 */
export function createExpiredSessionCookie(): string {
  return 'session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax';
}

/**
 * Parse session token from cookie header
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map(c => c.trim());

  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'session' && value) {
      return value;
    }
  }

  return null;
}
