# OFW Sitemap

Every page/route in the admin dashboard that is OFW-specific, or that has an OFW-specific
view within a shared page. Paths are the real, bookmarkable URLs synced via the History API
in `App.tsx` (see `paramountdirect_v2/src/lib/routes.ts` — this app has no router library;
`resolveInitialNav`/the `TAB_TO_PATH`/`PATH_TO_TAB` maps do the work). For the full
cross-product sitemap, see [`../general/SITEMAP.md`](../general/SITEMAP.md) once written.

---

## 1. OFW Dashboard

**Path:** `/ofw` · **Component:** `ofw_dashboard.tsx` · **Tab key:** `ofw-dashboard`

Landing page for the OFW product line. KPI cards (Total Premium Collected YTD in both USD
and PHP, Annual Premium Target with attainment bar, New Applications YTD, Policies Issued
YTD with conversion rate), a Coverage Type donut (100% Land-based, since that's the only
package sold), a year-over-year monthly premium bar chart (2025 vs 2026, current month
shown at reduced opacity as "month-to-date"), a Nature of Employment breakdown
(Direct-hired vs Balik-Manggagawa), and a Top Countries of Employment bar list. All figures
are computed live from real `OfwApplication[]` data (no mock numbers) once the backend is
connected (see `../general/ARCHITECTURE.md` for the connected/mock fallback pattern shared
across all four product lines).

## 2. OFW Application List

**Path:** `/ofw/applications` · **Component:** `ofw_application_list.tsx` · **Tab key:**
`ofw-applications`

Registry of all OFW applications with:
- A search bar (name, reference no., COI no.).
- Status tabs: `All`, `Received`, `Spoiled`, `Duplicate`, `Reversed`, `Cancelled` (workflow
  `status`, not Policy Status — see [`PRD.md`](./PRD.md#status-model)), each showing a live
  count.
- A paginated table (20 rows/page) with columns: Reference No., COI No., Insured Name (with
  a Conflict Zone badge when applicable), Country, Received/Processed/Issued timestamps,
  Premium (USD + PHP), Payment (Paid/Unpaid), Policy Status (derived badge), Issuer, and a
  View action.
- **New Application** button → Create Application wizard (§3).

### 2a. Application detail — unpaid (full page)

**Path:** `/ofw/applications/:referenceNo` (falls back to `:id` for legacy rows with no
reference number) · same component, entered via the list's View action.

An unpaid application opens as its **own full page**, not a modal, because it supports
in-place editing and the verification/payment workflow. Sections: Application Status
(Reference/COI No., Received/Processed/Payment-Instruction-Sender/Issued dates), Applicant
Information, Employment Information, Uploaded Documents (per-document Uploaded/Missing
badges), **Employment Verification & Payment** (the Yes/No → Send Payment Instruction →
Payment Confirmation gate — see [`HANDOVER.md §3`](./HANDOVER.md#3-employment-verification--payment-instruction--payment-confirmation)),
and Documents & Endorsements (locked until paid). An **Edit** button switches the header
fields (name, gender, civil status, occupation, employer, premium, issuer, status) into an
inline editable form.

### 2b. Application detail — paid (quick-preview modal)

Same component, same URL scheme, but rendered as an overlay modal rather than a full page —
there is nothing left to edit once paid, so no reason to leave the list view. Shows the same
read-only sections as 2a, plus the unlocked Documents & Endorsements section (real Service
Invoice link-out; mock COI/OR; endorsement history via `ofw_policy_endorsements.tsx`, live
only when the backend is connected).

## 3. Create Application (wizard)

**Path:** reached from the Application List's **New Application** button (no distinct path
of its own — it's a view state inside the OFW tab, not a separately routed page). **Component:**
`ofw_create_application.tsx`.

Two-step flow: **form → review → confirmed** (see [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md#3-create-application-wizard)
for the step-by-step UI breakdown). Sections on the form step: Personal Information,
Employment Information (including the auto-computed No. of Months and Insurance Start Date,
and the conflict-zone advisory), Beneficiaries (1–3), Required Documents (upload, optional at
this stage). The Review step is a read-only summary before **Confirm & Submit**; nothing is
added to the applications list until that click.

## 4. OFW Payment Transactions

**Path:** `/ofw/payment-transactions` · **Component:** `ofw_payment_transactions.tsx`
(thin OFW-specific wrapper around the shared `product_payment_transactions.tsx` shell) ·
**Tab key:** `ofw-payments`

One row per **paid** OFW application (filtered `isPaid`), since OFW has no installment
ledger — each policy is a single one-time payment. Printable receipt per row. Whether the
logged-in role can record a new payment is resolved via `canCreatePayments(role, 'OFW')`
from `lib/roles.ts`.

## 5. Consolidated Non-Life Payment Transactions

**Path:** inside the main **Pay Tran** page's "Non-Life" tab (shared with PD Life's own
tab — see `payment_transactions.tsx`'s tab switcher) · **Component:**
`nonlife_payment_transactions.tsx`

All three non-life products (CTPL/OFW/GTP) in one product-filterable table, each OFW row
correlated by Policy Number (COI No.) + Reference No. rather than a real FK (see
[`ARCHITECTURE.md`](./ARCHITECTURE.md#nonlifepaymenttransaction-and-ofw)). OFW's accent color
in this shared view is `#008cb4`, distinct from the `#002f6c` navy used on OFW's own
dedicated pages.

## 6. Branch Directory — OFW / Branch Locator view

**Path:** `/branches` (shared page — no OFW-specific path segment; the *view mode*, not the
route, changes with the selected product) · **Component:** `branch_directory.tsx`

When OFW (or CTPL/GTP) is the selected product line, Branch Directory defaults to the
**Branch Locator** view — a region picker with expandable regions — mirroring
`ofwinsurance.ph/ofw-branches` directly (PD Life instead defaults to a Grid Cards view). The
18 branches shown are transcribed from that live page and are all tagged Non-Life; there is
no OFW-only subset of branches distinct from CTPL/GTP's.

## 7. Marketing Dashboard — OFW view

**Path:** `/marketing` (shared page, product-scoped by the selected product line, no distinct
OFW path) · **Component:** `marketing_dashboard.tsx`

With OFW selected, the page swaps its site-content model from `paramountdirect.com`'s pages
to **`ofwinsurance.ph`**'s own pages and the OFW application form's actual sections (drop-off
funnel labeled "Where applicants abandon the OFW online application form", rather than the
generic "multi-step form, across all products" copy shown for other products). All GA/
source/drop-off statistics are zeroed (no fabricated analytics) — see the root handover §2.

---

## Route reference (`lib/routes.ts`)

```
'ofw-dashboard'    -> /ofw
'ofw-applications' -> /ofw/applications
'ofw-payments'     -> /ofw/payment-transactions
```

`ofw-applications` is one of the two tabs (alongside `ctpl-applications`) whose path can
carry a trailing record id/reference number (`TABS_WITH_RECORD_ID`), enabling direct linking
to a specific application's detail view/modal.
