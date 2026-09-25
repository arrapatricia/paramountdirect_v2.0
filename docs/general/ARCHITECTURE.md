# System Architecture

## Overview diagram

```
                    ┌─────────────────────────────────────────────┐
                    │              Browser (staff user)             │
                    └───────────────────────┬─────────────────────┘
                                            │ HTTPS
                                            ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  Nginx (:443)                                                             │
│    /            → PM2 static frontend (127.0.0.1:3000, compiled dist/)   │
│    /api/*        → PM2 Express API (127.0.0.1:4000)                      │
│    /health       → API liveness                                          │
└───────────────────────────────┬───────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌───────────────────────┐   ┌───────────────────────────────┐
        │ Frontend (React/Vite) │   │ Backend (Express/TS)          │
        │ App.tsx: top-level     │   │ one router per resource       │
        │ state + URL sync       │   │ (routes/applications.*.ts,    │
        │ (no router library)    │   │  routes/ingest.*.ts, ...)     │
        └───────────┬───────────┘   └──────────────┬─────────────────┘
                    │ fetch()                        │ Prisma
                    │ /api/applications/{product}     ▼
                    │ /api/auth/*, /api/audit-logs   ┌─────────────────┐
                    │ /api/users, /api/roles         │ PostgreSQL (RDS) │
                    └────────────────────────────────►                 │
                                                      └─────────────────┘

External integrations:
  paramountdirect.com ──POST /api/ingest/pd-life──► backend (live)
  ofwinsurance.ph / ctpl.ph / yourtravelinsurance.ph ──POST /api/ingest/{ofw,ctpl,gtp}──► backend (built, not yet called by those sites)
  backend ──outbound only, PD Life──► iPeak / LEAP Services (AS400, UAT)
  backend (CTPL doc-fill, OFW Service Invoice) ──► S3 (private bucket, generated PDFs)
```

## Frontend

- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS v4.
- **State holder:** `App.tsx` is the single top-level component holding all cross-page state — `activeProduct`, `activeTab`, `activeSubTab`, per-product application arrays (`screeningData`, `ofwApplications`, `ctplApplications`, `gtpApplications`), per-product "connected" flags (`pdLifeConnected`, `ofwConnected`, `ctplConnected`, `gtpConnected`), auth state (`isAuthenticated`, `currentUserRole`, `currentUserName`/`Email`), and dark mode. There is no separate global-state library (no Redux/Zustand/Context tree for this) — it is one large component tree fed by `useState`/`useEffect`, passed down via props.
- **No router library.** `paramountdirect_v2/src/lib/routes.ts` defines a `TAB_PATHS` map (tab id → URL path) and `buildPath`/`parsePath` functions. `App.tsx` calls the History API (`pushState`) when nav state changes, and reads `window.location.pathname` via `parsePath` on load/back-forward to reconstruct `{product, tab, subTab, recordId}`. This is why refreshing on `/ctpl/applications/cm123...` lands back on the right detail view instead of resetting to the dashboard.
- **API layer:** `lib/api.ts` holds `fetch` wrappers per resource (`applicationApi`, `auditLogApi`, `authApi`, etc.) plus the type-mapping functions that convert backend JSON shapes (dates as ISO strings, enum casing) into the frontend's own `*_types.ts` shapes.
- **Component layout:** one file per page/feature under `src/components/`. Shared UI kits (e.g. `application_detail_ui.tsx` for PD Life's three category detail pages) are factored out so multiple pages stay visually and behaviorally consistent.

## Backend

- **Stack:** Node.js + Express + TypeScript, one Express router per resource under `server/src/routes/` (`applications.pdlife.ts`, `applications.ofw.ts`, `applications.ctpl.ts`, `applications.gtp.ts`, `ingest.*.ts`, `auth.ts`, `users.ts`, `roles.ts`, `auditLogs.ts`, `documents.ts`, `payments.nonlife.ts`, etc.).
- **ORM/DB:** Prisma against PostgreSQL. `server/prisma/schema.prisma` is the schema source of truth; `DATABASE_SCHEMA.md` documents it field-by-field. Every table is `@@map`ped to a snake_case plural Postgres name.
- **Middleware:** `middleware/auth.ts` (JWT verification), `middleware/errorHandler.ts` (centralized error responses).
- **Services:** `services/ipeak/` (PD Life's outbound iPeak client — see `docs/life/HANDOVER.md`), `services/ctplDocumentFill.ts` / `ofwDocumentFill.ts` (PDF template fill via `pdf-lib`), `services/documentStorage.ts` (S3 upload + presigned URL retrieval), `services/invoiceNumbering.ts` (the shared OFW/CTPL/GTP invoice sequence), `utils/audit.ts` (writes an `AuditLog` row for every create/update/delete).

## Data flow

1. Staff user's browser loads the compiled frontend from Nginx (`/`).
2. On login, the frontend posts credentials to `/api/auth/login`; the backend verifies the bcrypt hash and returns a JWT.
3. The frontend stores the JWT and attaches it as `Authorization: Bearer <token>` on every subsequent call.
4. Each product page fetches its applications via `GET /api/applications/{pd-life,ofw,ctpl,gtp}`; creating or updating an application (from a create-application wizard, or an in-list action like "mark paid") calls the matching `POST`/`PUT`/`PATCH` route.
5. Each backend route handler validates the payload (zod schemas), writes through Prisma to Postgres, and writes an `AuditLog` row via `utils/audit.ts`.
6. The frontend's Audit Logs page (`audit_logs.tsx`) reads that same table back via `GET /api/audit-logs`.

## Website-ingest webhook pattern

Each product has its own inbound webhook, `POST /api/ingest/{pd-life,ofw,ctpl,gtp}` (`server/src/routes/ingest.*.ts`), authenticated by a single shared secret (`WEBSITE_INGEST_API_KEY`) rather than per-site keys. This lets each product's public marketing site push a submitted application directly into the admin dashboard's database without a staff member re-keying it from an email or spreadsheet. `paramountdirect.com`'s call into `ingest.pdlife.ts` is live; the CTPL/OFW/GTP routes exist and are tested but ctpl.ph / ofwinsurance.ph / yourtravelinsurance.ph have not yet been updated to call them.

## iPeak outbound integration (PD Life only)

`server/src/services/ipeak/` sends PD Life applications to the real LEAP Services (iPeak/AS400) API on status change (Insert New Business, Update Status) — outbound only, verified against the UAT environment. If `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` are unset, the service logs "not configured" and persists a failed `PdLifeIpeakRequest` row instead of throwing, so a missing integration never blocks a screener's status update. See `docs/life/HANDOVER.md` for the request/response shape and retry behavior. OFW/CTPL/GTP have no iPeak connection.

## Document generation pipeline (CTPL is the reference implementation)

The moment a CTPL application's `isPaid` first flips true, the server fills two fillable PDF AcroForm templates (`server/src/templates/ctpl/*.pdf`) via `pdf-lib` with the application's data and the reconciled premium tax breakdown, uploads each to a private S3 bucket, and records one immutable `GeneratedDocument` row per file. OFW's Service Invoice follows the same pattern with its own tax formula. OFW's Certificate of Insurance and all of GTP's documents still use the older mock-template render (no real fillable templates on hand yet for those). See `docs/ctpl/HANDOVER.md` and `docs/ofw/HANDOVER.md` for the field-mapping and tax-formula internals.

## Audit logging flow

Every create/update/delete across every resource route calls into `utils/audit.ts`, which writes a row to `AuditLog` (`userId`, `userLabel`, `role`, `action`, `module`, `details`, `ipAddress`, `timestamp`). `userLabel` is denormalized (kept even if the user account is later deleted) so historical log entries stay readable.

## Deployment

See `DEPLOYMENT.md` for the authoritative, step-by-step guide; summarized here:

- **Target:** Ubuntu 26.04 server at `pd2-dev.paramount.com.ph`.
- **Process manager:** PM2 runs two processes — a static-file server for the compiled frontend `dist/` on `127.0.0.1:3000` (SPA fallback, not the Vite dev/preview server), and the compiled Express API on `127.0.0.1:4000`.
- **Reverse proxy:** Nginx terminates TLS (Certbot-issued cert) on :443, proxies `/` to the frontend process, `/api/*` and `/health` to the API process.
- **Database:** managed AWS RDS Postgres — no local Postgres install on the app server. The app server needs outbound TCP 5432 access to RDS via the RDS security group.
- **Migrations:** `npx prisma migrate deploy` only — never `migrate dev`, `migrate reset`, or `db push` in this environment, and never run `npm run seed` against it.
- **Updates:** `deploy.sh` (repo root) implements the update flow — pulls `origin/pdv2_dev` (fast-forward only), installs, builds both apps, applies pending migrations, restarts both PM2 processes, health-checks, and saves the PM2 process list. It never seeds data or overwrites `server/.env`.
- **CI/CD:** `.github/workflows/deploy-pd2-dev.yml` SSHes into the server and runs `deploy.sh` — currently gated behind a `workflow_dispatch` manual trigger only (the automatic push trigger is commented out) because the required repo secrets (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, optional `DEPLOY_SSH_PORT`/`DEPLOY_PROJECT_DIR`) are not yet configured. Every automatic run would otherwise fail at the SSH step.
- **Current limitation as of the last deployment guide review:** hosting the frontend does not by itself connect its screens to Postgres — that requires the frontend↔backend wiring described in §2 of `DEVELOPER_HANDOVER.md`, which is now real for all four products, but should be re-verified against whatever build is actually live at `pd2-dev.paramount.com.ph` (deployment and repo state can drift independently — see `DEPLOYMENT.md`'s troubleshooting section).
