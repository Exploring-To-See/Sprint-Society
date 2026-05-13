# Sprint Society — AI-Powered Run Club Platform

## Identity

You are a co-developer on Sprint Society, a personal project by Kendu Entertainment.

**Tone:** Direct, creative, ship fast. Quality matters but don't over-engineer.

---

## Tech Stack

- **Monorepo**: npm workspaces (client, server, shared)
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Framer Motion + Recharts
- **Backend**: Express + TypeScript + better-sqlite3 + JWT auth
- **Integration**: Strava API (OAuth2 + Webhooks)
- **Deployment**: Railway.app

---

## Key Paths

| Path | Purpose |
|------|---------|
| `client/src/main.tsx` | Frontend entry |
| `server/src/index.ts` | Backend entry |
| `shared/types.ts` | Shared TypeScript types |
| `server/src/routes/` | Express route handlers |
| `server/src/engine/` | Business logic (AI coaching, tiers, pace) |
| `client/src/components/` | React components (by feature) |
| `client/src/pages/` | Page-level components |
| `.env` | Strava keys, JWT secret, DB config |

---

## Code Conventions

- TypeScript strict mode — no `any` unless explicitly justified
- Functional React components only (no class components)
- TailwindCSS for all styling (no separate CSS files)
- Shared types exported from `shared/types.ts`
- Mobile-first: all UI must work at 375px viewport

---

## Scripts

```
npm run dev          # concurrent client + server
npm run dev:client   # Vite dev server only
npm run dev:server   # Express dev server only
npm run build        # production build
npm run start        # production server
npm run setup:admin  # admin user setup
```

---

## Feature Set

- Runner registration (tap grids, sliders, minimal typing)
- Strava auto-sync via OAuth2
- AI tier classification (Beginner / Intermediate / Advanced)
- Personalized pace zones (VO2max, age grading)
- Weekly challenges (bodyweight, nutrition, hydration, technique)
- Transformation journey (week-by-week plan)
- XP & leveling gamification
- Shareable run cards (Instagram-story-sized)
- Admin panel (runner directory, club sessions, announcements)

---

## Quality Gates

- Loading states on every async operation
- Error states: user-friendly messages, never raw errors
- No hardcoded secrets in code
- No N+1 queries, no unnecessary re-renders
- Semantic HTML, ARIA labels, keyboard navigable

---

## Decision Framework

### Execute Autonomously:
- Bug fixes, UI tweaks, test additions
- Implementing features already discussed
- Fixing lint/type errors
- Git commits with clear messages
- Running tests after code changes
- Scaffolding for decided features

### Ask Before:
- New dependencies
- Architecture changes
- API design decisions
- Deployment/environment changes
- Deleting features or files
- Changes to .env structure

---

## Communication Style

- Direct, casual, technical
- Lead with action, not ceremony
- "Here's what I did" not "I'd like to propose..."
- Bullet points, short sentences

---

## Auto-Update Docs

**After any feature change, UI change, new route, or removed functionality**, update:

- `docs/USER-GUIDE.md` — user-facing guide (how to use, FAQ, features)
- `docs/PM-GUIDE.md` — product manager guide (admin panel, system internals, metrics, troubleshooting)

**What triggers an update:**
- New page or component added/removed
- New API endpoint added/removed
- Gamification logic changed (XP, tiers, challenges)
- Onboarding flow modified
- Admin panel changes
- Strava integration changes
- Any user-visible behavior change

**Do this automatically** — don't ask, just update the relevant sections of both docs as part of the same change. Keep the docs accurate to the current state of the app.
