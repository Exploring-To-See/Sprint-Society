# Preview page build guide (for template authors)

You are writing ONE Jinja2 template per page for the Flask preview at
`audit/preview-app/`. The app is proven working; Home is the reference.

## Non-negotiable rules (same locked design gates as the React app)
1. **Extend `base.html`.** Never write `<html>`/`<head>`/nav yourself — the shell (aurora, status bar, topbar, floating glide-pill nav, fonts, ss-base.css) comes from base.
2. **ZERO emoji.** Use the `icon()` macro from `partials/ui.html` (crafted inline SVGs). If you need a glyph that isn't in the macro, ADD it to `ui.html` — never paste an emoji.
3. **Compose only from ss-base surfaces:** `.tile`, `.tile.recess`, `.ss-surface[.ss-recess/.ss-hero]`, `.glass`. No flat `background:#hex` boxes. Every panel has the dual-edge ring (these classes provide it).
4. **Sub-tabs = ONE `.ss-segbar` + `.ss-segpill`** (neutral frosted glide-pill on the active tab). NEVER filled-orange tab buttons. Static preview: put `.ss-segpill` inside the active `.ss-segtab` and add `.on`. Non-active tabs are links to the same or sibling routes.
5. **Metrics are mono instruments:** wrap numbers in `font-family:var(--mono)` + `tabular-nums` (use existing classes `.v/.gnum/.tval` or `style="font:600 15px var(--mono);font-variant-numeric:tabular-nums"`).
6. **Tokens only** for color/type: `--fg --muted --muted-2 --accent --accent-2 --violet --violet-2 --green --amber`, `--head/--body/--mono`. Caps labels: `--lbl` size + `--trk-sm` tracking (class `.tlbl`/`.slbl`/`.k`).
7. **Tags** `.ss-tag[.now/.soon/.go/.maybe/.full]`; **buttons** `.ss-btn[.ss-btn-primary/.ss-btn-soft/.ss-btn-ghost]`; **chips** `.ss-qchip`; **deltas** `.ss-dchip[.good/.info/.warn/.neutral]`; **AI surface** `.ss-ai`.
8. Tint is **semantic only** (status/delta/primary/AI-violet). Neutral glass by default. Orange leads; violet = AI signal.
9. Content lives inside `{% block content %}`. Page-only layout CSS goes in `{% block page_style %}` (grid/padding/height ONLY — never redefine tokens or re-author surfaces).
10. Wrap normal content in `<div class="pad">…</div>` for the 16px gutter. The body already clears the floating nav.

## Available in every template
- `{% extends 'base.html' %}`
- `{% from 'partials/ui.html' import icon, gauge, stat, sechead %}`
- `{{ icon('name', size, color, stroke_width) }}` — names: run, pulse, flame, drop, dumbbell, target, chart, bolt, mountain, calendar, pin, clock, trophy, medal, heart, comment, chevron, chevron-down, plus, check, play, pause, stop, camera, lock, dna, spark, coin, gift, bell, share, settings, shield, edit, users
- `{{ gauge(value, cap, pct) }}` — readiness arc (88px)
- `{{ stat(value, key, unit) }}` — a `.sstat` metric cell
- `{{ sechead('Label', 'more text', href) }}` — section header w/ optional link
- `seed` object (see `seed.py`) — data. `user` (current user), `unread_count`.
- `url_for('endpoint')` — routes: dashboard, social, run_track, communities, community_detail(cid=), events, event_detail(eid=), coach, plan, heart_rate, records, progress, runs, challenges, rewards, notifications, subscription, profile, user_profile(uid=), ai_profile, profiling, set_goal, share, admin

## Segmented sub-tab snippet (copy this, don't reinvent)
```html
<div class="pad"><div class="ss-segbar" style="margin-bottom:14px">
  <button class="ss-segtab on" type="button"><span class="ss-segpill" aria-hidden="true"></span>Feed</button>
  <button class="ss-segtab" type="button">Communities</button>
</div></div>
```

## Header snippet (page title inside body)
```html
<div class="pad"><h1 style="font:600 var(--m-lg) var(--head);letter-spacing:-.02em;margin-bottom:2px">Events</h1>
<p style="font:500 11.5px var(--body);color:var(--muted);margin-bottom:14px">Meet your run club IRL</p></div>
```

Write valid Jinja2 + HTML. The template must render without error via Flask. Keep pages realistically populated using `seed`.
