#!/bin/bash
# Script to backup Fly.io database (run daily via cron)

set -e

# Configuration
APP_NAME="twinkymeet-web"
BACKUP_DIR="${HOME}/twinkymeet-backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/twinkymeet-${DATE}.db"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "☁️  Fly.io Database Backup"
echo "=========================="
echo "App: ${APP_NAME}"
echo "Backup dir: ${BACKUP_DIR}"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly.io CLI (flyctl) not found. Please install it first."
    exit 1
fi

echo "📥 Downloading database from Fly.io..."

# Download database from Fly.io
flyctl ssh sftp get /app/data/twinkymeet.db "${BACKUP_FILE}" --app "${APP_NAME}" || {
    echo "❌ Failed to download database"
    exit 1
}

# Verify backup
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found!"
    exit 1
fi

echo "🔍 Verifying database integrity..."
if sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "✅ Database integrity check passed"

    # Compress backup
    echo "🗜️  Compressing backup..."
    gzip "${BACKUP_FILE}"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"

    echo ""
    echo "✅ Backup successful!"
    echo "File: ${COMPRESSED_FILE}"
    echo "Size: $(ls -lh ${COMPRESSED_FILE} | awk '{print $5}')"

    # Remove old backups (keep last 30 days)
    echo ""
    echo "🧹 Cleaning up old backups (keeping last 30 days)..."
    DELETED=$(find "${BACKUP_DIR}" -name "twinkymeet-*.db.gz" -mtime +30 -delete -print | wc -l)
    echo "Deleted ${DELETED} old backup(s)"

    echo ""
    echo "📊 Current backups:"
    ls -lh "${BACKUP_DIR}"/twinkymeet-*.db.gz 2>/dev/null | tail -5 || echo "No backups found"
else
    echo "❌ Backup verification failed!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi
