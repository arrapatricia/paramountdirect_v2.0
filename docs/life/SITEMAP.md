# PD Life — Sitemap

Every PD Life page/route and how to reach it. For the sidebar's overall shape and shared conventions (product switcher, Maintenance/Audit Logs which are cross-product), see [`../general/SITEMAP.md`](../general/SITEMAP.md).

Routing has no router library — `src/lib/routes.ts` maps each sidebar tab id to a real browser path, synced via the History API in `App.tsx` (`buildPath`/`parsePath`), so every page below is a real bookmarkable URL, not just in-app nav state.

## Sidebar structure (PD Life selected)

With **PD Life** selected in the product switcher (`sidebar.tsx`), the nav is:

```
Dashboard
Applications  (accordion, expanded by default on login)
  ├─ Application Inquiry
  ├─ Application Screening
  └─ Follow-up Signature
Payment Transactions
Billing
Life Statistics  (accordion)
  ├─ Monthly Applications
  ├─ Daily Applications
  ├─ Follow-up Calls
  ├─ Signed Applications
  ├─ Screened Applications
  └─ Application Statuses
──────────────
Maintenance          (cross-product, re-skins to Life's red brand while Life is selected)
Audit Logs           (cross-product)
Users & Role Management  (System Admin only, cross-product)
```

Note: the sidebar item literally labeled "Applications" is an **accordion group**, not a page of its own — clicking it expands/collapses Inquiry/Screening/Follow-up Signature; it does not navigate anywhere by itself. There is also a standalone **Applications hub** page (`pdlife_applications_hub.tsx`) reachable via the `applications` tab id / `/applications` path, which is a landing dashboard with nav cards to the same three sub-pages plus overview stats — this is what a direct link to `/applications` or the `applications` tab shows, distinct from just opening the sidebar accordion.

## Page-by-page

| Page | Component | Path | Read-only vs editable | Notes |
|---|---|---|---|---|
| Dashboard | `dashboard.tsx` | `/` | Read-only (view only) | PD Life's primary landing page on login. Sales/YTD summary computed live from `screeningData` |
| Applications hub | `pdlife_applications_hub.tsx` | `/applications` | Read-only, links out | Overview stats (Total, Pending Screening, Issued, Unsigned) + 3 nav cards to Inquiry/Screening/Follow-up Signature |
| Application Inquiry | `application_inquiry.tsx` → opens `application_detail_{health,lifeaccident,comprehensive}.tsx` in `readOnly` mode | `/application-inquiry` | **Read-only** — no status changes, no section editing, no Edit buttons rendered (`hideEditButton`) | General inquiry registry; batch/single "Print Policy Certificate" modal |
| Application Screening | `application_screening.tsx` → opens the same detail pages **fully editable** | `/application-screening` | **Editable** | The actual workflow tool: claim, status changes, section edits, Issue confirmation |
| Application detail (Health) | `application_detail_health.tsx` | (opened as a sub-view of Inquiry/Screening, not its own top-level route) | Read-only or editable depending on entry point | |
| Application detail (Life & Accident) | `application_detail_lifeaccident.tsx` | same as above | same | |
| Application detail (Comprehensive) | `application_detail_comprehensive.tsx` | same as above | same | |
| Follow-up Signature | `life_followup_signature.tsx` | `/followup-signature` | Editable (log follow-ups, mark signed) | Master-detail: searchable list + timeline detail panel |
| Create Application | `pdlife_create_application.tsx` | opened via "New Application" button on Inquiry/Screening (no distinct top-level path) | Editable (multi-step form) | Category picker → live premium → Review → Confirm & Submit |
| Payment Transactions (PD Life) | `payment_transactions.tsx` | `/payment-transactions` | Editable (view/search/print; "PD Life" tab) | Has a "PD Life" / "Non-Life" tab switcher; Non-Life tab renders `nonlife_payment_transactions.tsx` inline |
| Billing | `billing.tsx` | `/billing` | Editable | Regular / E-Billing / Credit Card tabs + Create Billing + Reminder Schedule tab |
| Life Statistics — Monthly Applications | `life_applications_overview.tsx` (period='monthly') | `/statistics/monthly-applications` | Read-only | Computed live from `screeningData` |
| Life Statistics — Daily Applications | `life_applications_overview.tsx` (period='daily') | `/statistics/daily-applications` | Read-only | Same component, different period prop |
| Life Statistics — Follow-up Calls | `life_followup_calls.tsx` | `/statistics/followup-calls` | Read-only, **mock data** | `ScreeningItem` has no field representing a phone call/tier/outcome, so this can't be de-mocked without a data-model decision first |
| Life Statistics — Signed Applications | `life_signed_applications.tsx` | `/statistics/signed-applications` | Read-only view + "Mark as Signed" action (shared with Follow-up Signature) | Computed live from `screeningData` + shared `signedIds` |
| Life Statistics — Screened Applications | `life_screened_applications.tsx` | `/statistics/screened-applications` | Read-only | Computed live from `screeningData` |
| Life Statistics — Application Statuses | `life_application_statuses.tsx` | `/statistics/application-statuses` | Read-only | Computed live from `screeningData` |
| Maintenance (Life-branded) | `maintenance.tsx` + `premium_maintenance.tsx` | `/maintenance/:subTab` | Editable | Cross-product page; re-skins red while PD Life is the selected product. `/maintenance/*` URLs carry no product prefix, so a reload keeps whichever product was last selected |
| Audit Logs | `audit_logs.tsx` | `/audit` | Read-only (search/filter/CSV export) | Cross-product, wired to `GET /api/audit-logs` |
| Users & Role Management | `user_role_management.tsx` | `/users-roles` | Editable | Cross-product; gated to System Admin role only (sidebar entry + page itself) |

## Notes on access

- Application Inquiry vs Application Screening is the main read-only/editable split within PD Life itself — both render the *same* three detail components, distinguished only by the `readOnly` prop passed down from `App.tsx`.
- Screening's editability is further gated per-row by the screener-claim lock (see [`HANDOVER.md`](HANDOVER.md) §1.1) — an application claimed by another issuer shows an "Access Restricted" warning and cannot be opened for edits by anyone else until it reaches `Issued`.
- Follow-up Calls is the one Life Statistics page still on mock data; every other page under Applications/Life Statistics/Dashboard reads from the same live `screeningData` array (real backend applications, once PD Life is wired to the backend — see [`HANDOVER.md`](HANDOVER.md) §1's note that the frontend itself is not yet connected).
