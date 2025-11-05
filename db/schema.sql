-- TwinkyMeet Database Schema

-- Attendees table: Stores RSVP information for event attendees
CREATE TABLE IF NOT EXISTS attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  dietary_restrictions TEXT,
  plus_one INTEGER DEFAULT 0,
  arrival_time TEXT,
  departure_time TEXT,
  excited_about TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activities table: Stores submitted and approved activities for the event schedule
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  host_name TEXT NOT NULL,
  host_email TEXT,
  duration INTEGER, -- minutes
  equipment_needed TEXT,
  capacity INTEGER,
  time_preference TEXT,
  activity_type TEXT, -- gaming, outdoor, creative, social, etc.
  status TEXT DEFAULT 'pending', -- pending, approved, scheduled, cancelled
  scheduled_start DATETIME,
  scheduled_end DATETIME,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photos table: Stores metadata for post-event photo gallery
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table: Stores site-wide announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings table: Key-value store for site configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Login attempts table: Track failed login attempts for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
  locked_until DATETIME
);

-- Insert initial settings data
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('event_date_start', '2026-07-01'),
  ('event_date_end', '2026-07-05'),
  ('location', 'TBD'),
  ('rsvp_open', 'true'),
  ('activity_submissions_open', 'true');
