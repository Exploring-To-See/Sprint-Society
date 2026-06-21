# Sprint Society — Admin Operations Guide

> Your command center. Bookmark this file.

---

## 🔧 Claude Code Commands (type these in terminal)

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/sprint-team` | **Full team review** — runs 5 agents (algo, frontend, backend, PM, QA) in parallel | Weekly. Catches bugs, improves code, audits product. |
| `/sprint-algo` | **Algorithm Engineer** — deep review of AI/sports science engine | After adding new engine features. Validates correctness. |
| `/sprint-ui` | **Frontend Engineer** — fixes TS errors, missing states, accessibility | After UI changes. Ensures nothing is broken. |
| `/sprint-backend` | **Backend Engineer** — security audit, performance, validation | After adding new API routes. Catches vulnerabilities. |
| `/review` | **Pull request review** — reviews current branch changes | Before deploying. Catches issues before they ship. |
| `/security-review` | **Security audit** — full security check of pending changes | Before any deployment with auth/data changes. |

---

## 🌐 Vercel Admin Actions

### Daily Check
1. Open the Vercel dashboard → Sprint-Society project
2. Check: latest Production deployment is **Ready** (green)
3. Check: Logs / Observability for errors and function durations

### After Code Push
- Vercel auto-deploys on push to `main`
- Check Deployments for build status
- If failed: open the deployment → Build/Function Logs

### Environment Variables (Settings → Environment Variables)
| Key | What it is | When to change |
|-----|-----------|----------------|
| `JWT_SECRET` | Auth signing key | Never (changing logs everyone out) |
| `DATABASE_URL` | Supabase Postgres (transaction pooler `:6543`) | If you rotate the DB |
| `CLIENT_URL` | Your production origin (Vercel URL / custom domain) | When the URL changes |
| `CRON_SECRET` | Guards the daily maintenance cron | Rarely |
| `ANTHROPIC_API_KEY` | AI coach/chat | When set up |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Payments | When set up |
| `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID` | Google sign-in | When set up |
| `RESEND_API_KEY` | Email service key | When you set up Resend |

> Full list with formats: [.env.example](../../.env.example). Deploy runbook: [docs/DEPLOYMENT.md](../DEPLOYMENT.md).

---

## 📊 Admin Panel (in the app)

Login as admin at `https://YOUR-URL/admin`

### What you can do:
| Action | How |
|--------|-----|
| **View all runners** | Runners tab → see everyone's stats |
| **View club stats** | Overview tab → total runners, runs, distance |
| **Disable a user** | API: `PUT /api/admin/runners/:id/disable` |
| **Enable a user** | API: `PUT /api/admin/runners/:id/enable` |
| **Reset someone's password** | API: `PUT /api/admin/runners/:id/reset-password` |
| **Adjust XP** | API: `PUT /api/admin/runners/:id/xp` body: `{amount: 100, reason: "bonus"}` |
| **Override tier** | API: `PUT /api/admin/runners/:id/tier` body: `{tier: "advanced"}` |
| **Delete a user** | API: `DELETE /api/admin/runners/:id` |
| **Export all data** | API: `GET /api/admin/export/runners` or `/export/activities` |
| **System health** | API: `GET /api/admin/health` |
| **Create club session** | Sessions tab → + New Session |
| **Post announcement** | Posts tab → + New Post |

---

## 📅 Routine Work Plan

### Daily (2 min)
- [ ] Check the latest Vercel deployment is Ready (green)
- [ ] Check for new signups (admin panel → Overview)

### Weekly (15 min)
- [ ] Run `/sprint-team` — full code review
- [ ] Check admin stats (how many runs this week?)
- [ ] Post an announcement if there's a club event

### Bi-weekly (30 min)
- [ ] Run `/sprint-algo` — check AI engine improvements
- [ ] Review user feedback (if any)
- [ ] Check if any users are stuck/inactive

### Monthly (1 hour)
- [ ] Export data: `GET /api/admin/export/runners`
- [ ] Review: are users getting faster? (the north star)
- [ ] Plan next features based on what users need
- [ ] Update pricing if user threshold crossed

---

## 🚀 Deployment Checklist

Before pushing to production:
1. [ ] Run `/sprint-team` — fix anything it finds
2. [ ] Run `/security-review` — no vulnerabilities
3. [ ] Check: all env vars still correct in Vercel
4. [ ] Push to `main` — Vercel auto-deploys
5. [ ] Wait 1-2 min → check Deployments → confirm Ready (green)
6. [ ] Open the live URL → test login → test one feature
7. [ ] Done

---

## 🔑 Important Credentials

| Service | Where to find | URL |
|---------|--------------|-----|
| Vercel | Dashboard (hosting + deploys + env vars) | vercel.com |
| Supabase | Dashboard (Postgres + backups) | supabase.com |
| GitHub | Exploring-To-See/Sprint-Society | github.com |
| Resend | API keys (when set up) | resend.com/api-keys |
| Admin login | admin@sprintsociety.com / [your password] | your-domain/admin |

---

## 🆘 If Something Breaks

1. **App is down**: Vercel dashboard → Deployments → check latest deploy. Roll back to a previous working deployment if needed.
2. **Build failed**: Open the failed deployment → Build/Function Logs → screenshot → come to Claude Code → paste.
3. **User reports bug**: Check Vercel function logs (Deployment → Logs / Observability). Then fix and push.
4. **Forgot admin password**: Run `ADMIN_PASSWORD=new-pass npm run migrate` (re-seeds the admin user) against the Supabase database.
5. **Database issue**: Check the Supabase dashboard (Database → Logs/Health), or connect with `psql "$DATABASE_URL"`.

---

*Last updated: 2026-05-15*
