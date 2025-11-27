import type { D1Database } from '@cloudflare/workers-types';

// Type definitions for database records
export interface Attendee {
  id?: number;
  name: string;
  email: string;
  dietary_restrictions?: string;
  plus_one?: number;
  arrival_time?: string;
  departure_time?: string;
  excited_about?: string;
  payment_status?: string;
  created_at?: string;
}

export interface Activity {
  id?: number;
  title: string;
  description?: string;
  host_name: string;
  host_email?: string;
  duration?: number;
  equipment_needed?: string;
  capacity?: number;
  time_preference?: string;
  activity_type?: string;
  status?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  location?: string;
  created_at?: string;
}

export interface Photo {
  id?: number;
  filename: string;
  url: string;
  caption?: string;
  uploaded_by?: string;
  uploaded_at?: string;
}

export interface Announcement {
  id?: number;
  message: string;
  active?: number;
  created_at?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface LoginAttempt {
  ip_address: string;
  attempts: number;
  last_attempt: string;
  locked_until?: string;
}

// Attendee operations
export async function insertAttendee(
  db: D1Database,
  attendee: Attendee
): Promise<number> {
  const result = await db
    .prepare(
      `
    INSERT INTO attendees (name, email, dietary_restrictions, plus_one, arrival_time, departure_time, excited_about, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      attendee.name,
      attendee.email,
      attendee.dietary_restrictions || null,
      attendee.plus_one || 0,
      attendee.arrival_time || null,
      attendee.departure_time || null,
      attendee.excited_about || null,
      attendee.payment_status || 'pending'
    )
    .run();

  return result.meta.last_row_id;
}

export async function getAttendeeByEmail(
  db: D1Database,
  email: string
): Promise<Attendee | null> {
  const result = await db
    .prepare('SELECT * FROM attendees WHERE email = ?')
    .bind(email)
    .first<Attendee>();

  return result;
}

export async function getAttendeeById(
  db: D1Database,
  id: number
): Promise<Attendee | null> {
  const result = await db
    .prepare('SELECT * FROM attendees WHERE id = ?')
    .bind(id)
    .first<Attendee>();

  return result;
}

export async function getAllAttendees(db: D1Database): Promise<Attendee[]> {
  const { results } = await db
    .prepare('SELECT * FROM attendees ORDER BY created_at DESC')
    .all<Attendee>();

  return results;
}

export async function updateAttendee(
  db: D1Database,
  id: number,
  updates: Partial<Attendee>
): Promise<void> {
  const fields = Object.keys(updates)
    .filter((key) => key !== 'id' && key !== 'created_at')
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = Object.keys(updates)
    .filter((key) => key !== 'id' && key !== 'created_at')
    .map((key) => updates[key as keyof Attendee]);

  await db
    .prepare(`UPDATE attendees SET ${fields} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteAttendee(
  db: D1Database,
  id: number
): Promise<void> {
  await db.prepare('DELETE FROM attendees WHERE id = ?').bind(id).run();
}

// Activity operations
export async function insertActivity(
  db: D1Database,
  activity: Activity
): Promise<number> {
  const result = await db
    .prepare(
      `
    INSERT INTO activities (title, description, host_name, host_email, duration, equipment_needed, capacity, time_preference, activity_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      activity.title,
      activity.description || null,
      activity.host_name,
      activity.host_email || null,
      activity.duration || null,
      activity.equipment_needed || null,
      activity.capacity || null,
      activity.time_preference || null,
      activity.activity_type || null,
      activity.status || 'pending'
    )
    .run();

  return result.meta.last_row_id;
}

export async function getAllActivities(
  db: D1Database,
  status?: string
): Promise<Activity[]> {
  if (status) {
    const { results } = await db
      .prepare('SELECT * FROM activities WHERE status = ? ORDER BY created_at DESC')
      .bind(status)
      .all<Activity>();
    return results;
  }

  const { results } = await db
    .prepare('SELECT * FROM activities ORDER BY created_at DESC')
    .all<Activity>();

  return results;
}

export async function getActivityById(
  db: D1Database,
  id: number
): Promise<Activity | null> {
  const result = await db
    .prepare('SELECT * FROM activities WHERE id = ?')
    .bind(id)
    .first<Activity>();

  return result;
}

export async function updateActivity(
  db: D1Database,
  id: number,
  updates: Partial<Activity>
): Promise<void> {
  const fields = Object.keys(updates)
    .filter((key) => key !== 'id' && key !== 'created_at')
    .map((key) => `${key} = ?`)
    .join(', ');

  const values = Object.keys(updates)
    .filter((key) => key !== 'id' && key !== 'created_at')
    .map((key) => updates[key as keyof Activity]);

  await db
    .prepare(`UPDATE activities SET ${fields} WHERE id = ?`)
    .bind(...values, id)
    .run();
}

export async function deleteActivity(
  db: D1Database,
  id: number
): Promise<void> {
  await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
}

// Settings operations
export async function getSetting(
  db: D1Database,
  key: string
): Promise<string | null> {
  const result = await db
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();

  return result?.value ?? null;
}

export async function setSetting(
  db: D1Database,
  key: string,
  value: string
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .bind(key, value)
    .run();
}

export async function getAllSettings(db: D1Database): Promise<Setting[]> {
  const { results } = await db.prepare('SELECT * FROM settings').all<Setting>();
  return results;
}

// Announcement operations
export async function getActiveAnnouncements(
  db: D1Database
): Promise<Announcement[]> {
  const { results } = await db
    .prepare('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC')
    .all<Announcement>();

  return results;
}

export async function insertAnnouncement(
  db: D1Database,
  message: string
): Promise<number> {
  const result = await db
    .prepare('INSERT INTO announcements (message) VALUES (?)')
    .bind(message)
    .run();

  return result.meta.last_row_id;
}

export async function getAllAnnouncements(
  db: D1Database
): Promise<Announcement[]> {
  const { results } = await db
    .prepare('SELECT * FROM announcements ORDER BY created_at DESC')
    .all<Announcement>();

  return results;
}

export async function getAnnouncementById(
  db: D1Database,
  id: number
): Promise<Announcement | null> {
  const result = await db
    .prepare('SELECT * FROM announcements WHERE id = ?')
    .bind(id)
    .first<Announcement>();

  return result;
}

export async function updateAnnouncement(
  db: D1Database,
  id: number,
  message: string
): Promise<void> {
  await db
    .prepare('UPDATE announcements SET message = ? WHERE id = ?')
    .bind(message, id)
    .run();
}

export async function toggleAnnouncementActive(
  db: D1Database,
  id: number,
  active: boolean
): Promise<void> {
  await db
    .prepare('UPDATE announcements SET active = ? WHERE id = ?')
    .bind(active ? 1 : 0, id)
    .run();
}

export async function deleteAnnouncement(
  db: D1Database,
  id: number
): Promise<void> {
  await db.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run();
}

// Specialized activity queries
export async function getScheduledActivities(
  db: D1Database
): Promise<Activity[]> {
  const { results } = await db
    .prepare(
      `
    SELECT * FROM activities
    WHERE status = 'scheduled'
    ORDER BY scheduled_start ASC
  `
    )
    .all<Activity>();

  return results;
}

export async function getApprovedAndScheduledActivities(
  db: D1Database
): Promise<Activity[]> {
  const { results } = await db
    .prepare(
      `
    SELECT * FROM activities
    WHERE status IN ('approved', 'scheduled')
    ORDER BY title ASC
  `
    )
    .all<Activity>();

  return results;
}

// Rate limiting operations for admin login
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Check if an IP address is currently locked out due to too many failed login attempts
 */
export async function isIpLocked(
  db: D1Database,
  ipAddress: string
): Promise<boolean> {
  const result = await db
    .prepare(
      `
    SELECT locked_until FROM login_attempts
    WHERE ip_address = ? AND locked_until IS NOT NULL
  `
    )
    .bind(ipAddress)
    .first<{ locked_until: string }>();

  if (!result) {
    return false;
  }

  const lockedUntil = new Date(result.locked_until).getTime();
  const now = Date.now();

  // If still locked, return true
  if (now < lockedUntil) {
    return true;
  }

  // Lock expired, clear it
  await clearLoginAttempts(db, ipAddress);
  return false;
}

/**
 * Record a failed login attempt for an IP address
 * Returns true if the IP should now be locked out
 */
export async function recordFailedLogin(
  db: D1Database,
  ipAddress: string
): Promise<boolean> {
  // Get current attempt record
  const result = await db
    .prepare('SELECT attempts FROM login_attempts WHERE ip_address = ?')
    .bind(ipAddress)
    .first<{ attempts: number }>();

  const currentAttempts = result ? result.attempts : 0;
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Lock the IP
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION).toISOString();
    await db
      .prepare(
        `
      INSERT OR REPLACE INTO login_attempts (ip_address, attempts, last_attempt, locked_until)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `
      )
      .bind(ipAddress, newAttempts, lockedUntil)
      .run();
    return true;
  } else {
    // Increment attempts
    await db
      .prepare(
        `
      INSERT OR REPLACE INTO login_attempts (ip_address, attempts, last_attempt, locked_until)
      VALUES (?, ?, CURRENT_TIMESTAMP, NULL)
    `
      )
      .bind(ipAddress, newAttempts)
      .run();
    return false;
  }
}

/**
 * Clear login attempts for an IP address (called on successful login)
 */
export async function clearLoginAttempts(
  db: D1Database,
  ipAddress: string
): Promise<void> {
  await db
    .prepare('DELETE FROM login_attempts WHERE ip_address = ?')
    .bind(ipAddress)
    .run();
}

/**
 * Get remaining attempts before lockout
 */
export async function getRemainingAttempts(
  db: D1Database,
  ipAddress: string
): Promise<number> {
  const result = await db
    .prepare('SELECT attempts FROM login_attempts WHERE ip_address = ?')
    .bind(ipAddress)
    .first<{ attempts: number }>();

  if (!result) {
    return MAX_LOGIN_ATTEMPTS;
  }

  return Math.max(0, MAX_LOGIN_ATTEMPTS - result.attempts);
}
