#!/bin/bash
# Script to backup Railway database before migration

set -e

echo "🚂 Railway Database Backup Script"
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Generate timestamp for backup filename
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="railway-backup-${TIMESTAMP}.db"

echo "📥 Downloading database from Railway..."
echo "Backup file: ${BACKUP_FILE}"
echo ""

# Download database using Railway CLI
railway run node -e "
const fs = require('fs');
const db = require('better-sqlite3')(process.env.DATABASE_PATH);

// Backup database
db.backup('./${BACKUP_FILE}')
  .then(() => {
    console.log('✅ Backup complete: ${BACKUP_FILE}');
    db.close();
  })
  .catch(err => {
    console.error('❌ Backup failed:', err);
    process.exit(1);
  });
"

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found!"
    exit 1
fi

echo ""
echo "🔍 Verifying database integrity..."
sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;" || {
    echo "❌ Database integrity check failed!"
    exit 1
}

echo ""
echo "📊 Database statistics:"
echo "----------------------"
sqlite3 "${BACKUP_FILE}" <<EOF
SELECT 'Attendees: ' || COUNT(*) FROM attendees;
SELECT 'Activities: ' || COUNT(*) FROM activities;
SELECT 'Settings: ' || COUNT(*) FROM settings;
SELECT 'Announcements: ' || COUNT(*) FROM announcements;
SELECT 'Login attempts: ' || COUNT(*) FROM login_attempts;
EOF

echo ""
echo "✅ Backup successful!"
echo "File: ${BACKUP_FILE}"
echo "Size: $(ls -lh ${BACKUP_FILE} | awk '{print $5}')"
echo ""
echo "Next steps:"
echo "1. Review the backup file"
echo "2. Store it securely"
echo "3. Use it for Fly.io migration"
