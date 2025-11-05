import bcrypt from 'bcrypt';

/**
 * Generate a bcrypt hash for the admin password
 * Usage: pnpm tsx scripts/generate-password-hash.ts "your-password"
 */

const SALT_ROUNDS = 12;

async function generateHash(password: string) {
  if (!password) {
    console.error('Error: Password is required');
    console.error('Usage: pnpm tsx scripts/generate-password-hash.ts "your-password"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Warning: Password should be at least 8 characters long');
  }

  try {
    console.log('Generating bcrypt hash...');
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log('\n✓ Password hash generated successfully!\n');
    console.log('Add this to your .env file:');
    console.log('─'.repeat(80));
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('─'.repeat(80));
    console.log('\nMake sure to also set a SESSION_SECRET in your .env file:');
    console.log('You can generate one with: openssl rand -base64 32');
  } catch (error) {
    console.error('Error generating hash:', error);
    process.exit(1);
  }
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Error: Password is required');
  console.error('Usage: pnpm tsx scripts/generate-password-hash.ts "your-password"');
  process.exit(1);
}

generateHash(password);
