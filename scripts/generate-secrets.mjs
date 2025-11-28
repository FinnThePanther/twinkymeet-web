#!/usr/bin/env node

/**
 * Generate production secrets for TwinkyMeet deployment
 *
 * Run this script to generate:
 * - ADMIN_PASSWORD_HASH: bcrypt hash of admin password
 * - SESSION_SECRET: cryptographically secure random string
 *
 * Usage:
 *   node scripts/generate-secrets.mjs <admin-password>
 */

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

async function generateSecrets() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Admin password is required');
    console.log('\nUsage:');
    console.log('  node scripts/generate-secrets.mjs <admin-password>');
    console.log('\nExample:');
    console.log('  node scripts/generate-secrets.mjs "MySecurePassword123!"');
    process.exit(1);
  }

  const adminPassword = args[0];

  console.log('Generating production secrets...\n');

  // Generate admin password hash
  console.log('Hashing admin password...');
  const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  // Generate session secret (64 bytes = 128 hex characters)
  console.log('Generating session secret...');
  const sessionSecret = randomBytes(64).toString('hex');

  console.log('\n=== PRODUCTION SECRETS ===\n');
  console.log(
    'Copy these values to your Cloudflare Pages environment variables:\n'
  );
  console.log('ADMIN_PASSWORD_HASH:');
  console.log(adminPasswordHash);
  console.log('\nSESSION_SECRET:');
  console.log(sessionSecret);
  console.log('\n=========================\n');

  console.log(
    '⚠️  IMPORTANT: Store these securely and never commit them to git!'
  );
  console.log(
    '💡 Add them to Cloudflare Pages dashboard under Settings > Environment variables'
  );
}

generateSecrets().catch((error) => {
  console.error('Error generating secrets:', error);
  process.exit(1);
});
