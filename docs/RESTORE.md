# Sprint Society — Database Restore Guide

The production database is **Supabase Postgres**. Durable backups are Supabase's
managed responsibility; the app-level CSV export is a convenience/secondary copy.

## Backup layers

1. **Supabase managed backups (primary).**
   - Supabase takes automatic daily backups; Point-in-Time Recovery (PITR) is
     available on paid plans.
   - Restore from the Supabase dashboard → Database → Backups, or via
     `supabase db dump` / `pg_restore`.

2. **App-level CSV export (secondary).**
   - Admin panel → Backup tab → "Download Backup" streams a combined CSV of all
     tables (`GET /api/admin/backup/now`). This is built in memory and works on
     Vercel (read-only filesystem) as well as self-hosted servers.
   - Self-hosted deploys also write dated CSV folders to `./data/backups` nightly
     via the in-process scheduler. On Vercel there is no nightly disk backup —
     rely on Supabase's managed backups (the daily Vercel Cron only runs DB
     maintenance, not exports).

## Restore the whole database (Supabase)

```bash
# Option A — Supabase dashboard:
#   Database → Backups → choose a snapshot → Restore (or use PITR).

# Option B — from a pg_dump you took yourself:
pg_restore --clean --no-owner \
  -d "$DATABASE_URL" \
  ./sprint-society-YYYY-MM-DD.dump

# Option C — re-apply schema to a fresh database, then load data:
npm run migrate            # applies server/src/database/schema.pg.sql (idempotent) + seeds
```

> `DATABASE_URL` must point at the Supabase database. For a full restore use the
> **direct** connection string (port 5432), not the transaction pooler (6543).

## Restore a single table

Download it from the admin panel (`GET /api/admin/backup/table/:name`) or query
Supabase directly with `psql "$DATABASE_URL"`.

## Schema / migrations

`server/src/database/schema.pg.sql` is the single source of truth. It is
idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), so
`npm run migrate` is safe to re-run; it applies the schema and seeds the admin
user, default club, achievements, subscription plans and invite codes.

## Environment variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Supabase Postgres connection string (pooler `:6543` in prod, direct `:5432` for restores/migrations) | Yes |
| `BACKUP_DIR` | Override the CSV export directory (serverless writes to the OS temp dir) | No |
| `CRON_SECRET` | Guards the Vercel Cron maintenance endpoint | Prod |

## Notes

- The nightly Vercel Cron (`/api/cron/maintenance`) only runs idempotent SQL
  maintenance (challenge/subscription expiry, streak decay, Kendu challenge
  resolution). It does **not** create backups — Supabase covers durability.
- After restoring, the server applies any pending idempotent schema changes on
  the next `npm run migrate` (self-host applies them on boot via
  `initializeDatabase()`).
