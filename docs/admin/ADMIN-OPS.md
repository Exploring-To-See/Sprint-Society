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

## 🌐 Railway Admin Actions

### Daily Check
1. Open Railway dashboard → Sprint-Society service
2. Check: Is it running? (green status)
3. Check: Metrics tab → memory usage, response times

### After Code Push
- Railway auto-deploys on push to `main`
- Check Deployments tab for build status
- If failed: click deploy → Build Logs → screenshot error

### Environment Variables (Settings → Variables)
| Key | What it is | When to change |
|-----|-----------|----------------|
| `NODE_ENV` | `production` | Never |
| `PORT` | `3001` | Never |
| `JWT_SECRET` | Auth encryption key | Never (changing logs everyone out) |
| `CLIENT_URL` | Your Railway URL | Only if URL changes |
| `RESEND_API_KEY` | Email service key | When you set up Resend |
| `STRAVA_CLIENT_ID` | Strava app ID | When you set up Strava |
| `STRAVA_CLIENT_SECRET` | Strava secret | When you set up Strava |

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
- [ ] Check Railway is running (green)
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
3. [ ] Check: all env vars still correct on Railway
4. [ ] Push to `main` — Railway auto-deploys
5. [ ] Wait 3-4 min → check Deployments tab → confirm green
6. [ ] Open the live URL → test login → test one feature
7. [ ] Done

---

## 🔑 Important Credentials

| Service | Where to find | URL |
|---------|--------------|-----|
| Railway | Dashboard | railway.app |
| GitHub | Exploring-To-See/Sprint-Society | github.com |
| Resend | API keys (when set up) | resend.com/api-keys |
| Strava API | Settings/API (when set up) | strava.com/settings/api |
| Admin login | admin@sprintsociety.com / [your password] | your-railway-url/admin |

---

## 🆘 If Something Breaks

1. **App is down**: Railway dashboard → Deployments → check latest deploy. Redeploy previous working version if needed.
2. **Build failed**: Click failed deploy → Build Logs → screenshot → come to Claude Code → paste.
3. **User reports bug**: Check Railway logs (Deployments → Logs tab). Then fix and push.
4. **Forgot admin password**: Run `npm run setup:admin` on Railway shell to create new admin.
5. **Database issue**: Railway shell → `cd server && node -e "require('./dist/database/db')"` to check.

---

*Last updated: 2026-05-15*
