# GTP — Developer Handover

**Scope:** GTP (Global Travel Protect Premium — travel insurance), one of the four product lines in the Paramount Direct admin dashboard prototype. This document covers GTP only. For the cross-product architecture, tech stack, and how GTP fits alongside PD Life/OFW/CTPL, see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) and, once written, [`../general/HANDOVER.md`](../general/HANDOVER.md).

This document is grounded in the code as of 2026-09-25 (commit `2d37dce` and earlier `91d3493`/`5331a61`/`3218154` for GTP backend wiring). Where it disagrees with the root handover's GTP row, that is noted explicitly (see §3).

---

## 1. What GTP Is

GTP mirrors the real public-facing form at `yourtravelinsurance.ph/online-applications`. It covers single-trip and multi-trip travel insurance, priced by destination category and day bracket, for Individual or Family applicants. Like OFW and CTPL, it is wired frontend↔backend against a real Postgres database via Prisma (`GtpApplication` model) — not just in-memory mock state — and has its own website-ingest webhook.

Key frontend files:
- `paramountdirect_v2/src/components/gtp_dashboard.tsx` — YTD KPI dashboard
- `paramountdirect_v2/src/components/gtp_application_list.tsx` — application list, detail modal, document section
- `paramountdirect_v2/src/components/gtp_create_application.tsx` — create-application wizard
- `paramountdirect_v2/src/components/gtp_types.ts` — `GtpApplication` type, status enum, Schengen/high-cost country lists
- `paramountdirect_v2/src/components/gtp_payment_transactions.tsx` — thin wrapper around the shared `product_payment_transactions.tsx`
- `paramountdirect_v2/src/components/premium_rates.ts` — GTP's rate table and rate-lookup functions (`getGtpSingleTripRate`, `getGtpMultiTripRate`)

Key backend files:
- `server/src/routes/applications.gtp.ts` — CRUD for `/api/applications/gtp`
- `server/src/routes/ingest.gtp.ts` — website-ingest webhook `/api/ingest/gtp`
- `server/src/services/gtpDocumentFill.ts` — Service Invoice PDF fill (see §3)
- `server/prisma/schema.prisma` — `GtpApplication` model

---

## 2. Premium Logic — Destination Category × Day Bracket

GTP premiums are computed entirely client-side, in `gtp_create_application.tsx`, against the rate table in `premium_rates.ts`.

### 2.1 Destination category auto-detection

There is no manual "category" field. `gtp_create_application.tsx` derives `destinationCategory` from the selected `travelType` and `destinations`:

```
destinationCategory =
  travelType === 'Domestic' ? 'Domestic'
  : destinations includes any of Hong Kong / United States / Canada ? 'Including'
  : 'Excluding'
```

`HIGH_COST_DESTINATIONS = ['Hong Kong', 'United States', 'Canada']` (`gtp_types.ts`) drives the `isHighCostDestination` check. Selecting any one of those three countries — even alongside others — bumps the whole application to the "Including USA/Canada/HK" rate tier. The UI surfaces this with an inline notice ("USA / Canada / Hong Kong selected — the higher 'Including' rate is automatically applied") rather than a silent recalculation, so screeners know why the premium moved.

### 2.2 Day-bracket pricing (Single Trip)

Single Trip premiums are priced off a fixed day-bracket ladder, not a per-day rate:

```
GTP_DAY_BRACKETS = [4, 8, 15, 24, 31, 45, 60]
```

`getGtpSingleTripRate(rates, category, applicationType, days)` finds the first bracket `days` falls at or under and looks up a flat rate keyed `Single Trip|{category}|{applicationType}|{bracket}`. Beyond 60 days, there is no bracket — the function falls back to the 60-day flat rate plus `Math.ceil((days - 60) / 10)` × an "each additional 10 days" add-on rate (key suffix `addtl10`). This ladder is duplicated three times in the rate table (`premium_rates.ts` lines ~127–176) for Including / Excluding / Domestic, each split further by Individual vs. Family (Family runs roughly 2.3–2.5× Individual per bracket, not a flat multiplier — verified against the actual rate card, not derived from a formula).

Premium is `0` until both `departureDate` and `returnDate` are set and produce a positive day count (`hasTravelDates` guard) — this was a deliberate fix so Single Trip no longer silently falls back to a fabricated 1-day quote when the form is incomplete.

### 2.3 Multi-Trip pricing

`Multi-Trip 90` and `Multi-Trip 180` are flat annual premiums per destination category — no day-bracket math at all: `getGtpMultiTripRate(rates, planVariant, category)` looks up `{planVariant}|{category}` directly (e.g. `Multi-Trip 90|Excluding`).

### 2.4 Add-ons

Cruise Coverage and Hazardous Non-Professional & Non-Competition Sports Coverage are each priced as a **percentage of the base premium**, not a flat fee — `cruiseCoveragePercent` (21.90%) and `hazardousSportsCoveragePercent` (126.30%) in the rate table, applied additively to `basePremium` before rounding. This matches how the live rate calculator on yourtravelinsurance.ph scales these add-ons with the selected plan rather than charging a fixed peso amount regardless of trip cost.

### 2.5 Schengen coverage auto-application

`isSchengenDestination = destinations.some(d => SCHENGEN_COUNTRIES.includes(d))` (`gtp_types.ts` lists the 26 Schengen member states, including non-EU members like Iceland, Norway, Liechtenstein, Switzerland). This is **not a separate line item or premium adjustment** — it is a compliance flag only. When true, the UI shows an inline notice that the required €30,000 / ₱2.5M medical emergency coverage is "automatically applied... no further action needed," and the flag is persisted on the application (`isSchengenDestination` field) and repeated in the detail-view Travel Details section with a badge. There is no evidence in the rate table of Schengen destinations being priced differently from other "Excluding" or "Including" destinations — the compliance requirement is assumed already baked into those category rates, not layered on top.

### 2.6 Senior applicant gate

Applicants 66 and older (`age > 65`, `calculateAge` off `birthdate`) cannot submit through the form at all — `canSubmit` is forced false and the UI shows a message directing them to email `yourtravelinsurance@paramount.com.ph` for manual assistance. This is a hard client-side gate, not a premium loading — no seniors' surcharge exists in the rate table.

---

## 3. Document Generation — Mixed State, Correcting the Root Handover

The root `DEVELOPER_HANDOVER.md` (§3, "Generated policy documents" row, as of its 2026-09-25 update) states: *"GTP: still the older mock-template render, no real GTP templates on hand yet."* That is **accurate for the frontend UI** but **stale regarding the backend** — as of this writing there is a real, working GTP Service Invoice fill service already committed (`server/src/services/gtpDocumentFill.ts` + `server/src/templates/gtp/gtp-service-invoice.pdf`, both landed in the `91d3493`/`5331a61` commits, before the root handover's 2026-09-25 revision). The nuance:

- **Backend (`applications.gtp.ts`):** the moment a GTP application's `isPaid` first flips true (at `POST` creation — GTP's website flow is already-paid on arrival, same as CTPL — or a staff `PUT`), the server calls `fillGtpServiceInvoice()`, which fills the same shared invoice template used by CTPL/OFW (`pdf-lib`, named AcroForm fields), pulls a number from the shared `invoiceNumbering.ts` series, and stores the result via `storeGeneratedDocument()` into the real `GeneratedDocument` table / S3, exactly like CTPL's Service Invoice.
- **Frontend (`gtp_application_list.tsx`):** the GTP document section still renders through the **old mock modal** (`PolicyDocumentsSection` / `PrintableDocumentModal` from `policy_documents.tsx`) — "View/Print" opens an in-app printable `<div>` built from a handful of application fields, not a fetch against `/api/documents` and a real PDF. Nothing in the GTP frontend calls the list/presign endpoints CTPL's list page now uses. So the real Service Invoice PDF the backend already generates and stores is currently unreachable from the GTP UI.
- **Policy Schedule, Policy Jacket, and OR** (the other three entries in `GTP_DOCUMENTS`, `gtp_application_list.tsx`) have **no fill service and no template at all** — these remain genuinely mock, same as the handover's framing implies.

Net: GTP is not "no real templates" across the board — it has one real, generated, stored artifact (Service Invoice) that the UI simply isn't wired to yet, plus three documents with no template on hand. Contrast with CTPL, which has two real templates (COC + Service Invoice) *and* a frontend wired to fetch/display them (`ctpl_application_list.tsx`'s "View/Print"/"Send to Client" call the real `/api/documents` endpoints).

See [`../../DATABASE_SCHEMA.md`](../../DATABASE_SCHEMA.md)'s Generated Documents section for the `GeneratedDocument` row shape GTP's Service Invoice writes into (`applicationType: 'GTP'`, `docKey: 'gtp-service-invoice'`, shared `6000000XXXXXX` invoice-number series with OFW/CTPL).

---

## 4. Data Model

`GtpApplication` (Prisma model, table `gtp_applications` as of migration `20260925080000_rename_tables_snake_case`):

| Field | Type | Notes |
|---|---|---|
| `id` PK | String (cuid) | |
| `travelType` | enum | `International` \| `Domestic` |
| `destinations` | String[] | |
| `departureDate` / `returnDate` / `daysOfTravel` | DateTime / DateTime / Int | |
| `applicationType` | enum | `Individual` \| `Family` |
| `travelerFirstName` … `mobileNumber` | String / DateTime | traveler identity/contact |
| `planVariant` | enum | `Single_Trip` \| `Multi_Trip_90` \| `Multi_Trip_180` |
| `cruiseCoverage` / `hazardousSportsCoverage` / `isSchengenDestination` | Boolean | |
| `status` | enum | `Received` \| `Cancelled` \| `Duplicate` |
| `isPaid` | Boolean | straight-through payment — true on arrival from the website, unlike OFW's verification gate |
| `policyNumber` UK / `referenceNo` UK | String? | assigned once paid/issued |

Relations: has many `NonLifePaymentTransaction` rows (`product = GTP`, via nullable FK — see the polymorphic-association note in `../../DATABASE_SCHEMA.md`).

The frontend `GtpApplication` type (`gtp_types.ts`) is field-for-field aligned with the backend model (per the root handover's §4 cross-reference table), including the optional `policyNumber`/`referenceNo`.

**Notably absent from the model:** no itemized VAT/DST/tax breakdown fields — `gtpDocumentFill.ts` treats the entire premium as VAT-exempt on the Service Invoice rather than guessing a split, unlike CTPL's reconciled Base+DST+LGT+VAT+fee formula. No `GtpBeneficiary`-style child table exists (OFW has one; GTP does not need one since GTP is a single-traveler-per-application product, not a policy with named dependents).

---

## 5. Known Gaps

Pulled from the root handover's Gap Analysis Cross-Map (§5, GTP section):

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Submission to Payment Transition (no validation checkpoint) | High | Addressed | The Review step before Confirm & Submit (§6 below) is the same redesigned checkpoint pattern as CTPL |
| Transaction Logs (user & system actions) | High | Partial | Backend audit logging exists structurally (every create/update/delete on `GtpApplication` writes an `AuditLog` row via `recordAudit`), but there are no real system-triggered events (payment gateway, iPeak-equivalent) to log against yet |
| Payment Audit Trail | High | Not started | No payment gateway integration exists to produce this trail from — GTP applications arrive already marked paid from the website, with no gateway callback trail behind that flag |
| Production Reporting | High | Not started | No production dashboard/export exists for GTP specifically; `gtp_dashboard.tsx` is a KPI dashboard, not an extractable report |
| Premium accuracy *(new, not in original Gap Analysis)* | — | Addressed | Real destination-category × day-bracket rate card, verified line-by-line against the GTPH Computation sheet, including Schengen auto-detection (§2 above) |

---

## 6. Application Lifecycle

Create Application follows the same **Review-step-before-Confirm-&-Submit** pattern as CTPL: the ID is only generated in `buildApplication()`, called from the "Confirm & Submit" button on the review screen — draft form state never touches the applications list or gets an ID until that point. This matches the BRD's desired "validation checkpoint" state directly and is the same redesign CTPL received against its own "Application Lifecycle Control" gap.

Status enum is narrow: `Received | Cancelled | Duplicate` — no `For_Verification`/`For_Evaluation`/`Issued` states like PD Life, and no OFW-style employment-verification gate. GTP is straight-through: `isPaid` is set true at creation (mirroring CTPL, not OFW), and documents (mock UI today, real Service Invoice generation on the backend) unlock the moment `isPaid` is true.

---

## 7. Recommended Next Steps

In priority order:

1. **Get real GTP document templates (Policy Schedule, Policy Jacket, OR) and wire the frontend to the existing Service Invoice fill service.** This is the highest-leverage next step for GTP specifically — it directly mirrors what already happened for CTPL (real COC + Service Invoice, frontend wired to `/api/documents`) and partially happened for OFW (real Service Invoice, but COI still mock because only static/flattened sample PDFs exist so far — see root handover §3). GTP is in-between: one real generated document exists server-side already, but the UI doesn't expose it. Wiring `gtp_application_list.tsx`'s "View/Print"/"Send to Client" to the real `/api/documents` list+presign endpoints (the same change CTPL already got) would close most of that gap without needing new templates at all — only Policy Schedule/Policy Jacket/OR need net-new fillable PDFs from Paramount.
2. **Build a payment-gateway/audit trail** so "Payment Audit Trail" and "Transaction Logs" gap items have real events to log against, not just structural audit logging with nothing behind it.
3. **Build production reporting/export** for GTP once the above is stable.
4. **Have yourtravelinsurance.ph actually call** the built `/api/ingest/gtp` webhook — see [`ARCHITECTURE.md`](./ARCHITECTURE.md) §2.

---

## 8. Cross-references

- [`../../DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) — full cross-product handover
- [`../../DATABASE_SCHEMA.md`](../../DATABASE_SCHEMA.md) — full schema reference
- [`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md) — cross-product architecture (once written)
- [`./SITEMAP.md`](./SITEMAP.md), [`./PRD.md`](./PRD.md), [`./DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), [`./ARCHITECTURE.md`](./ARCHITECTURE.md), [`./MANUAL.md`](./MANUAL.md) — the rest of this GTP doc set
