import { Router, Response } from 'express';
import db from '../database/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

const BACKUP_DIR = path.join(path.dirname(process.env.DB_PATH || './data/sprint-society.db'), 'backups');

const TABLES_TO_EXPORT = [
  'users', 'activities', 'user_xp', 'xp_transactions', 'achievements', 'user_achievements',
  'communities', 'community_members', 'community_posts', 'community_chat_messages',
  'events', 'event_rsvps', 'event_checkins', 'club_sessions', 'session_attendance',
  'challenges', 'tier_history', 'announcements', 'follows', 'kudos', 'comments',
  'kendu_balances', 'kendu_transactions', 'kendu_ledger', 'user_goals', 'daily_wellness',
  'personal_records', 'ai_profiles', 'user_notifications', 'invite_codes', 'invite_code_usage',
  'user_subscriptions', 'payment_history', 'feedback', 'strava_tokens',
];

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function tableToCSV(tableName: string): string | null {
  try {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, any>[];
    if (rows.length === 0) return null;

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      csvLines.push(headers.map(h => escapeCsvField(row[h])).join(','));
    }

    return csvLines.join('\n');
  } catch {
    return null;
  }
}

function runBackup(): { filename: string; path: string; tables: number; totalRows: number } {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFolder = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  let tablesExported = 0;
  let totalRows = 0;

  for (const table of TABLES_TO_EXPORT) {
    const csv = tableToCSV(table);
    if (csv) {
      fs.writeFileSync(path.join(backupFolder, `${table}.csv`), csv, 'utf-8');
      tablesExported++;
      totalRows += csv.split('\n').length - 1;
    }
  }

  const manifest = {
    created_at: new Date().toISOString(),
    tables_exported: tablesExported,
    total_rows: totalRows,
    tables: TABLES_TO_EXPORT.filter(t => {
      try { return fs.existsSync(path.join(backupFolder, `${t}.csv`)); } catch { return false; }
    }),
  };
  fs.writeFileSync(path.join(backupFolder, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return { filename: `backup-${timestamp}`, path: backupFolder, tables: tablesExported, totalRows };
}

// GET /admin/backup/now — trigger backup and return a single combined CSV download
router.get('/now', (req: AuthRequest, res: Response) => {
  try {
    const result = runBackup();

    // Build a combined CSV with table separators
    let combined = '';
    for (const table of TABLES_TO_EXPORT) {
      const csvPath = path.join(result.path, `${table}.csv`);
      if (fs.existsSync(csvPath)) {
        combined += `\n--- TABLE: ${table} ---\n`;
        combined += fs.readFileSync(csvPath, 'utf-8');
        combined += '\n';
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sprint-society-backup-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(combined);
  } catch (err: any) {
    console.error('[Backup] Error:', err);
    res.status(500).json({ error: 'Backup failed', details: err.message });
  }
});

// GET /admin/backup/table/:name — download a single table as CSV
router.get('/table/:name', (req: AuthRequest, res: Response) => {
  const { name } = req.params;
  if (!TABLES_TO_EXPORT.includes(name)) {
    return res.status(400).json({ error: 'Table not in export list' });
  }

  const csv = tableToCSV(name);
  if (!csv) {
    return res.status(404).json({ error: 'Table empty or not found' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// GET /admin/backup/history — list past backups
router.get('/history', (req: AuthRequest, res: Response) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json([]);
    }

    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
      .slice(0, 20)
      .map(folder => {
        const manifestPath = path.join(BACKUP_DIR, folder, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          return { folder, ...JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) };
        }
        return { folder, created_at: null, tables_exported: 0, total_rows: 0 };
      });

    res.json(backups);
  } catch {
    res.json([]);
  }
});

// GET /admin/backup/stats — quick DB stats without running a full backup
router.get('/stats', (req: AuthRequest, res: Response) => {
  const stats: Record<string, number> = {};
  for (const table of TABLES_TO_EXPORT) {
    try {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;
      stats[table] = row.count;
    } catch {
      stats[table] = -1;
    }
  }
  res.json({ tables: stats, total_tables: Object.keys(stats).length, backup_dir: BACKUP_DIR });
});

export { runBackup };
export default router;
