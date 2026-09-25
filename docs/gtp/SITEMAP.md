# GTP — Sitemap

Every page/route in the GTP product line, as wired in `paramountdirect_v2/src/App.tsx` and `paramountdirect_v2/src/lib/routes.ts`. GTP has no router library — `App.tsx` holds top-level `activeTab` state and `lib/routes.ts` maps each tab to a real URL path synced via the History API, so a reload or a shared link lands back on the same tab.

For the other three product lines and shared pages (Maintenance, Users & Roles, Audit Logs, Branch Directory), see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §3 and, once written, [`../general/SITEMAP.md`](../general/SITEMAP.md).

---

## 1. URL ↔ tab mapping

From `lib/routes.ts`:

| URL path | Tab key | Page |
|---|---|---|
| `/gtp` | `gtp-dashboard` | GTP Dashboard |
| `/gtp/applications` | `gtp-applications` | GTP Application List (or Create Application, toggled by local state — see §3) |
| `/gtp/payment-transactions` | `gtp-payments` | GTP Payment Transactions |

Any tab key prefixed `gtp-` is recognized as belonging to the `GTP` product (`{ prefix: 'gtp-', product: 'GTP' }` in `lib/routes.ts`), which drives the product-scoped navy/light-blue branding described in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

`/maintenance/*` routes (Premium Maintenance, etc.) are shared across products and carry no product in the URL — see §4.

---

## 2. GTP Dashboard (`/gtp`)

Component: `gtp_dashboard.tsx`.

Landing page for the GTP product line — a KPI/analytics dashboard, not a to-do queue. Sections:
- **KPI cards:** Total Premium Collected (YTD), Annual Premium Target (with attainment %), New Applications (YTD, YoY %), Policies Issued (YTD, YoY % + conversion rate)
- **Travel Type donut** (International vs. Domestic), year-switchable (2026/2025)
- **Premium Collected — This Year vs Last Year** bar chart, monthly, with a narrative one-liner calling out the peak month
- **Application Type breakdown** (Individual vs. Family) plus Cruise/Hazardous Sports attach-rate counters, for the selected year
- **Top Destinations** — top 6 countries by application count, current year only

All figures are computed live from `gtpApplications` state in `App.tsx` (real backend data once `/api/applications/gtp` is reachable, mock seed data otherwise) — no hardcoded analytics numbers.

---

## 3. GTP Applications (`/gtp/applications`)

Component: `gtp_application_list.tsx`, or `gtp_create_application.tsx` when `isCreatingGtpApp` is true (both live under the same URL — the wizard is a local-state overlay, not a separate route).

### 3.1 Application List

- Search by traveler name or reference number; filter by Travel Type (All/International/Domestic); status tabs (All/Received/Cancelled/Duplicate) with live counts
- Table: Reference No., Traveler (+ Individual/Family badge), Destination(s) (+ Schengen Compliance badge when applicable), Travel Dates, Plan, Premium, Status, Action (view)
- Pagination, 20 rows/page

### 3.2 Application Detail (modal, opened from the list)

Sections: Traveler Information, Travel Details (with a Schengen compliance banner when applicable), Payment & Documents.

The Payment & Documents section is where the mock-document gap is most visible to a user — see [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) §3 and [`HANDOVER.md`](./HANDOVER.md) §3. If `isPaid` is false, a "Simulate Payment Received" button is shown (test/demo affordance, not a real payment gateway callback) — clicking it flips `isPaid` locally and via `PUT /api/applications/gtp/:id`.

### 3.3 Create Application wizard

Two steps, both on the same page (no separate URL): **form** → **review** → (on Confirm & Submit) **confirmed**.

- **Travel Details:** Travel Type (International/Domestic radio), Country Destination(s) (quick-pick chips for the 10 most common countries + a full alphabetical dropdown for the rest, multi-select), Departure/Return Date, auto-computed Days of Travel (read-only), Application Type (Individual/Family), Plan (Single Trip / Multi-Trip 90 / Multi-Trip 180)
  - Inline notice when a high-cost destination (USA/Canada/Hong Kong) is selected — explains the "Including" rate is auto-applied
  - Inline notice when a Schengen country is selected — explains the €30,000/₱2.5M compliance coverage is auto-applied
- **Traveler Information:** First Name, Surname, Birthdate (shows computed age inline), Email, Mobile Number
  - Applicants 66+ are blocked from submitting, with an inline message to email `yourtravelinsurance@paramount.com.ph` instead
- **Extra Protection:** Cruise Coverage, Hazardous Non-Professional & Non-Competition Sports Coverage (both checkboxes, both priced as a % of base premium)
- **Review step:** read-only summary of everything above plus the computed premium, with "Back to Edit" / "Confirm & Submit" — this is the validation checkpoint (see [`PRD.md`](./PRD.md) §2)
- **Confirmed screen:** shows the generated Reference No., Plan, and Premium, with a button back to the application list

---

## 4. GTP Payment Transactions (`/gtp/payment-transactions`)

Component: `gtp_payment_transactions.tsx`, a thin per-product wrapper (mirrors `ofw_payment_transactions.tsx`/`ctpl_payment_transactions.tsx`) around the shared `product_payment_transactions.tsx` shell.

Shows only `isPaid` GTP applications, one row per one-time payment (no installment ledger — that pattern is PD-Life-only): Policy Number, Reference No., Payor Name, Plan Label (`{planVariant} — {destinations}`), Premium, Date Received. Printable receipt. Row creation is gated by `canCreatePayments(currentUserRole, 'GTP')` from `lib/roles.ts` (see [`PRD.md`](./PRD.md) §4 for who that includes).

GTP rows also surface inside the **consolidated Non-Life view** — `nonlife_payment_transactions.tsx`, reachable from the main Pay Tran page — which combines OFW/CTPL/GTP rows into one product-filterable table. That consolidated page is currently local component state only; no frontend code posts to the backend's `NonLifePaymentTransaction`/`/api/payments-nonlife` route yet for any of the three products (see root handover §4).

---

## 5. Where else GTP appears

- **Premium Maintenance** (`/maintenance/premium-rates` area, `premium_maintenance.tsx`) — GTP's rate table (destination category × day bracket × application type, plus Multi-Trip flat rates and add-on percentages) is editable here, product-branded navy/light-blue when GTP is the active product. Not backend-persisted (resets on reload) — a cross-product gap, not GTP-specific (see root handover §2, §7).
- **Users & Role Management** — `GTP Admin` (single-product) and `Non-Life Admin`/`Non-Life Issuer` (cross-product, span OFW+CTPL+GTP) roles gate access to GTP pages; see [`PRD.md`](./PRD.md) §4.
- **Branch Directory** — GTP defaults to the "Branch Locator" region-picker view (all Non-Life products share this), not PD Life's Grid Cards default.
- **Marketing Dashboard** — currently only re-skins for OFW selection (ofwinsurance.ph pages/sections); it does not have a GTP-specific view yet.
