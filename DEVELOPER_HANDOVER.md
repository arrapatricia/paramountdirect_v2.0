# Paramount Direct Admin Dashboard — Developer Handover

**Prepared:** 2026-09-15 · **Last updated:** 2026-09-23 (CTPL's Certificate of Cover + Service Invoice are now real, S3-stored generated PDFs - see §1 and §3)
**Scope of this document:** the admin dashboard prototype built in this engagement (frontend + backend scaffold), and how it maps against the existing **Gap Analysis** and **BRD: PD System Enhancement** documents.

Reference documents this handover cross-maps against:
- *Paramount Direct System: Gap Analysis*
- *BRD: PD System Enhancement* (Business Requirements, System Batch Process, Implementation Plan, Migration Phasing Plan, UI of PD 2, Test Plan – Phase 1)

**Note:** a per-change history used to live here as a long Change Log; it grew too large for developers to realistically read and was removed. Git history (`git log`) is the source of truth for what changed and when. The sections below reflect current state, not a chronological record.
---

## 1. What This Is

A working **frontend prototype** of the Paramount Direct admin dashboard, covering PD Life, OFW, CTPL, and GTP, plus a **backend scaffold** (API + database schema). It was built to validate workflows, UI/UX, and premium logic ahead of the real PD System 2.0 / iPeak integration described in the BRD. The backend **does** talk to iPeak for one flow — PD Life applications are transmitted to the real LEAP Services (iPeak/AS400) API on status change, verified live against UAT — but this is still a single outbound integration, not the full policy-lifecycle/payment/cash-value sync the BRD describes, and OFW/CTPL/GTP have no iPeak connection at all yet.

All four product lines are now wired frontend↔backend the same way: `App.tsx` fetches each product's applications from its real `/api/applications/{pd-life,ofw,ctpl,gtp}` route once a real backend session exists, and creating/updating an application (from the create-application wizard or an in-list action like "mark paid") posts to that same backend rather than only touching local React state. Each product also has a paired website-ingest webhook (`POST /api/ingest/{pd-life,ofw,ctpl,gtp}`, shared-secret auth via `WEBSITE_INGEST_API_KEY`) so the public site can push a submitted application in without anyone re-keying it — paramountdirect.com's is live; ofwinsurance.ph/ctpl.ph/yourtravelinsurance.ph's are built and ready but that outbound call hasn't been added on those three sites yet (see `server/README.md`'s API overview section).

Wiring OFW to real persistence required extending the Prisma schema (migration `20260921132500_add_ofw_ctpl_gtp_missing_fields`, applied to the shared `paramountdirectdev-v2-db` dev database): `OfwApplication` gained `phRegion`/`phBarangay`/`employmentVerified`/`paymentInstructionSent`/`isPaid` plus a new `OfwBeneficiary` child table; `CtplApplication` gained the owner-address breakdown fields plus `isPaid`; `GtpApplication` gained `isPaid`. See `DATABASE_SCHEMA.md` (and its live artifact) for the current field list.

**Generated policy documents are now real for CTPL** (COC + Service Invoice only, the two templates on hand so far) - not a persisted-document-store gap anymore for this product. `CtplApplication` gained a full vehicle description (`vehicleYear`/`vehicleMake`/`vehicleSeries`/`vehicleColor`/`vehicleBodyType`/`motorNumber`/`authorizedCapacity`/`unladenWeight` - Year/Make options mirrored live from ctpl.ph's own vehicle picker, see `ctpl_vehicle_reference.ts`) plus `effectiveDate`/`expiryDate` (defaulted from `renewalType` at issuance). The moment a CTPL application's `isPaid` first flips true (in either `POST` at creation - CTPL's website flow is already-paid on arrival - or the staff `PUT`, see `applications.ctpl.ts`), the server fills both fillable PDF templates (`server/src/templates/ctpl/*.pdf`, real forms with named AcroForm fields, via `pdf-lib` in `ctplDocumentFill.ts`) with the application's data and the reconciled premium tax breakdown (Base + DST + LGT + VAT + flat fee, from `premium_rates.ts`), uploads each to a private S3 bucket, and records one immutable `GeneratedDocument` row per file (model added to `schema.prisma`; service in `documentStorage.ts`). The Service Invoice's own "Invoice No." uses a separate shared `6000000XXXXXX` series (`invoiceNumbering.ts`) - **shared across OFW/CTPL/GTP by design**, not a per-product sequence, since all three use the same invoice series/template in the real business process. `ctpl_application_list.tsx`'s "View/Print"/"Send to Client" now call the real `/api/documents` list+presign endpoints and open the actual generated PDF in a new tab, rather than the old in-app mock-template modal. OFW and GTP's document sections still use that older mock-template approach - only CTPL has a document-fill service built so far.

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
      lib/prisma.ts
      app.ts, index.ts
    README.md                      backend setup instructions
```

### 1.3 Running it locally

**Frontend:**
```bash
cd paramountdirect_v2
npm install
npm run dev        # http://localhost:5173
```
Mock login: `admin@paramount.com.ph` / `admin123` (hardcoded in `login.tsx` — frontend runs entirely on in-memory mock data, see §4).

**Backend** (see `server/README.md` for full detail):
```bash
cd server
npm install
cp .env.example .env       # set DATABASE_URL, JWT_SECRET
npm run prisma:migrate -- --name init
npm run seed                # creates admin@paramount.com.ph / admin123 + sample rows
npm run dev                 # http://localhost:4000
```
Connects to a real RDS Postgres instance (`pdv2-dev` cluster) rather than requiring a local install — see `server/README.md`. Not connected to the frontend, and has no known deployed instance itself (see §8 for the frontend's separately-deployed copy at `pdv2.paramountdirect.com`, which this backend has nothing to do with).

---

## 2. Architecture Notes for Whoever Picks This Up

- **The frontend does not call the backend.** Every list/dashboard/create-application flow in the frontend reads and writes to local React state (`useState` arrays in `App.tsx`, seeded from hardcoded mock arrays). The backend was built to the same data shapes on purpose, so wiring them together means: (1) replace the mock-array `useState` calls with `fetch`/`useEffect` calls against the API, (2) replace `Login`'s hardcoded credential check with `POST /api/auth/login`, (3) store the returned JWT and send it as `Authorization: Bearer <token>` on every subsequent call. No schema redesign should be needed — see §4 for the mapping.
- **Premium logic lives entirely in the frontend** (`src/components/premium_rates.ts` + per-product `*_create_application.tsx` files), backed by a `Premium Maintenance` admin page. The backend has no equivalent endpoint yet — rates are not persisted server-side. This directly addresses the Gap Analysis's "Premium Maintenance – GTP, OFW, CTPL" item (see §5) on the frontend, but that logic needs to move server-side (or be added to the backend) before go-live, since right now anyone reloading the page resets rates to their seeded defaults.
- **Dark mode** is implemented via a `.dark` class on `<html>` (see `index.css`'s `@custom-variant dark`) — Tailwind v4 defaults to OS-preference dark mode, which was repointed at the app's own toggle.
- **Audit Logs** (`audit_logs.tsx`) is wired into navigation (`sidebar.tsx`, `App.tsx`'s `activeTab === 'audit'` branch) and reads live from `GET /api/audit-logs` via `auditLogApi` in `lib/api.ts`, with client-side search/module filtering and CSV export. The backend's audit log table and read API were already wired correctly (every create/update/delete on the backend writes a row) — this closes the loop described in earlier drafts of this doc.
- **iPeak (LEAP Services) integration** lives entirely in `server/src/services/ipeak/` and is PD-Life-only — see Change Log (10). `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` in `server/.env` currently point at the real UAT environment (base URL + house agent/branch-manager codes sourced from the legacy PD repo, `plgic/paramountdirect`, since this app collects none of that itself). If `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` are unset, the service logs "not configured" and persists a failed `PdLifeIpeakRequest` row instead of throwing — it never blocks a screener's status update either way.
- **CMS (Website Content)** was explicitly parked per stakeholder direction during this engagement — a placeholder nav entry exists (`sidebar.tsx` → Maintenance → "CMS (Website Content)") but no page was built. This matches the Gap Analysis's "Website Content Management (No CMS)" gap (§5) — it is **not started**, not partially done.

---

## 3. Feature Inventory (What Was Built)

| Area | Component(s) | Notes |
|---|---|---|
| Auth | `login.tsx`, `forgot_password.tsx` | Mock only; dark-mode aware |
| Dashboard | `dashboard.tsx` | PD Life sales/YTD summary, computed live from `screeningData` (real backend applications once connected, see §1) — no mock numbers |
| PD Life Applications hub | `pdlife_applications_hub.tsx` | Landing page for the "Applications" sidebar group — overview stats + a nav card each for Inquiry/Screening/Follow-up Signature |
| PD Life screening | `application_screening.tsx`, `application_inquiry.tsx`, `application_detail_{health,lifeaccident,comprehensive}.tsx`, `application_detail_ui.tsx`, `application_status_bar.tsx` | Status workflow: Received → For Verification → For Evaluation → Paid → Issued. The three detail pages share one UI kit (`application_detail_ui.tsx`: header, status control, section cards with inline edit, field rows) and both list pages show a filter-aware status-counts strip (`application_status_bar.tsx`). Application Inquiry opens the detail page in **read-only** mode (`readOnly` prop — no status changes, no section editing); Application Screening opens it fully editable. **Screener assignment:** new applications have no Screened By (null, shown as "-") and are open to every issuer; the first issuer to open one from Application Screening claims it (`PATCH /api/applications/pd-life/:id/claim` — an atomic conditional update, so a lost race just returns the winner and the list shows its "Access Restricted" warning). Once claimed, it's locked to that issuer until Issued. Moving any of the three detail pages to **Issued** is gated behind `IssueConfirmModal` (`application_detail_ui.tsx`) — the screener must record Signed/Unsigned before the status actually commits; the status change and that decision apply together (`onIssueDecision` prop, wired in `App.tsx` to the same `handleMarkSigned` used by Follow-up Signature/Signed Applications' own "Mark as Signed" buttons). |
| PD Life Follow-up Signature | `life_followup_signature.tsx`, `followup_signature_data.ts` | Tracks Issued PD Life applications awaiting the client's signed application form back. Master-detail UI (searchable/filterable list + a detail panel with a visual timeline and "log follow-up sent today" actions), not a table. Row data is derived from the same screening data as Application Screening/Inquiry (`followup_signature_data.ts`) so all three stay consistent. Queue membership: Signed?=Unsigned, App Status=Issued, Policy Status=Inforce or Lapsed — a Lapsed policy drops out of the queue once it's been lapsed more than 3 years (`buildFollowUpRows`'s `lapsedYearsAgo` cutoff). |
| PD Life create application | `pdlife_create_application.tsx`, `pdlife_types.ts` | Category picker (Health / Life & Accident / Comprehensive), live premium, Review step, inline confirmation |
| OFW | `ofw_dashboard.tsx`, `ofw_application_list.tsx`, `ofw_create_application.tsx`, `ofw_types.ts` | Real rate card: $0.0954/day × contract months (No. of Months auto-computed, 6-month minimum enforced). Generated documents (below) gated behind an Employment Contract Verification step (Yes/No) → Send Payment Instruction → payment confirmation. Wired to real backend persistence (`/api/applications/ofw`) and dashboard stats computed live from that data. |
| CTPL | `ctpl_dashboard.tsx`, `ctpl_application_list.tsx`, `ctpl_create_application.tsx`, `ctpl_types.ts` | Real rate table by Policy Type × MV Type. Straight-through payment (no verification gate) before documents unlock — `isPaid` is set true at creation itself, unlike OFW. Wired to real backend persistence (`/api/applications/ctpl`) and dashboard stats computed live from that data. Create Application now also captures full vehicle description (Year/Make from `ctpl_vehicle_reference.ts`, Series/Color/Body Type/Motor No./Capacity/Weight free-text) needed to fill its real generated documents (see §1). |
| Generated policy documents | `policy_documents.tsx` (shared modal chrome, used by OFW/GTP's still-mock document sections); CTPL instead calls the real `/api/documents` API (§1) | **CTPL only:** Certificate of Cover + Service Invoice are real generated PDFs (filled fillable templates, stored in S3, one immutable `GeneratedDocument` row each) — "View/Print"/"Send to Client" in `ctpl_application_list.tsx` fetch and open the actual file. **OFW/GTP:** Policy Schedule, Policy Jacket, OR (OFW), and Service Invoice are still the older mock-template render (view/print only becomes visible once `isPaid`, but nothing is actually generated/stored) — OFW's templates match the real Paramount forms (Certificate of Insurance, Balik Manggagawa vs. Direct Hired variant); GTP still uses the earlier generic layout, no real GTP templates on hand yet. |
| GTP | `gtp_dashboard.tsx`, `gtp_application_list.tsx`, `gtp_create_application.tsx`, `gtp_types.ts` | Real day-bracket rate card by destination category (auto-detected Including/Excluding USA-Canada-HK, or Domestic) × Individual/Family; Schengen coverage auto-applied. Wired to real backend persistence (`/api/applications/gtp`) and dashboard stats computed live from that data. |
| Premium Maintenance | `premium_maintenance.tsx`, `premium_rates.ts` | Centralizes what used to be hardcoded per-product rate constants into one editable table |
| Payments (PD Life) | `payment_transactions.tsx` | Installment ledger per policy, view/search/print, mock data. Now has a "PD Life" / "Non-Life" tab switcher at the top - the Non-Life tab renders `nonlife_payment_transactions.tsx` inline. |
| Billing (PD Life) | `billing.tsx`, `billing_types.ts` | Due-date-driven Regular/E-Billing/Credit Card tabs (11)(12)(15) plus Create Billing (13) - enforces Renewal-must-be-Regular and E-Billing plan-code eligibility (18) - and an editable Reminder Schedule tab (18); borderless list style, deliberately not matching the app's dashboard-card look; mock data only, not wired to the backend |
| Payments (OFW/CTPL/GTP) | `product_payment_transactions.tsx` (shared shell) + `ofw_/ctpl_/gtp_payment_transactions.tsx`, plus a new consolidated `nonlife_payment_transactions.tsx` (all three products in one table, product-filterable) surfaced inside the main Pay Tran page | One row per one-time payment (no ledger/installments), filtered to `isPaid`, with a printable receipt. Rows are keyed by Policy Number + Reference No. (new optional fields on all three application types/models) rather than a real FK, since CTPL/OFW/GTP each live in their own table. |
| Users & Role Management | `user_role_management.tsx` (merged Users + Role Access Matrix into one page/tabs), role catalog shared from `lib/roles.ts` | **System Admin only** — sidebar entry and the page itself are gated on `currentUserRole === 'System Admin'` (`sidebar.tsx`, `App.tsx`). Replaced the old sprawling legacy PD Life/OFW/CTPL/GTP role lists with a fixed 11-role catalog: System Admin; DM Operations/DM POS/DM Marketing/Contact Center (Direct Marketing — Contact Center is read-only on Application Inquiry, Follow-up Calls, and Payment Transactions); Life Cashier/Non-Life Cashier/Cashier Admin (Cashiering — the first two are view-only on payments + inquiry, Cashier Admin can create payments across every product); CTPL/GTP/OFW Admin (single-product); Non-Life Admin/Non-Life Issuer (cross-product, span OFW+CTPL+GTP). A user's product access is now *derived* from their role (`productsForRole`), not picked independently. `canCreatePayments(role, product)` in `lib/roles.ts` centralizes the "who can record a payment" check used by all four Payment Transactions pages, replacing the old hardcoded `'Cashier' \| 'Admin'` checks. The page is now wired to the real `/api/users` + `/api/roles` backend (falls back to a local mock when unauthenticated/unreachable) — `server/prisma/seed.ts` seeds one demo account per role (password `admin123`) for demoing without live provisioning. |
| Branch Directory | `branch_directory.tsx` | Mock CRUD |
| Marketing Dashboard | `marketing_dashboard.tsx` | GA/source/drop-off stats zeroed (no mock analytics); the fabricated "unfinished applications" rows were removed entirely (empty-state table) |
| Life Statistics | `life_applications_overview.tsx`, `life_followup_calls.tsx`, `life_signed_applications.tsx`, `life_screened_applications.tsx`, `life_application_statuses.tsx` | PD-Life-only, matches legacy admin reference site. All computed live from `screeningData` (real backend applications once connected) except `life_followup_calls.tsx`, which is still mock — `ScreeningItem` has no field representing a phone follow-up call, its tier, or its outcome, so that page needs a product/data-model decision (what a "call" even is here) before it can be de-mocked, not just wiring. |
| Audit Logs | `audit_logs.tsx` (frontend, wired to backend) / `auditLogs.ts` (backend, wired) | See §2 |
| Dark mode & responsive | `index.css`, all components | Applied app-wide |

---

## 4. Data Model Cross-Reference (Frontend mock ↔ Backend Prisma schema)

| Frontend type (`src/components/*_types.ts`, `App.tsx`) | Backend model (`server/prisma/schema.prisma`) | Aligned? |
|---|---|---|
| `ScreeningItem` / `PdLifeApplication` | `PdLifeApplication` | Yes — backend adds `planCategory` enum + `details` JSON for category-specific fields. `policyNumber` is `@unique` and is the FK target for `PaymentTransaction.policyNo` (Change Log 2026-09-18 (7)). |
| `OfwApplication` | `OfwApplication` | Yes, field-for-field — including the optional `policyNumber`/`referenceNo` (Change Log 2026-09-18 (10)) and the real FK back-relation `paymentTransactions` added in (16) (see note below) |
| `CtplApplication` | `CtplApplication` | Yes, field-for-field — including the optional `policyNumber`/`referenceNo` (Change Log 2026-09-18 (10)), the real FK back-relation `paymentTransactions` added in (16) (see note below), and the vehicle description + `effectiveDate`/`expiryDate` fields added 2026-09-23 for document generation (§1) |
| `GtpApplication` | `GtpApplication` | Yes, field-for-field — including the optional `policyNumber`/`referenceNo` (Change Log 2026-09-18 (10)) and the real FK back-relation `paymentTransactions` added in (16) (see note below) |
| `UserAccount` | `User` + `Role` | Yes |
| `ModulePermission` | `RolePermission` | Yes |
| `Branch` | `Branch` | Yes |
| `PaymentTransaction` / `PaymentLedgerItem` | `PaymentTransaction` / `PaymentLedgerItem` | Yes — backend's `PolicyStatus` enum (`Inforced/Lapsed/Terminated/Matured/Involuntary/Voluntary/Surrender`) already matches the BRD's "Policy Status" table (System Batch Process tab) almost exactly. `PaymentTransaction.policyNo` is a real FK into `PdLifeApplication.policyNumber` (`ON DELETE RESTRICT`), migration `20260918014351_link_payment_transaction_to_pdlife_application` — **generated but not yet deployed** (Change Log 2026-09-18 (7)). |
| `NonLifePaymentTransaction` rows in `nonlife_payment_transactions.tsx` (currently local component state only, not a named frontend type) | `NonLifePaymentTransaction` (new, Change Log 2026-09-18 (16)) | Partial — the backend model is the non-life equivalent of `PaymentTransaction`, with real nullable FKs (`ctplApplicationId`/`ofwApplicationId`/`gtpApplicationId`) into whichever of the three application tables it belongs to, plus a `product` enum. Migration `20260918052815_add_nonlife_payment_transaction` and route `payments.nonlife.ts` (`/api/payments-nonlife`) exist, but nothing on the frontend calls it yet — a cashier's manually-created row still only lives in that component's session state. |
| *(none — new)* | `AuditLog` | Frontend and backend both wired (§2) |
| *(none)* | *(none)* | **Premium rate tables — not in backend yet** (§2) |
| *(none — backend-only, new)* | `PdLifeBeneficiary`, `PdLifeIpeakRequest` | New for the iPeak integration (§2, Change Log 2026-09-16 (10)) — beneficiaries promoted out of `PdLifeApplication.details` JSON into a real relation; `PdLifeIpeakRequest` is the per-call audit/retry trail. No frontend equivalent yet. |
| *(none yet — backend-only, new)* | `GeneratedDocument` | Backs CTPL's real document generation (§1) — one immutable row per generated PDF (`applicationType`/`applicationId`/`docKey`/`s3Key`/`invoiceNumber`/`generatedAt`/`generatedBy`). `applicationId` is deliberately not a DB-level FK (same polymorphic-association problem as `NonLifePaymentTransaction`, resolved in application code via `applicationType` instead). Only CTPL writes to it today; OFW/GTP will once their own document-fill services exist. |

**Non-life FK note (Change Log 2026-09-18 (16), supersedes the original (10) note):** `CtplApplication`, `OfwApplication`, and `GtpApplication` each live in their own table with no shared parent, so a single relation column can't point at "whichever of the three this is." `NonLifePaymentTransaction` (16) solves this the standard Prisma way for polymorphic associations - three nullable FK columns, only one populated per row, matching its `product` enum (enforced in `payments.nonlife.ts`'s zod schema, not by the DB itself). `policyNumber`/`referenceNo` on the three application models remain plain optional `@unique` columns (not FKs) - they're duplicated onto `NonLifePaymentTransaction` rows too, since that's the natural lookup key a cashier searches by, independent of whether the FK happens to be set. Migration `20260918052815_add_nonlife_payment_transaction` — **generated but not yet deployed**, same caveat as Change Log 2026-09-18 (7).

**Status/enum gaps to note against the BRD's System Batch Process tab:**
- The BRD's **Application Status** list (Received, For Verification, For Evaluation, Duplicate, Denied, Withdrawn, Issued, Cancelled) is broader than what's implemented. The prototype's `PdLifeStatus` only has `Received | For_Verification | For_Evaluation | Paid | Issued` (per explicit stakeholder direction during this engagement to keep PD Life "as-is"). **Duplicate, Denied, and Withdrawn are not modeled anywhere in PD Life.** OFW and CTPL do have `Duplicate` (and CTPL also distinguishes `Spoiled`/`Reversed`/`Cancelled`), so this gap is PD-Life-specific.
- The BRD's **Payment Status** list (Paid, Underpaid, Unpaid, Reversed) has no dedicated enum anywhere in the prototype — `PaymentTransaction.policyStatus` covers policy lifecycle, not payment status per installment. `PaymentLedgerItem.status` is a free-text string today, not tied to this enum.

---

## 5. Gap Analysis Cross-Map

Legend: 🟢 Covered by this prototype · 🟡 Partially addressed (UI exists, not backed by real integration) · 🔴 Not started

### PD Life

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Data Reliability (migrated data has inconsistencies) | High | 🔴 | Out of scope — no data migration was performed; prototype uses fresh mock/seed data only |
| Policy Maintenance (no structured module) | High | 🔴 | Not built. No policy-maintenance workflow (beneficiary changes, status updates) exists anywhere in the prototype |
| System Integration (no real-time iPeak sync) | High | 🟡 | One direction is now live: PD Life applications transmit to iPeak/LEAP on status change (outbound only, verified against UAT — Change Log (10)). No inbound sync back from iPeak (policy issuance/invoice results reflecting into this system), no OFW/CTPL/GTP coverage, and no AS400 policy-lifecycle/payment data flows the other way yet |
| Payment Logging | High | 🟡 | `PaymentTransaction` + `PaymentLedgerItem` models exist and the backend API logs creates/updates via Audit Logs, but there's no real payment gateway to log *against* — this addresses the "structure" half of the gap, not the "accurate posting" half |
| SI Issuance | High | 🔴 | No Service Invoice generation logic for PD Life specifically — PD Life applications don't yet have the document-gating feature that OFW/CTPL got (see below) |
| Reports | High | 🔴 | No reporting/export module; Life Statistics pages (§3) are dashboards, not extractable reports |
| UI / UX | Medium | 🟢 | Full redesign done: dark mode, mobile-responsive, consistent card/table patterns, per-product branding |
| Audit Logs | Medium | 🟢 | Backend logs every write with user/action/module/timestamp/IP; the frontend viewer (§2) is now wired to `GET /api/audit-logs` with search/module filtering and CSV export |
| User Experience (streamlined navigation) | Medium | 🟢 | Sidebar reorganized per product line; new Premium Maintenance and Life Statistics sections added without cluttering existing nav |

### OFW

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Payment Tracking (static reference numbers, no TTL) | High | 🔴 | Not addressed — the prototype's OFW application IDs (`800XXXXX` format) don't expire; no TTL logic exists |
| Renewal Process (no new-vs-renewal detection) | High | 🔴 | Not addressed — Create Application always creates a new record; there's no lookup-by-reference-number or renewal path |
| Payment Transaction Logging | High | 🟡 | Same as PD Life — backend audit logging exists structurally, no real payment events to log |
| SI & Official Receipt Issuance | High | 🟡 | Service Invoice and OR are now generated (view/print/"send to client") once `isPaid` is true, using the real Paramount templates — see §3. Still frontend-only mock data, not tied to a real payment event or a persisted document store |
| *(New, not in Gap Analysis)* Premium accuracy | — | 🟢 | Replaced the placeholder flat land/sea premium with the real $0.0954/day rate card, verified against the live site's own published table |

### CTPL

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Application Lifecycle Control (ID generated before final submit) | High | 🟢 (redesigned) | The prototype's flow generates the ID only in `buildApplication()`, called from "Confirm & Submit" *after* the Review step — draft/in-progress form state never gets an ID or touches the applications list. This matches the BRD's desired state directly |
| Production Reporting | High | 🔴 | No production dashboard/export exists |
| Client Number Capture | High | 🔴 | No "Client Number" concept exists in the CTPL data model |
| User Access for Authentication (role-based, not backend-level) | High | 🟢 (backend) / 🟡 (frontend) | Backend has JWT auth + role model; frontend's mock login doesn't yet enforce per-role access to screens |
| Manual Authentication / Issuance | High | 🟡 | Document *generation* is now automated the moment `isPaid` flips true (real COC + Service Invoice PDFs, §1) — but there's still no payment gateway triggering that flip itself, and no LTO/ISAP-COCAF authentication call, so the "manual" half of this gap (someone still has to mark it paid) isn't closed |
| Vehicle Master Data Integrity | High | 🟡 | `CTPL_MV_TYPES` is still a static hardcoded list. Vehicle Year/Make *are* now sourced from a maintained reference (`ctpl_vehicle_reference.ts`, mirrored from ctpl.ph's own picker) rather than invented, though it's a static snapshot, not a live-synced table; Series stays free-text since ctpl.ph's per-maker trim catalog is too large to mirror |
| Payment Redirection Flow (no validation checkpoint) | Medium | 🟢 (redesigned) | The Review step before Confirm & Submit *is* that checkpoint — matches the BRD's desired state |
| *(New)* Premium accuracy | — | 🟢 | Real per-Policy-Type/MV-Type rate table, editable via Premium Maintenance |
| *(New, not in Gap Analysis)* SI/COC Issuance | — | 🟢 | Certificate of Cover + Service Invoice are real generated PDFs, tax breakdown computed from the reconciled Base+DST+LGT+VAT+fee formula, stored in S3 — see §1 |

### GTP

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Submission to Payment Transition (no validation checkpoint) | High | 🟢 (redesigned) | Same Review-step pattern as CTPL |
| Transaction Logs (user & system actions) | High | 🟡 | Backend audit logging exists structurally; no real system-triggered events to log yet |
| Payment Audit Trail | High | 🔴 | No payment gateway integration to produce this trail from |
| Production Reporting | High | 🔴 | Not built |
| *(New)* Premium accuracy | — | 🟢 | Real destination-category × day-bracket rate card, verified line-by-line against the GTPH Computation sheet, including Schengen auto-detection |

### Other Features

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Website Content Management (No CMS) | High | 🔴 | Explicitly parked per stakeholder direction; nav placeholder only |
| No Version Control / Content Audit Trail | High | 🔴 | Depends on CMS existing first |
| **Premium Maintenance – GTP, OFW, CTPL** | High | 🟢 | This is the one Gap Analysis item most directly and fully addressed by this engagement — see `premium_maintenance.tsx` |

---

## 6. BRD Cross-Map

### 6.1 Project Objectives

| Objective | Status | Notes |
|---|---|---|
| Automate repetitive manual tasks | 🟡 | Premium computation is now automatic (was manual/hardcoded); application status changes still require manual screening action (by design — no auto-decisioning was requested) |
| Streamline navigation, "three-click rule" | 🟢 | Sidebar restructured around product-line pills; every page reachable in ≤ 3 clicks from login |
| Eliminate constant manual monitoring via self-validating outputs | 🔴 | No exception-based notification system exists |
| Minimize data-entry risk / processing mistakes | 🟢 | Required-field validation, the mandatory Review step before submission, and placeholder-driven "premium = 0.00 until real inputs exist" behavior all reduce silent bad-data submission |
| Handle increased volume without proportional manual effort | 🔴 | Not applicable yet — no real data volume or backend wiring |

### 6.2 Functional Requirements (Non-Life & Other Products)

| Requirement | Status | Notes |
|---|---|---|
| A.a — Landing page shows graphs/summary per product | 🟢 | `dashboard.tsx` + each product's own dashboard (`ofw_dashboard.tsx` etc.) |
| A.b — Single View dashboard of all active operations | 🟡 | Each product has its own dashboard; there is no single cross-product landing view showing all four at once |
| A.c — Three-click rule | 🟢 | See above |
| B.a — Automatic data validation against business rules | 🟢 | Per-field `required`, cross-field rules (e.g., OFW's 6-month minimum, CTPL's plate/chassis format hints, GTP's Schengen auto-detection) |
| B.b — Automated status reports | 🔴 | Not built |
| B.c — Exception flagging / notify only when necessary | 🔴 | Not built |

### 6.3 Non-Functional Requirements

| Requirement | Status | Notes |
|---|---|---|
| Usability | 🟢 | Consistent design system, dark mode, mobile-responsive, inline review/confirmation instead of disruptive modals (per explicit stakeholder feedback during this engagement) |
| Reliability (99.9% automated-output accuracy) | 🟡 | Premium calculations are now verified against real rate cards (high confidence), but there's no automated output at the scale this NFR implies (no live transactions) |
| Performance (background processing, responsive UI) | N/A | No long-running background processes exist yet to evaluate against |

### 6.4 PD Life / iPeak Migration (Operational Setup, Advantages)

**Mostly out of scope for this engagement, with one exception.** PD Life applications now transmit to the real iPeak (LEAP Services/AS400) API on status change — see Change Log (10) — but that's a single outbound call (Insert New Business, Update Status), not the cashiering/valuation/claims/policy-lifecycle sync this BRD section describes. There is no inbound path yet for iPeak's own results (policy issuance confirmation, service invoice, policy schedule) to flow back into this system for the client-facing document delivery the BRD describes, and the PD Life UI itself still runs on mock data (§2) — the transmission fires from the real backend route, but nothing in the frontend triggers it yet since the frontend isn't wired to the backend at all. This section of the BRD remains the next major workstream — see §7.

### 6.5 System Batch Process (Status enums)

Covered in §4 above — partial enum alignment, with **Payment Status** unaddressed and PD Life's **Application Status** missing `Duplicate`/`Denied`/`Withdrawn`.

### 6.6 Implementation Plan (Track A / Track B, Phases)

This prototype does not implement either Track A or Track B's backend steps (iPeak issuance, AS400 upload, Paynamics payment confirmation) — it implements the **application-submission and premium-computation front half** of both tracks' step 1–3 (Application Submission, Data Validation, Premium Computation) for all four product lines, using mock data instead of the real downstream integrations (steps 4 onward). It does not correspond to any specific Phase 1/2/3 milestone in the Implementation Plan's timeline — it's foundational UI/UX work that could de-risk whichever phase actually builds the real integration.

### 6.7 UI of PD 2 (Major Screens)

| BRD screen | Status |
|---|---|
| Login Page | 🟢 `login.tsx` |
| Landing Page | 🟢 `dashboard.tsx` (per-product, not a single unified landing page — see §6.2) |
| Application Inquiry Page | 🟢 `application_inquiry.tsx` |
| Audit Logs | 🟢 Backend and frontend both done and wired (§2) |

### 6.8 Test Plan – Phase 1

Not applicable — this test plan covers the PD v1 ↔ iPeak Happy Path integration, which doesn't exist in this codebase. None of its 15 test scenarios can be executed against this prototype.

---

## 7. Recommended Next Steps

In rough priority order, informed by both the Gap Analysis's "High" priority items and the BRD's own phasing:

1. **Wire frontend to backend.** Highest-leverage next step — the shapes already match (§2, §4). Start with auth, then one product line end-to-end (list + create + status update) before doing the rest.
2. **Move Premium Maintenance server-side.** Currently resets on page reload; this is the one Gap Analysis item this engagement solved on the frontend but left unpersisted.
3. **Decide the Application/Payment status model** before backend integration goes further — reconcile the BRD's fuller status lists (Duplicate/Denied/Withdrawn for PD Life; Paid/Underpaid/Unpaid/Reversed for payments) against what's currently implemented, since retrofitting enums after real data exists is costlier.
4. **Most of iPeak/AS400/Paynamics** (§6.4, §6.6) is still a separate, much larger workstream — PD Life's outbound Insert/Update-Status calls exist now (Change Log (10)), but the inbound half (iPeak's results flowing back for client-facing documents), payment/Paynamics, and OFW/CTPL/GTP coverage are untouched and should be scoped independently.
5. **Run the PD Life iPeak migration against the real database.** The RDS dev connection issue noted in Change Log (10) is resolved as of Change Log 2026-09-18 (3) — the database is reachable — but confirm the `add_ipeak_integration` migration has actually been applied there before relying on `policyNumber`/`PdLifeBeneficiary`/`PdLifeIpeakRequest` existing.
6. **Get PD Direct's actual agent code from Paramount.** The iPeak integration currently hardcodes the legacy system's own house/direct-channel agent (GRACE R. ARTIZA / 30831) because iPeak rejects a blank agent outright — confirm whether that's the correct code to keep using for PD 2.0 or if a different one should be assigned.
7. **CMS** remains explicitly parked; revisit only when stakeholders re-raise it.

---

## 8. Credentials & Environments

- Frontend mock login: `admin@paramount.com.ph` / `admin123`
- Backend seeded login (same credentials, real bcrypt hash): `admin@paramount.com.ph` / `admin123`
- **A deployed copy of the frontend exists at `pdv2.paramountdirect.com`.** It is not part of this repo's git history or build process in any visible way — no CI/CD workflow, Vercel/Netlify config, Procfile, or Dockerfile exists here — so pushing to `master` does **not** update it. As of Change Log 2026-09-18 (3) it was found serving a build from before that day's fixes; whoever manages that deployment needs to manually trigger a rebuild + redeploy to pick up new commits. The backend has no known deployed instance.
- `server/.env` (not committed) has `DATABASE_URL` pointed at the `pdv2-dev` RDS cluster (ap-southeast-1). The auth failure (P1000) originally reported in Change Log (10) is resolved as of Change Log 2026-09-18 (3) — the connection works (confirmed by actually running `prisma/trimApplications.ts` against it). It also has real UAT `IPEAK_SERVICE_URL`/`IPEAK_PRIVATE_KEY` values (sourced from the legacy PD repo, not committed here either) — see Change Log (10).
