# Sitemap — Page & Route Inventory

Generated from `paramountdirect_v2/src/lib/routes.ts` (URL sync), `paramountdirect_v2/src/components/sidebar.tsx` (nav structure), and `App.tsx` (tab/product/sub-tab state machine). There is no router library — `App.tsx` holds `activeProduct` / `activeTab` / `activeSubTab` in React state, and `routes.ts`'s `buildPath`/`parsePath` translate that state to/from the browser's URL via the History API, so deep links, bookmarks, and back/forward all work without React Router.

Legend: **Shared** = one page, re-skinned per product via `lib/brand.ts`. **Product-specific** = a distinct component per product line.

---

## Auth

| Page | URL | Component | Notes |
|---|---|---|---|
| Login | (no path entry — shown when unauthenticated) | `login.tsx` | Real login against `/api/auth/login`; falls back to a hardcoded mock check offline |
| Forgot Password | (modal/sub-view of Login) | `forgot_password.tsx` | Mock only |

## Dashboard (per product)

| Page | URL | Component | Notes |
|---|---|---|---|
| PD Life Dashboard | `/` | `dashboard.tsx` | Sales/YTD summary, computed live from backend data once connected |
| OFW Dashboard | `/ofw` | `ofw_dashboard.tsx` | Product-specific |
| CTPL Dashboard | `/ctpl` | `ctpl_dashboard.tsx` | Product-specific |
| GTP Dashboard | `/gtp` | `gtp_dashboard.tsx` | Product-specific |

## Applications

### PD Life

| Page | URL | Component | Notes |
|---|---|---|---|
| Applications hub | `/applications` | `pdlife_applications_hub.tsx` | Landing page for the "Applications" sidebar group — overview stats + nav cards |
| Application Inquiry | `/application-inquiry` | `application_inquiry.tsx` | Read-only detail view (`readOnly` prop) |
| Application Screening | `/application-screening` | `application_screening.tsx` | Fully editable; status workflow Received → For Verification → For Evaluation → Paid → Issued |
| Application detail (shared UI kit) | (opened from list, no own path — `viewingId`-style in-page state) | `application_detail_{health,lifeaccident,comprehensive}.tsx` + `application_detail_ui.tsx` | Three category-specific pages share one detail UI kit (header, status control, section cards, field rows) |
| Follow-up Signature | `/followup-signature` | `life_followup_signature.tsx` | Tracks Issued applications awaiting signed form return; master-detail UI |
| Create Application | (wizard opened in-page, no own path) | `pdlife_create_application.tsx` | Category picker → live premium → Review → Confirm |

### OFW / CTPL / GTP (product-specific, same pattern each)

| Page | URL | Component | Notes |
|---|---|---|---|
| OFW Applications | `/ofw/applications` (+ `/ofw/applications/:id` for a specific record) | `ofw_application_list.tsx` | Record-id deep link supported (`TABS_WITH_RECORD_ID` in `routes.ts`) |
| CTPL Applications | `/ctpl/applications` (+ `/ctpl/applications/:id`) | `ctpl_application_list.tsx` | Record-id deep link supported |
| CTPL Endorsements | `/ctpl/endorsements` | (endorsements list, CTPL only) | Not present for OFW/GTP |
| GTP Applications | `/gtp/applications` | `gtp_application_list.tsx` | No record-id deep link (only CTPL/OFW have this) |
| Create Application (each product) | (wizard opened in-page) | `{ofw,ctpl,gtp}_create_application.tsx` | Rate card → Review → Confirm, same pattern as PD Life |

## Maintenance

Product-branded (re-skins to the active product line via `lib/brand.ts`), no product prefix in the URL — a reload keeps the previously selected product.

| Page | URL | Component | Notes |
|---|---|---|---|
| Maintenance landing | `/maintenance` | `premium_maintenance.tsx` (and siblings) | Sub-page carried as `/maintenance/{subTab}` |
| Premium Maintenance | `/maintenance/premiums` (nav entry currently commented out in `sidebar.tsx`) | `premium_maintenance.tsx`, `premium_rates.ts` | Frontend-only; not backend-persisted |
| Branch Directory | `/maintenance/branch` | `branch_directory.tsx` | Shared — mock CRUD, Branch Locator view for Non-Life products, Grid Cards default for PD Life |
| Marketing Dashboard | `/maintenance/marketing` | `marketing_dashboard.tsx` | Shared — switches source pages/sections per product |
| CMS (Website Content) | `/maintenance/cms` | *(none — placeholder nav entry only)* | Explicitly parked, not built |

## Payments

| Page | URL | Component | Notes |
|---|---|---|---|
| Payment Transactions (PD Life) | `/payment-transactions` | `payment_transactions.tsx` | Installment ledger; has an inline "PD Life"/"Non-Life" tab switcher |
| Billing (PD Life) | `/billing` | `billing.tsx`, `billing_types.ts` | Regular/E-Billing/Credit Card tabs + Create Billing + Reminder Schedule |
| OFW Payments | `/ofw/payment-transactions` | `ofw_payment_transactions.tsx` | One-time payment + printable receipt |
| CTPL Payments | `/ctpl/payment-transactions` | `ctpl_payment_transactions.tsx` | Same pattern |
| GTP Payments | `/gtp/payment-transactions` | `gtp_payment_transactions.tsx` | Same pattern |
| Non-Life consolidated Pay Tran | (surfaced inline inside the main Pay Tran page) | `nonlife_payment_transactions.tsx` | All three non-life products in one product-filterable table |

## Users & Roles

| Page | URL | Component | Notes |
|---|---|---|---|
| Users & Role Management | `/users-roles` | `user_role_management.tsx` | **System Admin only** (gated in `sidebar.tsx` and `App.tsx`); merged Users list + Role Access Matrix in tabs |

## Branch Directory

See Maintenance above — `branch_directory.tsx`, shared across products.

## Marketing

See Maintenance above — `marketing_dashboard.tsx`, shared across products.

## Audit Logs

| Page | URL | Component | Notes |
|---|---|---|---|
| Audit Logs | `/audit` | `audit_logs.tsx` | Shared, no product prefix; wired to `GET /api/audit-logs` with search/module filter + CSV export |

## Life Statistics (PD Life only)

| Page | URL | Component | Notes |
|---|---|---|---|
| Monthly Applications | `/statistics/monthly-applications` | `life_applications_overview.tsx` | |
| Daily Applications | `/statistics/daily-applications` | `life_applications_overview.tsx` | |
| Follow-up Calls | `/statistics/followup-calls` | `life_followup_calls.tsx` | Still mock — no data-model field represents a phone call yet |
| Signed Applications | `/statistics/signed-applications` | `life_signed_applications.tsx` | |
| Screened Applications | `/statistics/screened-applications` | `life_screened_applications.tsx` | |
| Application Statuses | `/statistics/application-statuses` | `life_application_statuses.tsx` | |

All Life Statistics pages match the legacy admin reference site and are PD-Life-only (no OFW/CTPL/GTP equivalents exist).

---

## Product-branded vs shared vs product-specific summary

- **Shared, product-branded** (one component, re-skins via `brand.ts`): Maintenance and all its sub-pages (Premium Maintenance, Branch Directory, Marketing Dashboard, CMS placeholder).
- **Shared, no branding needed** (identical for every product): Login, Users & Role Management, Audit Logs.
- **Product-specific** (a distinct component per product line, same layout pattern reused): Dashboard, Applications list/create/detail, Payment Transactions, per-product Statistics (PD Life only).
