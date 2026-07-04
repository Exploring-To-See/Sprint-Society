# Sprint Society — Page & Subpage Gap Report

Cross-reference of **every route on `origin/main`** vs. its design status and its
coverage in this local preview. Answers: *"are we missing pages?"*

Legend:
- **Design on main:** ✅ new `ss-base` design already shipped in React · ⛔ still old design
- **Preview:** page rebuilt on `ss-base` in this Flask preview
- **Subtabs:** the segmented sub-sections inside that page (each must exist & be on-system)

---

## A. Bottom-nav destinations (what users tap most)

| Route | Page | Design on main | In preview | Subtabs |
|-------|------|:---:|:---:|---|
| `/dashboard` | Home | ⛔ old | ✅ | — |
| `/coach` | AI Coach | ✅ new | ✅ | Chat · Plan · Insights · Zones · Records |
| `/social` | Social | ⛔ old | ✅ | Feed · Communities |
| `/events` | Events | ⛔ old | ✅ | All · Runs · Social · Health&Fitness + List/Map |
| `/run/track` | Run tracker | ⛔ old | ✅ | states: Idle · Running · Paused · Finished · Analysis |

## B. Detail / nested subpages (reached from a parent)

| Route | Page | Design on main | In preview |
|-------|------|:---:|:---:|
| `/communities` | Communities list | ⛔ old | ✅ |
| `/communities/:id` | Community detail | ⛔ old | ✅ |
| `/communities/create` | Create community | ⛔ old | ⚠️ folded into Communities (form) |
| `/events/:id` | Event detail | ⛔ old | ✅ |
| `/user/:id` | Runner profile | ⛔ old | ✅ |

## C. AI Coach cluster (already redesigned on main)

| Route | Page | Design on main | In preview |
|-------|------|:---:|:---:|
| `/plan` | Training plan | ✅ new | ✅ |
| `/heart-rate` | HR zones | ✅ new | ✅ |
| `/records` | Personal records | ✅ new | ✅ |

## D. Journey / data / account pages

| Route | Page | Design on main | In preview | Subtabs |
|-------|------|:---:|:---:|---|
| `/progress` | Progress | ⛔ old | ✅ | Stats · Journey |
| `/runs` | Run history | ⛔ old | ✅ | — |
| `/challenges` | Challenges | ⛔ old | ✅ | — |
| `/rewards` | Rewards (Kendu) | ⛔ old | ✅ | Marketplace · Actions |
| `/notifications` | Notifications | ⛔ old | ✅ | — |
| `/subscription` | Subscription | ⛔ old | ✅ | — |
| `/profile` | My profile | ⛔ old | ✅ | — |
| `/share` | Share card | ⛔ old | ✅ | — |

## E. Onboarding

| Route | Page | Design on main | In preview | Subtabs |
|-------|------|:---:|:---:|---|
| `/profiling` | AI profiling quiz | ⛔ old | ✅ | — |
| `/ai-profile` | AI DNA profile | ⛔ old | ✅ | — |
| `/set-goal` | Set goal wizard | ⛔ old | ✅ | Race · Pace |

## F. Auth / public

| Route | Page | Design on main | In preview |
|-------|------|:---:|:---:|
| `/login` (`/`) | Login | ⛔ old | ✅ |
| `/register` | Register | ⛔ old | ✅ |
| `/forgot-password` | Forgot password | ⛔ old | ⬜ not in preview scope |
| `/reset-password/:token` | Reset password | ⛔ old | ⬜ not in preview scope |
| `/join`, `/founding` | Landing | ⛔ old | ⬜ not in preview scope |

## G. Admin (separate portal — hostname-gated in prod)

| Route | Page | Design on main | In preview | Subtabs |
|-------|------|:---:|:---:|---|
| `/admin` | Admin panel | ⛔ old | ✅ (overview) | 14 tabs: Overview·Runners·Events·Communities·Sessions·Announcements·Analytics·Flags·Segments·Notifications·Content·Audit·Engineering·Moderation |

---

## Summary — the answer to "are we missing pages?"

- **On `origin/main` today, only 4 pages have the new design**: AI Coach, Plan, Heart-rate, Records (all the Coach cluster). **Everything else — Home, Social, Events, Run, Communities, Profile, Progress, Rewards, and ~13 more — is still the OLD design.** That is exactly why you saw only the AI page updated.
- **This preview rebuilds ~24 pages on `ss-base`** so you can click through the *intended* full redesign locally.
- **Deliberately out of preview scope** (low design value / edge flows): `/forgot-password`, `/reset-password/:token`, the marketing `/join` landing. Say the word and I'll add them.
- **Folded, not dropped:** `/communities/create` is shown as a create-form within Communities rather than its own route.

Open **`/__pages`** in the running preview for a live clickable index of all of the above.
