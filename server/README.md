# Paramount Direct API

Node.js + TypeScript + Express + Prisma backend for the Paramount Direct admin dashboard, backed by PostgreSQL.

## First-time setup

1. **Database**: this project connects to a real AWS RDS Postgres instance
   (`pdv2-dev` cluster, ap-southeast-1) — you don't need to install Postgres
   locally. Get the connection string from whoever provisions RDS access;
   it goes in `DATABASE_URL` below. (If you do want a fully local instance
   instead, either install Postgres directly or run
   `docker run --name paramountdirect-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=paramountdirect -p 5432:5432 -d postgres:16`
   and point `DATABASE_URL` at that instead.)

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` (see above) and `JWT_SECRET` (any long
   random string). If you're working on the PD Life → iPeak integration,
   also set `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` — see
   `src/services/ipeak/README.md` for what these do and how to get them;
   without them, iPeak calls just log "not configured" and record a failed
   audit row instead of erroring.

3. **Install dependencies** (already done if you're reading this after the initial scaffold):
   ```bash
   npm install
   ```

4. **Run the initial migration** (creates all tables from `prisma/schema.prisma`):
   ```bash
   npm run prisma:migrate -- --name init
   ```

5. **Seed sample data** (creates an admin user, a branch, a role, and a handful of sample applications per product line):
   ```bash
   npm run seed
   ```
   This creates the same login used by the frontend's mock auth: `admin@paramount.com.ph` / `admin123`.

6. **Start the dev server**:
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:4000` (configurable via `PORT` in `.env`). `GET /health` is a quick liveness check.

## Maintenance scripts

```bash
npm run db:trim-applications              # dry run - lists what would be deleted
npx tsx prisma/trimApplications.ts --confirm   # actually deletes (see note below)
```
Trims each product line's application table down to its 5 most recent rows.
On Windows/PowerShell, `npm run <script> -- --confirm` can fail to forward
the flag through `npm.cmd` (`Unknown cli flag: --confirm`) - if that
happens, call the script directly with `npx tsx` as shown above instead of
going through `npm run`.

## Project layout

```
server/
  prisma/
    schema.prisma     - full data model (Users, Roles, Branches, one model per
                         product line's applications, Payments, Audit Logs)
    seed.ts            - dev seed data
    trimApplications.ts - trims each application table to its 5 most recent rows
  src/
    routes/            - one Express router per resource, mounted in app.ts
    middleware/
      auth.ts           - requireAuth (JWT) and requireProduct (product-line scoping)
      errorHandler.ts   - asyncHandler + centralized error responses
    services/
      ipeak/            - PD Life -> iPeak (LEAP Services) integration, see its own README
    utils/
      jwt.ts, password.ts, audit.ts
    lib/prisma.ts       - shared PrismaClient instance
    app.ts               - Express app + route mounting
    index.ts             - entry point
```

## API overview

All routes except `POST /api/auth/login` require `Authorization: Bearer <token>` (obtained from login).

| Resource | Base path |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Users | `/api/users` |
| Roles | `/api/roles` |
| Branches | `/api/branches` |
| PD Life applications | `/api/applications/pd-life` (+ `PATCH /:id/status`) |
| OFW applications | `/api/applications/ofw` |
| CTPL applications | `/api/applications/ctpl` |
| GTP applications | `/api/applications/gtp` |
| Payments | `/api/payments` |
| Audit logs | `/api/audit-logs` (read-only) |
| Website ingest (server-to-server, `X-Api-Key`, not `Authorization`) | `POST /api/ingest/pd-life`, `/api/ingest/ofw`, `/api/ingest/ctpl`, `/api/ingest/gtp` |

Every list endpoint returns newest-first and accepts a `?status=` filter where applicable; every create/update/delete on a mutable resource writes an audit-log row automatically.

The four ingest routes are how each public product website pushes a newly
submitted application here without anyone re-keying it: paramountdirect.com,
ofwinsurance.ph, ctpl.ph and yourtravelinsurance.ph each call their route
right after saving an application on their own end. They're authenticated by
`WEBSITE_INGEST_API_KEY` (see `.env.example`) rather than a login token,
since there's no logged-in user on the website's side.

## Not yet built

This first pass covers the core transactional data (auth, users/roles, branches, all four product lines' applications, payments, audit logs). Not covered yet, since they're more reporting/read-heavy and can be layered on once the frontend is wired up to real data: Marketing Dashboard analytics, Product Enrollment/CMS content. PD Life is wired to real data (`App.tsx` calls `pdLifeApi`); OFW/CTPL/GTP still run on in-memory mock arrays in `App.tsx` - wiring those to `/api/applications/{ofw,ctpl,gtp}` the same way is a separate follow-up task.
