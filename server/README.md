# Paramount Direct API

Node.js + TypeScript + Express + Prisma backend for the Paramount Direct admin dashboard, backed by PostgreSQL.

## First-time setup

1. **Install PostgreSQL locally** (not currently installed on this machine). Easiest options on Windows:
   - Download the installer from https://www.postgresql.org/download/windows/ and install with default settings (remember the password you set for the `postgres` user).
   - Or install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and run Postgres in a container instead - no local Postgres install needed:
     ```bash
     docker run --name paramountdirect-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=paramountdirect -p 5432:5432 -d postgres:16
     ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` to match your Postgres install (the default in `.env.example` matches the Docker command above), and set `JWT_SECRET` to any long random string.

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

## Project layout

```
server/
  prisma/
    schema.prisma     - full data model (Users, Roles, Branches, one model per
                         product line's applications, Payments, Audit Logs)
    seed.ts            - dev seed data
  src/
    routes/            - one Express router per resource, mounted in app.ts
    middleware/
      auth.ts           - requireAuth (JWT) and requireProduct (product-line scoping)
      errorHandler.ts   - asyncHandler + centralized error responses
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

Every list endpoint returns newest-first and accepts a `?status=` filter where applicable; every create/update/delete on a mutable resource writes an audit-log row automatically.

## Not yet built

This first pass covers the core transactional data (auth, users/roles, branches, all four product lines' applications, payments, audit logs). Not covered yet, since they're more reporting/read-heavy and can be layered on once the frontend is wired up to real data: Marketing Dashboard analytics, Product Enrollment/CMS content. The frontend still runs entirely on its own in-memory mock data - connecting it to this API (replacing the `useState` mock arrays in `App.tsx` with real `fetch` calls) is a separate follow-up task.
