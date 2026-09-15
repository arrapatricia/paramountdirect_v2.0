# Paramount Direct Admin Dashboard — Developer Handover

**Prepared:** 2026-09-15
**Scope of this document:** the admin dashboard prototype built in this engagement (frontend + backend scaffold), and how it maps against the existing **Gap Analysis** and **BRD: PD System Enhancement** documents.

Reference documents this handover cross-maps against:
- *Paramount Direct System: Gap Analysis*
- *BRD: PD System Enhancement* (Business Requirements, System Batch Process, Implementation Plan, Migration Phasing Plan, UI of PD 2, Test Plan – Phase 1)

---

## 1. What This Is

A working **frontend prototype** of the Paramount Direct admin dashboard, covering PD Life, OFW, CTPL, and GTP, plus a **backend scaffold** (API + database schema) that is not yet wired to the frontend. It was built to validate workflows, UI/UX, and premium logic ahead of the real PD System 2.0 / iPeak integration described in the BRD — it is **not** a replacement for that integration and does not talk to iPeak, AS400, or any payment gateway.

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
Requires a local PostgreSQL instance. Not currently deployed anywhere; not connected to the frontend.

---

## 2. Architecture Notes for Whoever Picks This Up

- **The frontend does not call the backend.** Every list/dashboard/create-application flow in the frontend reads and writes to local React state (`useState` arrays in `App.tsx`, seeded from hardcoded mock arrays). The backend was built to the same data shapes on purpose, so wiring them together means: (1) replace the mock-array `useState` calls with `fetch`/`useEffect` calls against the API, (2) replace `Login`'s hardcoded credential check with `POST /api/auth/login`, (3) store the returned JWT and send it as `Authorization: Bearer <token>` on every subsequent call. No schema redesign should be needed — see §4 for the mapping.
- **Premium logic lives entirely in the frontend** (`src/components/premium_rates.ts` + per-product `*_create_application.tsx` files), backed by a `Premium Maintenance` admin page. The backend has no equivalent endpoint yet — rates are not persisted server-side. This directly addresses the Gap Analysis's "Premium Maintenance – GTP, OFW, CTPL" item (see §5) on the frontend, but that logic needs to move server-side (or be added to the backend) before go-live, since right now anyone reloading the page resets rates to their seeded defaults.
- **Dark mode** is implemented via a `.dark` class on `<html>` (see `index.css`'s `@custom-variant dark`) — Tailwind v4 defaults to OS-preference dark mode, which was repointed at the app's own toggle.
- **Audit Logs** (`audit_logs.tsx`) exists as a component but is **not wired into navigation** in the frontend (no sidebar entry, no `App.tsx` render branch) — it was built in an earlier pass and never connected. The backend's audit log table and read API *are* wired correctly (every create/update/delete on the backend writes a row). This is a loose end worth flagging to whoever continues this: connect the existing frontend component, and decide whether it should read from the backend API or stay on mock data pending the full wiring pass.
- **CMS (Website Content)** was explicitly parked per stakeholder direction during this engagement — a placeholder nav entry exists (`sidebar.tsx` → Maintenance → "CMS (Website Content)") but no page was built. This matches the Gap Analysis's "Website Content Management (No CMS)" gap (§5) — it is **not started**, not partially done.

---

## 3. Feature Inventory (What Was Built)

| Area | Component(s) | Notes |
|---|---|---|
| Auth | `login.tsx`, `forgot_password.tsx` | Mock only; dark-mode aware |
| Dashboard | `dashboard.tsx` | PD Life sales/YTD summary, mock data |
| PD Life screening | `application_screening.tsx`, `application_inquiry.tsx`, `application_detail_{health,lifeaccident,comprehensive}.tsx` | Status workflow: Received → For Verification → For Evaluation → Paid → Issued |
| PD Life create application | `pdlife_create_application.tsx`, `pdlife_types.ts` | Category picker (Health / Life & Accident / Comprehensive), live premium, Review step, inline confirmation |
| OFW | `ofw_dashboard.tsx`, `ofw_application_list.tsx`, `ofw_create_application.tsx`, `ofw_types.ts` | Real rate card: $0.0954/day × contract months (No. of Months auto-computed, 6-month minimum enforced) |
| CTPL | `ctpl_dashboard.tsx`, `ctpl_application_list.tsx`, `ctpl_create_application.tsx`, `ctpl_types.ts` | Real rate table by Policy Type × MV Type |
| GTP | `gtp_dashboard.tsx`, `gtp_application_list.tsx`, `gtp_create_application.tsx`, `gtp_types.ts` | Real day-bracket rate card by destination category (auto-detected Including/Excluding USA-Canada-HK, or Domestic) × Individual/Family; Schengen coverage auto-applied |
| Premium Maintenance | `premium_maintenance.tsx`, `premium_rates.ts` | Centralizes what used to be hardcoded per-product rate constants into one editable table |
| Payments | `payment_transactions.tsx` | View/search/print ledger, mock data |
| User & Role Management | `user_management.tsx`, `role_access_maintenance.tsx` | Direct Marketing roles (Operations/Marketing/Contact Center) + legacy PD Life roles + Non-Life roles; product-scoped assignment; permission matrix (read/write/delete per module) |
| Branch Directory | `branch_directory.tsx` | Mock CRUD |
| Marketing Dashboard | `marketing_dashboard.tsx` | Mock analytics |
| Life Statistics | `life_applications_overview.tsx`, `life_followup_calls.tsx`, `life_signed_applications.tsx`, `life_screened_applications.tsx`, `life_application_statuses.tsx` | PD-Life-only, matches legacy admin reference site |
| Audit Logs | `audit_logs.tsx` (frontend, orphaned) / `auditLogs.ts` (backend, wired) | See §2 |
| Dark mode & responsive | `index.css`, all components | Applied app-wide |

---

## 4. Data Model Cross-Reference (Frontend mock ↔ Backend Prisma schema)

| Frontend type (`src/components/*_types.ts`, `App.tsx`) | Backend model (`server/prisma/schema.prisma`) | Aligned? |
|---|---|---|
| `ScreeningItem` / `PdLifeApplication` | `PdLifeApplication` | Yes — backend adds `planCategory` enum + `details` JSON for category-specific fields |
| `OfwApplication` | `OfwApplication` | Yes, field-for-field |
| `CtplApplication` | `CtplApplication` | Yes, field-for-field |
| `GtpApplication` | `GtpApplication` | Yes, field-for-field |
| `UserAccount` | `User` + `Role` | Yes |
| `ModulePermission` | `RolePermission` | Yes |
| `Branch` | `Branch` | Yes |
| `PaymentTransaction` / `PaymentLedgerItem` | `PaymentTransaction` / `PaymentLedgerItem` | Yes — backend's `PolicyStatus` enum (`Inforced/Lapsed/Terminated/Matured/Involuntary/Voluntary/Surrender`) already matches the BRD's "Policy Status" table (System Batch Process tab) almost exactly |
| *(none — new)* | `AuditLog` | Backend-only; frontend component exists but isn't wired (§2) |
| *(none)* | *(none)* | **Premium rate tables — not in backend yet** (§2) |

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
| System Integration (no real-time iPeak sync) | High | 🔴 | Out of scope — no iPeak/AS400 connection exists or was attempted |
| Payment Logging | High | 🟡 | `PaymentTransaction` + `PaymentLedgerItem` models exist and the backend API logs creates/updates via Audit Logs, but there's no real payment gateway to log *against* — this addresses the "structure" half of the gap, not the "accurate posting" half |
| SI Issuance | High | 🔴 | No Service Invoice generation logic anywhere |
| Reports | High | 🔴 | No reporting/export module; Life Statistics pages (§3) are dashboards, not extractable reports |
| UI / UX | Medium | 🟢 | Full redesign done: dark mode, mobile-responsive, consistent card/table patterns, per-product branding |
| Audit Logs | Medium | 🟡 | Backend logs every write with user/action/module/timestamp/IP — structurally addresses the gap, but the frontend viewer isn't wired in (§2), and it isn't connected to any real user session yet |
| User Experience (streamlined navigation) | Medium | 🟢 | Sidebar reorganized per product line; new Premium Maintenance and Life Statistics sections added without cluttering existing nav |

### OFW

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Payment Tracking (static reference numbers, no TTL) | High | 🔴 | Not addressed — the prototype's OFW application IDs (`800XXXXX` format) don't expire; no TTL logic exists |
| Renewal Process (no new-vs-renewal detection) | High | 🔴 | Not addressed — Create Application always creates a new record; there's no lookup-by-reference-number or renewal path |
| Payment Transaction Logging | High | 🟡 | Same as PD Life — backend audit logging exists structurally, no real payment events to log |
| SI & Official Receipt Issuance | High | 🔴 | Not built |
| *(New, not in Gap Analysis)* Premium accuracy | — | 🟢 | Replaced the placeholder flat land/sea premium with the real $0.0954/day rate card, verified against the live site's own published table |

### CTPL

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Application Lifecycle Control (ID generated before final submit) | High | 🟢 (redesigned) | The prototype's flow generates the ID only in `buildApplication()`, called from "Confirm & Submit" *after* the Review step — draft/in-progress form state never gets an ID or touches the applications list. This matches the BRD's desired state directly |
| Production Reporting | High | 🔴 | No production dashboard/export exists |
| Client Number Capture | High | 🔴 | No "Client Number" concept exists in the CTPL data model |
| User Access for Authentication (role-based, not backend-level) | High | 🟢 (backend) / 🟡 (frontend) | Backend has JWT auth + role model; frontend's mock login doesn't yet enforce per-role access to screens |
| Manual Authentication / Issuance | High | 🔴 | No automated issuance-on-payment logic; there is no payment gateway to trigger from |
| Vehicle Master Data Integrity | High | 🔴 | `CTPL_MV_TYPES` is a static hardcoded list in `ctpl_types.ts`, not a maintained/synced master table |
| Payment Redirection Flow (no validation checkpoint) | Medium | 🟢 (redesigned) | The Review step before Confirm & Submit *is* that checkpoint — matches the BRD's desired state |
| *(New)* Premium accuracy | — | 🟢 | Real per-Policy-Type/MV-Type rate table, editable via Premium Maintenance |

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

**Entirely out of scope for this engagement.** No iPeak connection, no AS400 integration, no real-time sync, no cashiering/valuation/claims integration was attempted. The prototype's PD Life pages are a UI/workflow proof-of-concept only, running on mock data. This entire section of the BRD (§ Requirements for PD Life) remains 🔴 for this codebase and is squarely the next major workstream — see §7.

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
| Audit Logs | 🟡 Backend done, frontend orphaned (§2) |

### 6.8 Test Plan – Phase 1

Not applicable — this test plan covers the PD v1 ↔ iPeak Happy Path integration, which doesn't exist in this codebase. None of its 15 test scenarios can be executed against this prototype.

---

## 7. Recommended Next Steps

In rough priority order, informed by both the Gap Analysis's "High" priority items and the BRD's own phasing:

1. **Wire frontend to backend.** Highest-leverage next step — the shapes already match (§2, §4). Start with auth, then one product line end-to-end (list + create + status update) before doing the rest.
2. **Move Premium Maintenance server-side.** Currently resets on page reload; this is the one Gap Analysis item this engagement solved on the frontend but left unpersisted.
3. **Wire the orphaned Audit Logs page** into navigation and, once the backend is connected, point it at `GET /api/audit-logs`.
4. **Decide the Application/Payment status model** before backend integration goes further — reconcile the BRD's fuller status lists (Duplicate/Denied/Withdrawn for PD Life; Paid/Underpaid/Unpaid/Reversed for payments) against what's currently implemented, since retrofitting enums after real data exists is costlier.
5. **Everything iPeak/AS400/Paynamics-related** (§6.4, §6.6) is a separate, much larger workstream this engagement did not touch — it should be scoped and staffed independently of this frontend/backend prototype.
6. **CMS** remains explicitly parked; revisit only when stakeholders re-raise it.

---

## 8. Credentials & Environments

- Frontend mock login: `admin@paramount.com.ph` / `admin123`
- Backend seeded login (same credentials, real bcrypt hash): `admin@paramount.com.ph` / `admin123`
- No staging/production environment exists for either half — both run locally only.
