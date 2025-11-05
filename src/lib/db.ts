import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

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

// Get database path from environment or use default
const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'db', 'local.db');

// Initialize database connection
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeDatabase();
  }
  return db;
}

// Initialize database with schema
function initializeDatabase() {
  const schemaPath = join(process.cwd(), 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  getDb().exec(schema);
}

// Helper function to close database connection (useful for cleanup)
export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Attendee operations
export function insertAttendee(attendee: Attendee): number {
  const stmt = getDb().prepare(`
    INSERT INTO attendees (name, email, dietary_restrictions, plus_one, arrival_time, departure_time, excited_about, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    attendee.name,
    attendee.email,
    attendee.dietary_restrictions || null,
    attendee.plus_one || 0,
    attendee.arrival_time || null,
    attendee.departure_time || null,
    attendee.excited_about || null,
    attendee.payment_status || 'pending'
  );

  return result.lastInsertRowid as number;
}

export function getAttendeeByEmail(email: string): Attendee | undefined {
  const stmt = getDb().prepare('SELECT * FROM attendees WHERE email = ?');
  return stmt.get(email) as Attendee | undefined;
}

export function getAllAttendees(): Attendee[] {
  const stmt = getDb().prepare('SELECT * FROM attendees ORDER BY created_at DESC');
  return stmt.all() as Attendee[];
}

export function updateAttendee(id: number, updates: Partial<Attendee>): void {
  const fields = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => `${key} = ?`)
    .join(', ');

  const values = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => updates[key as keyof Attendee]);

  const stmt = getDb().prepare(`UPDATE attendees SET ${fields} WHERE id = ?`);
  stmt.run(...values, id);
}

export function deleteAttendee(id: number): void {
  const stmt = getDb().prepare('DELETE FROM attendees WHERE id = ?');
  stmt.run(id);
}

// Activity operations
export function insertActivity(activity: Activity): number {
  const stmt = getDb().prepare(`
    INSERT INTO activities (title, description, host_name, host_email, duration, equipment_needed, capacity, time_preference, activity_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
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
  );

  return result.lastInsertRowid as number;
}

export function getAllActivities(status?: string): Activity[] {
  if (status) {
    const stmt = getDb().prepare('SELECT * FROM activities WHERE status = ? ORDER BY created_at DESC');
    return stmt.all(status) as Activity[];
  }
  const stmt = getDb().prepare('SELECT * FROM activities ORDER BY created_at DESC');
  return stmt.all() as Activity[];
}

export function getActivityById(id: number): Activity | undefined {
  const stmt = getDb().prepare('SELECT * FROM activities WHERE id = ?');
  return stmt.get(id) as Activity | undefined;
}

export function updateActivity(id: number, updates: Partial<Activity>): void {
  const fields = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => `${key} = ?`)
    .join(', ');

  const values = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => updates[key as keyof Activity]);

  const stmt = getDb().prepare(`UPDATE activities SET ${fields} WHERE id = ?`);
  stmt.run(...values, id);
}

export function deleteActivity(id: number): void {
  const stmt = getDb().prepare('DELETE FROM activities WHERE id = ?');
  stmt.run(id);
}

// Settings operations
export function getSetting(key: string): string | undefined {
  const stmt = getDb().prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as { value: string } | undefined;
  return result?.value;
}

export function setSetting(key: string, value: string): void {
  const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}

export function getAllSettings(): Setting[] {
  const stmt = getDb().prepare('SELECT * FROM settings');
  return stmt.all() as Setting[];
}

// Announcement operations
export function getActiveAnnouncements(): Announcement[] {
  const stmt = getDb().prepare('SELECT * FROM announcements WHERE active = 1 ORDER BY created_at DESC');
  return stmt.all() as Announcement[];
}

export function insertAnnouncement(message: string): number {
  const stmt = getDb().prepare('INSERT INTO announcements (message) VALUES (?)');
  const result = stmt.run(message);
  return result.lastInsertRowid as number;
}

// Specialized activity queries for Phase 2
export function getScheduledActivities(): Activity[] {
  const stmt = getDb().prepare(`
    SELECT * FROM activities
    WHERE status = 'scheduled'
    ORDER BY scheduled_start ASC
  `);
  return stmt.all() as Activity[];
}

export function getApprovedAndScheduledActivities(): Activity[] {
  const stmt = getDb().prepare(`
    SELECT * FROM activities
    WHERE status IN ('approved', 'scheduled')
    ORDER BY title ASC
  `);
  return stmt.all() as Activity[];
}
