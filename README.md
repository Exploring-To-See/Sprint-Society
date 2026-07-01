# Sprint Society — Frontend (for design enhancement)

This branch contains **only the React frontend** of Sprint Society, extracted for
design review and enhancement. **No backend code** (`server/`, `api/`) is included.

## Structure
- `client/` — the React 18 + Vite + TypeScript + Tailwind app (all pages, components, styles)
- `shared/` — TypeScript types + client-side coaching logic that `client/` imports

## Run locally
```bash
cd client
npm install
npm run dev        # Vite dev server → http://localhost:5173
```
> The app calls a backend API at `/api` (set `VITE_API_URL` to point elsewhere).
> Since the backend is not in this branch, API calls will fail locally — that's
> expected. This branch is for **UI/design work**, not full-stack runtime.

## Design system
The locked design language lives in the app (Tailwind config + the `ss/` component
kit + `ss-base.css`). Match it when enhancing — liquid-glass surfaces, one accent
(orange), violet = AI, mono tabular numerals, zero emoji (crafted SVG icons only).
