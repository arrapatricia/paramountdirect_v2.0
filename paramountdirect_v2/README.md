# Paramount Direct Admin Dashboard — Frontend

React + TypeScript + Vite + Tailwind CSS v4 admin dashboard for Paramount
Direct's four product lines (PD Life, OFW, CTPL, GTP). This is the frontend
half of the project — see the repo root's `DEVELOPER_HANDOVER.md` for the
full picture (architecture notes, backend status, gap analysis against the
BRD, recommended next steps).

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

Login: `admin@paramount.com.ph` / `admin123` (hardcoded in `src/components/login.tsx`).

**The frontend runs entirely on in-memory mock data** (`useState` arrays
seeded in `src/App.tsx`) — it does not call the backend in `../server` yet.
Every list/dashboard/create-application flow reads and writes to local React
state only, so a page refresh resets anything not explicitly persisted
(auth state is the one exception — see below).

## Scripts

```bash
npm run dev              # dev server
npm run build            # production build (outputs to dist/)
npm run preview          # preview a production build locally
npm run test:e2e         # Playwright e2e suite (see e2e/README.md)
npm run test:e2e:ui      # Playwright interactive UI mode
npm run test:e2e:report  # open the last Playwright HTML report
```

## Project layout

```
src/
  App.tsx           top-level state, routing between product lines/tabs,
                     all mock data arrays
  components/       one file per page/feature - see DEVELOPER_HANDOVER.md
                     §3 (Feature Inventory) for the full map
  assets/           logos, backgrounds
e2e/                Playwright suite - see e2e/README.md
```

## Notes for whoever picks this up

- **Auth persistence**: `App.tsx` persists a flag to `localStorage`
  ("Remember me" checked at login) or `sessionStorage` (unchecked) so a
  page refresh doesn't drop the session. Everything else is pure in-memory
  state.
- **Dark mode** is a `.dark` class on `<html>`, toggled by the app (not tied
  to OS preference) — see `index.css`'s `@custom-variant dark`. Tailwind v4
  color-token overrides for dark mode go in a `:root.dark { }` block there,
  not via `@theme` (Tailwind v4 silently ignores `@theme` overrides of
  built-in palette colors — see `DEVELOPER_HANDOVER.md` Change Log for the
  full story). Watch out for apostrophes inside CSS comments in this file —
  they've broken the lightningcss parser before with a silent 500 that
  blocks all further hot-reloads.
- **Premium logic** lives entirely here (`src/components/premium_rates.ts` +
  per-product `*_create_application.tsx` files) — the backend has no
  equivalent endpoint, so rates reset to their seeded defaults on reload.
- A separately built/deployed copy of this frontend exists at
  `pdv2.paramountdirect.com` — that deployment is **not** automatically
  kept in sync with this repo. It needs its own rebuild + redeploy to pick
  up any commit here; check with whoever manages that deployment for how
  it's triggered.
