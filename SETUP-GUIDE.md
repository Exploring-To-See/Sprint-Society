# Sprint Society — Setup Guide

> **Deployment moved to Vercel + Supabase.** This project no longer uses Railway.
> The full, current setup and deploy instructions live in
> **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Quick links

- **Deploy / production runbook:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Environment variables:** [.env.example](.env.example)
- **Database restore:** [docs/RESTORE.md](docs/RESTORE.md)

## Local development

```bash
# 1. Start a local Postgres (Docker)
docker compose up -d

# 2. Copy env and fill it in
cp .env.example .env        # set JWT_SECRET, DATABASE_URL, etc.

# 3. Apply schema + seed the admin user
ADMIN_PASSWORD=your-password npm run migrate

# 4. Run client + server
npm install
npm run dev                 # client on :5173, API on :3001
```

Open http://localhost:5173.
