# Paramount Direct Admin Dashboard — General Developer Handover

**Prepared:** 2026-09-15 · **Last updated:** 2026-09-25
**Scope of this document:** cross-product/shared concerns only — tech stack, repo layout, shared architecture, shared infra (auth, audit logs, roles/permissions, premium maintenance framework, branch directory, marketing dashboard, CMS status), the data-model cross-reference, credentials/environments, and next steps. Product-specific deep detail (exact rate formulas, document-fill pipeline internals, iPeak integration internals, etc.) now lives in each product's own handover:

- `docs/life/HANDOVER.md` — PD Life
- `docs/ofw/HANDOVER.md` — OFW
- `docs/ctpl/HANDOVER.md` — CTPL
- `docs/gtp/HANDOVER.md` — GTP

Also see the other general docs written alongside this one:

- `docs/general/SITEMAP.md` — full page/route inventory
- `docs/general/PRD.md` — product requirements synthesized from built behavior
- `docs/general/DESIGN_SYSTEM.md` — design tokens, dark mode, component patterns
- `docs/general/ARCHITECTURE.md` — system architecture, data flow, diagram
- `docs/general/MANUAL.md` — end-user/staff manual

Reference documents this handover cross-maps against:
- *Paramount Direct System: Gap Analysis*
- *BRD: PD System Enhancement* (Business Requirements, System Batch Process, Implementation Plan, Migration Phasing Plan, UI of PD 2, Test Plan – Phase 1)

**Note:** a per-change history used to live here as a long Change Log; it grew too large for developers to realistically read and was removed. Git history (`git log`) is the source of truth for what changed and when. The sections below reflect current state, not a chronological record.

---

## 1. What This Is

A working **frontend** for the Paramount Direct admin dashboard, covering PD Life, OFW, CTPL, and GTP, backed by a **real Express/Prisma/Postgres backend** — not just a mock-data prototype anymore. It was built to validate workflows, UI/UX, and premium logic ahead of the real PD System 2.0 / iPeak integration described in the BRD, and has since been wired end-to-end for all four product lines.

`App.tsx` fetches each product's applications from its real `/api/applications/{pd-life,ofw,ctpl,gtp}` route once a real backend session exists, and creating/updating an application (from the create-application wizard or an in-list action like "mark paid") posts to that same backend rather than only touching local React state. Each product also has a paired website-ingest webhook (`POST /api/ingest/{pd-life,ofw,ctpl,gtp}`, shared-secret auth via `WEBSITE_INGEST_API_KEY`) so the public site can push a submitted application in without anyone re-keying it — paramountdirect.com's is live; ofwinsurance.ph/ctpl.ph/yourtravelinsurance.ph's are built and ready but that outbound call hasn't been added on those three sites yet (see `server/README.md`'s API overview section).

The backend **does** talk to iPeak for one flow — PD Life applications are transmitted to the real LEAP Services (iPeak/AS400) API on status change, verified live against UAT — but this is still a single outbound integration, not the full policy-lifecycle/payment/cash-value sync the BRD describes, and OFW/CTPL/GTP have no iPeak connection at all yet. See `docs/life/HANDOVER.md` for the integration's internals.

Every table in the schema is `@@map`ped to a snake_case plural Postgres name (migration `20260925080000_rename_tables_snake_case`; e.g. `OfwApplication` → `ofw_applications`). Prisma model names in code are unchanged, but raw SQL must use the table name. See `DATABASE_SCHEMA.md` for the full field-by-field reference.

**Document generation** is real for CTPL (Certificate of Cover + Service Invoice, via `pdf-lib`-filled AcroForm templates uploaded to S3, one immutable `GeneratedDocument` row per file) and for OFW's Service Invoice. OFW's Certificate of Insurance and all of GTP's documents are still the older mock-template render pending real fillable templates. Invoice numbering (`6000000XXXXXX` series) is **shared across OFW/CTPL/GTP by design** — see the memory note "Shared non-life invoice numbering" — not a per-product sequence, since all three use the same invoice series/template in the real business process. See `docs/ctpl/HANDOVER.md` and `docs/ofw/HANDOVER.md` for the document-fill pipeline internals and tax-breakdown formulas.

### 1.1 Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL, via Prisma ORM |
| Auth | JWT (jsonwebtoken) + bcrypt password hashing |

### 1.2 Repository layout

```
paramountdirect_v2/              (git repo root)
  paramountdirect_v2/             ← frontend (Vite project root)
    src/
      App.tsx                     top-level state, routing between tabs/product lines
      components/                 one file per page/feature (see §3)
      lib/routes.ts                tab/product/sub-tab <-> real URL path (e.g. /application-inquiry), synced via History API in App.tsx (no router library)
      lib/roles.ts                 role catalog, product scoping, module permission templates
      lib/brand.ts                 per-product-line brand theme tokens
      lib/api.ts                   fetch wrappers + frontend<->backend type mapping
      assets/
  server/                         ← backend (independent Node project)
    prisma/
      schema.prisma                data model
      migrations/
      seed.ts
    src/
      routes/                      one Express router per resource
      middleware/                  auth.ts, errorHandler.ts
      utils/                       jwt.ts, password.ts, audit.ts
      services/                    ipeak/, documentStorage.ts, *DocumentFill.ts, invoiceNumbering.ts
      lib/prisma.ts
      app.ts, index.ts
    README.md                      backend setup instructions
  docs/
    general/                       this doc's companion general docs (SITEMAP, PRD, DESIGN_SYSTEM, ARCHITECTURE, MANUAL)
    life/ ofw/ ctpl/ gtp/          per-product handovers and manuals
  DATABASE_SCHEMA.md                full schema reference
  DEPLOYMENT.md                     Ubuntu/PM2/Nginx deployment guide
```

### 1.3 Running it locally

**Frontend:**
```bash
cd paramountdirect_v2
npm install
npm run dev        # http://localhost:5173
```
Mock login fallback: `admin@paramount.com.ph` / `admin123` (in `login.tsx`, used when the backend is unreachable). When a real backend session exists, the frontend authenticates against it instead (§2).

**Backend** (see `server/README.md` for full detail):
```bash
cd server
npm install
cp .env.example .env       # set DATABASE_URL, JWT_SECRET
npm run prisma:migrate -- --name init
npm run seed                # creates admin@paramount.com.ph / admin123 + sample rows
npm run dev                 # http://localhost:4000
```
Connects to a real RDS Postgres instance (dev cluster) rather than requiring a local install — see `server/README.md`. **Do not run `npm run seed` against a shared/real database** — it deletes existing application rows and resets a demo user's password (see the memory note "Never shadow-DB a real DB" and `DEPLOYMENT.md`'s warning).

---

## 2. Architecture Notes for Whoever Picks This Up

- **Frontend↔backend wiring is real, product by product.** Each product line has its own "connected" flag in `App.tsx` (`pdLifeConnected`, `ofwConnected`, `ctplConnected`, `gtpConnected`) — the frontend fetches from `/api/applications/{product}` and falls back to local mock arrays only when the backend call fails or no session exists yet. Auth follows the same pattern: a real login posts to `/api/auth/login`, stores the returned JWT, and sends it as `Authorization: Bearer <token>` on subsequent calls; the hardcoded mock credential check in `login.tsx` remains as an offline/demo fallback. See `docs/general/ARCHITECTURE.md` for the full data-flow diagram.
- **Premium logic lives entirely in the frontend** (`src/components/premium_rates.ts` + per-product `*_create_application.tsx` files), backed by a `Premium Maintenance` admin page. The backend has no equivalent endpoint yet — rates are not persisted server-side. This directly addresses the Gap Analysis's "Premium Maintenance – GTP, OFW, CTPL" item (see §5) on the frontend, but that logic needs to move server-side before go-live, since right now anyone reloading the page resets rates to their seeded defaults. Per-product rate-card specifics (OFW's $/day formula, CTPL's Policy Type × MV Type table, GTP's day-bracket card) are documented in each product's own handover.
- **Dark mode** is implemented via a `.dark` class on `<html>` (see `index.css`'s `@custom-variant dark`) — Tailwind v4 defaults to OS-preference dark mode, which was repointed at the app's own toggle. See `docs/general/DESIGN_SYSTEM.md` for the full token/theming writeup.
- **Audit Logs** (`audit_logs.tsx`) is wired into navigation (`sidebar.tsx`, `App.tsx`'s `activeTab === 'audit'` branch) and reads live from `GET /api/audit-logs` via `auditLogApi` in `lib/api.ts`, with client-side search/module filtering and CSV export. The backend's audit log table and read API write a row on every create/update/delete.
- **iPeak (LEAP Services) integration** lives entirely in `server/src/services/ipeak/` and is PD-Life-only. See `docs/life/HANDOVER.md` for the request/response flow, environment variables, and fallback behavior when unconfigured.
- **Maintenance is product-branded.** Maintenance and its sub-pages re-skin to the selected product line via `src/lib/brand.ts`: PD Life uses red (`#d0112b`), OFW/CTPL/GTP use the Non-Life navy (`#002f6c`) and light blue (`#49b1ea`). `/maintenance/*` URLs carry no product, so a reload keeps the previously selected product (`resolveInitialNav` in `App.tsx`).
- **CMS (Website Content)** was explicitly parked per stakeholder direction during this engagement — a placeholder nav entry exists (`sidebar.tsx` → Maintenance → "CMS (Website Content)") but no page was built. This matches the Gap Analysis's "Website Content Management (No CMS)" gap (§5) — it is **not started**, not partially done.
- **Roles and permissions** are centralized in `lib/roles.ts` (frontend) and the `Role`/`RolePermission` tables (backend) — an 11-role catalog (System Admin; DM Operations/DM POS/DM Marketing/Contact Center; Life Cashier/Non-Life Cashier/Cashier Admin; CTPL/GTP/OFW Admin; Non-Life Admin/Non-Life Issuer). A user's product access is *derived* from their role (`productsForRole`), not picked independently. See §4 and `docs/general/PRD.md` for the full role table.
- **Branch Directory** (`branch_directory.tsx`) is mock CRUD, seeded with the 18 real branches on ofwinsurance.ph/ofw-branches. It has a "Branch Locator" view (region picker + expandable regions) mirroring that page, the default for OFW/CTPL/GTP; PD Life defaults to Grid Cards.
- **Marketing Dashboard** (`marketing_dashboard.tsx`) shows GA/source/drop-off stats zeroed (no mock analytics wired to a real GA source yet); it switches between paramountdirect.com's and ofwinsurance.ph's pages/form-sections depending on the selected product.
- **Inline review over modals.** Per explicit stakeholder feedback during this engagement, confirmation/review steps use inline expand-in-place UI (e.g. the Review step before Confirm & Submit in every create-application wizard) rather than disruptive modal dialogs, except where a modal genuinely gates an irreversible action (`IssueConfirmModal` for marking an application Issued).

---

## 3. Feature Inventory (Shared / Cross-Cutting)

| Area | Component(s) | Notes |
|---|---|---|
| Auth | `login.tsx`, `forgot_password.tsx` | Real login against `/api/auth/login` with a mock-credential offline fallback; dark-mode aware |
| Premium Maintenance | `premium_maintenance.tsx`, `premium_rates.ts` | Centralizes what used to be hardcoded per-product rate constants into one editable table; not yet persisted server-side (§2) |
| Users & Role Management | `user_role_management.tsx` (merged Users + Role Access Matrix into one page/tabs), role catalog shared from `lib/roles.ts` | **System Admin only** — sidebar entry and the page itself are gated on `currentUserRole === 'System Admin'`. Wired to the real `/api/users` + `/api/roles` backend (falls back to a local mock when unauthenticated/unreachable) — `server/prisma/seed.ts` seeds one demo account per role (password `admin123`) for demoing without live provisioning. `canCreatePayments(role, product)` in `lib/roles.ts` centralizes the "who can record a payment" check used by every product's Payment Transactions page. |
| Branch Directory | `branch_directory.tsx` | Mock CRUD, seeded with the 18 ofwinsurance.ph branches; Branch Locator view for OFW/CTPL/GTP, Grid Cards default for PD Life |
| Marketing Dashboard | `marketing_dashboard.tsx` | GA/source/drop-off stats zeroed; per-product page/section switching |
| Audit Logs | `audit_logs.tsx` (frontend, wired) / `auditLogs.ts` (backend, wired) | See §2 |
| Dark mode & responsive | `index.css`, all components | Applied app-wide, see `docs/general/DESIGN_SYSTEM.md` |

Per-product feature inventories (Applications, Dashboard, Create Application, Payments, Statistics pages, document generation) live in each product's own handover (`docs/{life,ofw,ctpl,gtp}/HANDOVER.md`).

---

## 4. Data Model Cross-Reference (Frontend ↔ Backend Prisma schema)

| Frontend type (`src/components/*_types.ts`, `App.tsx`) | Backend model (`server/prisma/schema.prisma`) | Aligned? |
|---|---|---|
| `ScreeningItem` / `PdLifeApplication` | `PdLifeApplication` | Yes — backend adds `planCategory` enum + `details` JSON for category-specific fields. `policyNumber` is `@unique` and is the FK target for `PaymentTransaction.policyNo`. |
| `OfwApplication` | `OfwApplication` | Yes, field-for-field — including `policyNumber`/`referenceNo` and the real FK back-relation `paymentTransactions` |
| `CtplApplication` | `CtplApplication` | Yes, field-for-field — including `policyNumber`/`referenceNo`, the real FK back-relation `paymentTransactions`, and the vehicle description + `effectiveDate`/`expiryDate` fields added for document generation (see `docs/ctpl/HANDOVER.md`) |
| `GtpApplication` | `GtpApplication` | Yes, field-for-field — including `policyNumber`/`referenceNo` and the real FK back-relation `paymentTransactions` |
| `UserAccount` | `User` + `Role` | Yes |
| `ModulePermission` | `RolePermission` | Yes |
| `Branch` | `Branch` | Yes |
| `PaymentTransaction` / `PaymentLedgerItem` | `PaymentTransaction` / `PaymentLedgerItem` | Yes — backend's `PolicyStatus` enum (`Inforced/Lapsed/Terminated/Matured/Involuntary/Voluntary/Surrender`) already matches the BRD's "Policy Status" table (System Batch Process tab) almost exactly. `PaymentTransaction.policyNo` is a real FK into `PdLifeApplication.policyNumber` (`ON DELETE RESTRICT`). |
| `NonLifePaymentTransaction` rows in `nonlife_payment_transactions.tsx` (currently local component state only, not a named frontend type) | `NonLifePaymentTransaction` | Partial — the backend model is the non-life equivalent of `PaymentTransaction`, with real nullable FKs (`ctplApplicationId`/`ofwApplicationId`/`gtpApplicationId`) into whichever of the three application tables it belongs to, plus a `product` enum. Route `payments.nonlife.ts` (`/api/payments-nonlife`) exists, but nothing on the frontend calls it yet — a cashier's manually-created row still only lives in that component's session state. |
| *(none — new)* | `AuditLog` | Frontend and backend both wired (§2) |
| *(none)* | *(none)* | **Premium rate tables — not in backend yet** (§2) |
| *(none — backend-only)* | `PdLifeBeneficiary`, `PdLifeIpeakRequest` | For the iPeak integration (`docs/life/HANDOVER.md`) — beneficiaries promoted out of `PdLifeApplication.details` JSON into a real relation; `PdLifeIpeakRequest` is the per-call audit/retry trail. No frontend equivalent yet. |
| *(none yet — backend-only)* | `GeneratedDocument` | Backs CTPL's (and OFW's Service Invoice) real document generation — one immutable row per generated PDF (`applicationType`/`applicationId`/`docKey`/`s3Key`/`invoiceNumber`/`generatedAt`/`generatedBy`). `applicationId` is deliberately not a DB-level FK (same polymorphic-association problem as `NonLifePaymentTransaction`, resolved in application code via `applicationType` instead). CTPL now generates all 4 real documents at issuance (`ctplDocumentFill.ts`, templates fetched from the legacy `plgic/ctpl` repo): COC and Service Invoice are per-application fillable forms; Policy Schedule is also fillable; Policy Jacket is a static per-policy-type T&Cs booklet (picked by the same P/M/C/L prefix as the policy number, `ctplPolicyPrefix()`) with no per-application fields, so it's just returned as-is. All fillable PDFs are flattened (`form.flatten()`) before storage so recipients can't edit them. Download/print filenames follow `{docKey label}-{plateNumber}.pdf` (e.g. `coc-XYZ5678.pdf`), built in `documents.ts`'s `DOC_KEY_FILENAME_LABEL` map. |

**Non-life FK note:** `CtplApplication`, `OfwApplication`, and `GtpApplication` each live in their own table with no shared parent, so a single relation column can't point at "whichever of the three this is." `NonLifePaymentTransaction` solves this the standard Prisma way for polymorphic associations — three nullable FK columns, only one populated per row, matching its `product` enum (enforced in `payments.nonlife.ts`'s zod schema, not by the DB itself). `policyNumber`/`referenceNo` on the three application models remain plain optional `@unique` columns (not FKs) — they're duplicated onto `NonLifePaymentTransaction` rows too, since that's the natural lookup key a cashier searches by, independent of whether the FK happens to be set.

**Status/enum gaps to note against the BRD's System Batch Process tab:**
- The BRD's **Application Status** list (Received, For Verification, For Evaluation, Duplicate, Denied, Withdrawn, Issued, Cancelled) is broader than what's implemented. The prototype's `PdLifeStatus` only has `Received | For_Verification | For_Evaluation | Paid | Issued` (per explicit stakeholder direction during this engagement to keep PD Life "as-is"). **Duplicate, Denied, and Withdrawn are not modeled anywhere in PD Life.** OFW and CTPL do have `Duplicate` (and CTPL also distinguishes `Spoiled`/`Reversed`/`Cancelled`), so this gap is PD-Life-specific.
- The BRD's **Payment Status** list (Paid, Underpaid, Unpaid, Reversed) has no dedicated enum anywhere in the prototype — `PaymentTransaction.policyStatus` covers policy lifecycle, not payment status per installment. `PaymentLedgerItem.status` is a free-text string today, not tied to this enum.

See `DATABASE_SCHEMA.md` for the complete field-by-field schema reference and ER diagram.

---

## 5. Gap Analysis Cross-Map (Overview)

Legend: 🟢 Covered · 🟡 Partially addressed (UI exists, not backed by real integration) · 🔴 Not started

This is a cross-product overview only — deep per-product gap notes (line-by-line Gap Analysis items with implementation notes) now live in each product's own handover under a "Gap Analysis" section.

| Gap Analysis item | Product(s) | Status | Notes |
|---|---|---|---|
| Data Reliability (migrated data has inconsistencies) | PD Life | 🔴 | Out of scope — no data migration was performed |
| Policy Maintenance (no structured module) | PD Life | 🔴 | No policy-maintenance workflow exists anywhere in the app |
| System Integration (no real-time iPeak sync) | PD Life | 🟡 | Outbound-only, PD Life only — see `docs/life/HANDOVER.md` |
| Payment Logging | PD Life, OFW, CTPL, GTP | 🟡 | Ledger/transaction models exist and are audit-logged; no real payment gateway to log against |
| SI/OR/COC Issuance | PD Life / OFW / CTPL / GTP | 🔴 (PD Life) / 🟡 (OFW) / 🟢 (CTPL) / 🔴 (GTP) | See each product's handover for its document-generation status |
| Reports / Production Reporting | All | 🔴 | No reporting/export module for any product |
| UI / UX | All | 🟢 | Full redesign done: dark mode, mobile-responsive, consistent card/table patterns, per-product branding |
| Audit Logs | All | 🟢 | Backend logs every write with user/action/module/timestamp/IP; frontend viewer wired with search/filter/CSV export |
| User Experience (streamlined navigation, three-click rule) | All | 🟢 | Sidebar reorganized per product line |
| Premium Maintenance – GTP, OFW, CTPL | OFW, CTPL, GTP | 🟢 | The Gap Analysis item most directly and fully addressed by this engagement — see `premium_maintenance.tsx`, though it isn't backend-persisted yet (§2) |
| Website Content Management (No CMS) | All | 🔴 | Explicitly parked per stakeholder direction; nav placeholder only |
| No Version Control / Content Audit Trail | All | 🔴 | Depends on CMS existing first |
| Vehicle/Client Master Data Integrity | CTPL | 🟡 | See `docs/ctpl/HANDOVER.md` |
| Payment Tracking / Renewal Process | OFW | 🔴 | See `docs/ofw/HANDOVER.md` |

---

## 6. BRD Cross-Map (Overview)

### 6.1 Project Objectives

| Objective | Status | Notes |
|---|---|---|
| Automate repetitive manual tasks | 🟡 | Premium computation is now automatic (was manual/hardcoded); application status changes still require manual screening action (by design — no auto-decisioning was requested) |
| Streamline navigation, "three-click rule" | 🟢 | Sidebar restructured around product-line pills; every page reachable in ≤ 3 clicks from login |
| Eliminate constant manual monitoring via self-validating outputs | 🔴 | No exception-based notification system exists |
| Minimize data-entry risk / processing mistakes | 🟢 | Required-field validation, the mandatory Review step before submission, and placeholder-driven "premium = 0.00 until real inputs exist" behavior all reduce silent bad-data submission |
| Handle increased volume without proportional manual effort | 🟡 | Real backend persistence now exists for all four products, but no real production data volume has been run through it yet |

### 6.2 Functional Requirements (Non-Life & Other Products)

| Requirement | Status | Notes |
|---|---|---|
| A.a — Landing page shows graphs/summary per product | 🟢 | `dashboard.tsx` + each product's own dashboard |
| A.b — Single View dashboard of all active operations | 🟡 | Each product has its own dashboard; no single cross-product landing view showing all four at once |
| A.c — Three-click rule | 🟢 | See above |
| B.a — Automatic data validation against business rules | 🟢 | Per-field `required`, cross-field rules (e.g., OFW's 6-month minimum, CTPL's plate/chassis format hints, GTP's Schengen auto-detection — see each product's handover) |
| B.b — Automated status reports | 🔴 | Not built |
| B.c — Exception flagging / notify only when necessary | 🔴 | Not built |

### 6.3 Non-Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| Usability | 🟢 | Consistent design system, dark mode, mobile-responsive, inline review/confirmation instead of disruptive modals |
| Reliability (99.9% automated-output accuracy) | 🟡 | Premium calculations are verified against real rate cards (high confidence), but there's no automated output at the scale this NFR implies (no live transactions) |
| Performance (background processing, responsive UI) | N/A | No long-running background processes exist yet to evaluate against |

### 6.4 PD Life / iPeak Migration, 6.5 System Batch Process, 6.6 Implementation Plan, 6.7 UI of PD 2, 6.8 Test Plan

See `docs/life/HANDOVER.md` for the iPeak/AS400/Paynamics migration cross-map (6.4) in full depth. §4 above covers the status-enum alignment (6.5). This prototype implements the application-submission and premium-computation front half of the Implementation Plan's Track A/B steps 1–3 for all four product lines (6.6), using mock/seed data for the downstream integrations (steps 4 onward) rather than corresponding to a specific milestone. The BRD's major-screens list (6.7) — Login, Landing, Application Inquiry, Audit Logs — is built. The Test Plan – Phase 1 (6.8) covers the PD v1 ↔ iPeak Happy Path integration, which doesn't exist in this codebase, so none of its 15 scenarios apply yet.

---

## 7. Recommended Next Steps

In rough priority order, informed by both the Gap Analysis's "High" priority items and the BRD's own phasing:

1. **Finish wiring the remaining loose ends** — `NonLifePaymentTransaction` has a route but no frontend caller yet (§4); Premium Maintenance is still frontend-only (§2).
2. **Move Premium Maintenance server-side.** Currently resets on page reload; this is the one Gap Analysis item this engagement solved on the frontend but left unpersisted.
3. **Decide the Application/Payment status model** — reconcile the BRD's fuller status lists (Duplicate/Denied/Withdrawn for PD Life; Paid/Underpaid/Unpaid/Reversed for payments) against what's currently implemented, since retrofitting enums after real data exists is costlier.
4. **Most of iPeak/AS400/Paynamics** is still a separate, much larger workstream — PD Life's outbound Insert/Update-Status calls exist now, but the inbound half (iPeak's results flowing back for client-facing documents), payment/Paynamics, and OFW/CTPL/GTP coverage are untouched and should be scoped independently. See `docs/life/HANDOVER.md` for specifics.
5. **Fill in the remaining document templates** — OFW's COI and all of GTP's documents are still mock-rendered pending real fillable templates from the business side.
6. **CMS** remains explicitly parked; revisit only when stakeholders re-raise it.

---

## 8. Credentials & Environments

- Frontend mock/offline login: `admin@paramount.com.ph` / `admin123`
- Backend seeded login (same credentials, real bcrypt hash): `admin@paramount.com.ph` / `admin123`
- **A deployed dev environment exists at `pd2-dev.paramount.com.ph`** (Ubuntu + PM2 + Nginx + RDS) — see `DEPLOYMENT.md` for the full deploy runbook, environment variable setup, and the `.github/workflows/deploy-pd2-dev.yml` CI/CD path (inactive until its repo secrets are configured; see `docs/general/ARCHITECTURE.md` §Deployment).
- `server/.env` (not committed) points `DATABASE_URL` at the dev RDS cluster. It also holds real UAT `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` values (sourced from the legacy PD repo, `plgic/paramountdirect` — see the memory note "Legacy Rails repo" — not committed here either). **Never put `DATABASE_URL` or `JWT_SECRET` in the frontend or any `VITE_*` variable.**
- **Never run a Prisma shadow-database migration (`--shadow-database-url`) against the shared dev RDS** — it resets the database (see the memory note "Never shadow-DB a real DB"). Likewise never run `npm run seed` against a database with real/shared data in it.
