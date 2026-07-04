# Sprint Society — Local Design Preview (Flask, Node-free)

A server-rendered replica of the whole app, built on the **exact same `ss-base`
design system** as the real React app, so you can click through the *intended*
full redesign on a machine with **no Node.js**.

> This is a **preview/replica for design review** — not the production runtime.
> The real app stays React (`client/`) + Express (`server/`) on `origin/main`.
> Werkzeug's in-memory user store resets on restart (no database needed).

## Run it

```bash
cd audit/preview-app
python -m venv .venv && . .venv/Scripts/activate    # optional but recommended
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000**

**Login** (pre-filled on the form): `ishan@sprintsociety.in` / `runfast`
— or tap *Create an account* to register a fresh user (real password hashing + session).

## What to look at

- **/__pages** — a clickable index of every page + its design status (start here).
- Bottom nav: **Home · AI Coach · Social · Events** + the orange **Run** FAB.
- The **AI Coach** cluster (Chat/Plan/Insights/Zones/Records) mirrors what's already
  live on `main`; everything else shows the *proposed* new design.

## Files

| Path | What |
|------|------|
| `app.py` | Flask routes + session auth + page registry |
| `seed.py` | Realistic sample data (shaped to the real API fields) |
| `templates/base.html` | Shared shell: aurora + chrome + floating glide-pill nav |
| `templates/partials/ui.html` | Crafted SVG icon macros + UI atoms (ZERO emoji) |
| `templates/pages/*.html` | One template per page, on `ss-base` |
| `static/css/ss-base.css` | The locked design system (copied verbatim from `origin/main`) |
| `GAP-REPORT.md` | Every route: old vs new design, and preview coverage |
| `BUILD-GUIDE.md` | Rules used to author the templates |

## Notes / honesty

- **Not React.** This machine has no Node, so the preview is Flask + Jinja that
  *looks* like the redesign. Porting the approved look into the real `.tsx` pages
  (using `components/ss/`) is a separate step, done on the personal laptop.
- Data is mocked; buttons that would hit real business logic are visual.
- Auth is real (register/login/logout, hashed passwords, protected routes).
