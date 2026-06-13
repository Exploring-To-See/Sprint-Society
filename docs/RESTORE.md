# Sprint Society — Database Restore Guide

## Backup System

Sprint Society runs nightly SQLite backups via the scheduler:
- **Schedule:** Every 24 hours (registered on server startup)
- **Method:** SQLite `.backup()` API (consistent, safe during writes)
- **Location:** `data/backups/sprint-society-YYYY-MM-DD.backup`
- **Retention:** 14 days (older files are pruned automatically)
- **Upload:** If `BACKUP_STORAGE_URL` env var is set, uploads to object storage after local backup

## Restore from Local Backup

```bash
# 1. Stop the server
railway down  # or kill the process

# 2. List available backups
ls data/backups/

# 3. Replace the database with the backup
cp data/backups/sprint-society-2026-06-12.backup data/sprint-society.db

# 4. Restart the server
railway up  # or npm start
```

## Restore from Object Storage

```bash
# 1. Download the backup
curl -o data/sprint-society.db "$BACKUP_STORAGE_URL/sprint-society-2026-06-12.backup"

# 2. Restart the server
npm start
```

## Restore from Railway Admin Panel

1. Go to admin panel → Backup tab
2. Click "Download Backup" (downloads a CSV export of all tables)
3. For full DB restore, use the `.backup` files from the filesystem

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `BACKUP_STORAGE_URL` | Object storage endpoint for off-site backups (S3-compatible PUT URL) | No |
| `DB_PATH` | Path to the SQLite database file | No (defaults to `data/sprint-society.db`) |

## Verify Backup Integrity

```bash
# Check if backup is a valid SQLite database
sqlite3 data/backups/sprint-society-2026-06-12.backup "SELECT COUNT(*) FROM users;"
```

## Notes

- Backups use SQLite's built-in `.backup()` which is safe even during concurrent writes
- The scheduler job runs within the Node.js process — no external cron needed
- WAL mode is enabled, so the main DB file + WAL are both required for a live database
- After restoring, the server's `initializeDatabase()` will run migrations automatically on startup
