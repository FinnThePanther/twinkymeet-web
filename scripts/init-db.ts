// Database initialization script
// Run with: node --loader ts-node/esm scripts/init-db.ts
// Or: tsx scripts/init-db.ts

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbPath = process.env.DATABASE_PATH || './db/local.db';
const schemaPath = join(process.cwd(), 'db', 'schema.sql');

console.log('Initializing database...');
console.log('Database path:', dbPath);
console.log('Schema path:', schemaPath);

try {
  // Create database connection
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Read and execute schema
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log('✓ Database initialized successfully!');
  console.log('✓ Schema applied');

  // Verify tables were created
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('\nCreated tables:');
  tables.forEach((table: any) => {
    console.log('  -', table.name);
  });

  // Show initial settings
  const settings = db.prepare('SELECT * FROM settings').all();
  console.log('\nInitial settings:');
  settings.forEach((setting: any) => {
    console.log(`  - ${setting.key}: ${setting.value}`);
  });

  db.close();
  console.log('\n✓ Database connection closed');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}
