# CTPL Developer Handover

**Scope:** Compulsory Third-Party Liability (motor vehicle insurance), one of the four product lines in the Paramount Direct admin dashboard. CTPL is the most fully-built non-life product line — it is the only one with a real, working document-generation pipeline (fillable PDF templates filled with real data and stored in S3), and the only one with a real policy-endorsement workflow.

Cross-references: [`../general/DEVELOPER_HANDOVER.md`](../general/DEVELOPER_HANDOVER.md) (repo-wide handover this document narrows down from), [`../general/DATABASE_SCHEMA.md`](../general/DATABASE_SCHEMA.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`SITEMAP.md`](SITEMAP.md), [`PRD.md`](PRD.md), [`MANUAL.md`](MANUAL.md), [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

This document was produced by reading the actual code as of 2026-09-25 (`server/src/routes/applications.ctpl.ts`, `server/src/services/ctplDocumentFill.ts`, `server/src/routes/documents.ts`, `server/src/services/documentStorage.ts`, `server/src/lib/invoiceNumbering.ts`, `server/src/lib/ctplNumbering.ts`, `server/prisma/schema.prisma`, and the `ctpl_*.tsx` frontend components). Where the root `DEVELOPER_HANDOVER.md` was used as a source, it is called out explicitly.

---

## 1. What CTPL is, in this codebase

CTPL is wired frontend↔backend the same way as the other three product lines: `App.tsx` fetches applications from `/api/applications/ctpl`, and the create-application wizard / detail page / endorsement flows post back to the same backend. There is also a website-ingest webhook, `POST /api/ingest/ctpl` (shared-secret auth via a per-product env var, see §3), so ctpl.ph can push a submitted application in directly — though per the root handover, that outbound call from ctpl.ph itself hasn't been wired up on that site yet; the route exists and works, it's just not being called by the live site.

CTPL's defining characteristic versus OFW/GTP: **straight-through payment**. `CtplApplication.isPaid` is set `true` at creation itself (`ctpl_create_application.tsx`'s `buildApplication()` hardcodes `isPaid: true`, with the comment "Straight-through payment on the client's website - by the time it reaches this admin system, it's already paid"). There is no employment-verification-style gate like OFW's. This means document generation and policy-number assignment normally happen synchronously inside the `POST /api/applications/ctpl` request, not in a later staff action.

## 2. Rate table

Rates live in the shared `premium_rates.ts` (`PremiumRate[]`, product `'CTPL'`), keyed by `` `${policyType}|${mvType}|${renewalType}` ``, e.g. `'Private Car|Car|1 Year'`. Both the create-application wizard and the detail page's edit form look the rate up via `getPremiumRate(rates, 'CTPL', key, fallback)`, falling back to a `'CTPL|default'` row (₱606 base as of this writing — actual per-`mvType` rows are lower) if the specific combination isn't found.

Current 1-Year rates (flat, `PHP`):

| Policy Type | MV Type | 1 Year | 3 Years |
|---|---|---|---|
| Private Car | Car / Jeep / SUV / Utility Vehicle | ₱666.00 | ₱1,656.00 |
| Private Car | AC / Tourist Car | ₱785.96 | ₱2,166.00 |
| Commercial Vehicle | Light/Medium Truck (≤ 3,930kg) | ₱656.00 | ₱1,796.00 |
| Commercial Vehicle | Heavy Truck / Private Bus (> 3,930kg) | ₱1,246.01 | ₱3,486.00 |
| Commercial Vehicle | Taxi / PUJ / Mini Bus | ₱1,146.01 | ₱3,196.00 |
| Commercial Vehicle | PUB / Tourist Bus | ₱1,496.00 | ₱4,196.00 |
| Motorcycle | Motorcycle / w/ Side Car / Tricycle / Trailer (all one class) | ₱296.00 | ₱766.00 |

A separate flat **COV (Certificate of Validation) fee of ₱60** (`COV_FEE` in `ctpl_types.ts`) is added on top when the applicant opts into it (additional verification via DBP-DCI) — this is a UI/quote-time add-on, tracked as `requiresCOV: boolean` on the application, not a rate-table row.

**Rates are editable at runtime** via the shared Premium Maintenance page (`premium_maintenance.tsx`), but — as the root handover's Gap Analysis notes — that page is frontend-only; rates reset to their seeded defaults on reload, since there is no backend persistence for `premium_rates.ts` yet.

## 3. Vehicle description fields

`CtplApplication` carries a full vehicle description, added specifically so the real generated PDFs would have something real to print (see §4): `vehicleYear`, `vehicleMake`, `vehicleSeries`, `vehicleColor`, `vehicleBodyType`, `motorNumber`, `authorizedCapacity`, `unladenWeight`, plus the pre-existing `plateNumber` / `mvFileNumber` / `chassisNumber`.

- **Year** and **Make** are dropdowns sourced from `ctpl_vehicle_reference.ts`, which mirrors ctpl.ph's own "Select Your Vehicle" step (`c2c_car_info[year_model]` / `c2c_vehicle_maker_id`). Year is generated (`CURRENT_YEAR` back to 1960); Make is ctpl.ph's actual maker list, deduplicated case-insensitively but otherwise preserved as-is — including the live site's own near-duplicate/misspelled entries (`MERCEDES-BENZ` / `MERCEDEZ BENZ`, `PORSCHE` / `PORSHE`), since a real vehicle's CR may match either spelling.
- **Series**, **Color**, **Body Type**, **Motor Number**, **Authorized Capacity**, **Unladen Weight** are free-text. Series specifically is free-text because ctpl.ph cascades it from a per-maker trim catalog (`c2c_vehicle_trim_id`) of thousands of rows across 400+ makers — too large to mirror in this system.
- This is a **static snapshot**, not a live-synced table against ctpl.ph — noted as a residual gap in the Gap Analysis (§6, Vehicle Master Data Integrity).

## 4. Document generation pipeline (the real depth of this product line)

CTPL is the only product line with a real document-fill service (`server/src/services/ctplDocumentFill.ts`). The moment `isPaid` first flips `true` — which, for CTPL, is normally right at creation (see §1), but can also happen later via the staff `PUT` route if an application predates the straight-through flow or was created unpaid — the server fills and stores **four** PDFs:

| docKey | Template file | What it is |
|---|---|---|
| `ctpl-coc` | `ctpl-coc.pdf` | Certificate of Cover |
| `ctpl-service-invoice` | `ctpl-service-invoice.pdf` | Service Invoice (its own invoice number) |
| `ctpl-policy-schedule` | `ctpl-policy-schedule.pdf` | Policy Schedule |
| `ctpl-policy-jacket` | `ctpl-policy-jacket-{p,m,c,l}coc.pdf` | Policy Jacket (terms & conditions booklet) |

(The root handover, written before the Policy Schedule/Jacket templates were dropped into `server/src/templates/ctpl/`, only mentions COC + Service Invoice as "the two templates on hand so far" — that has since expanded to four; `applications.ctpl.ts`'s `generateAndStoreCtplDocuments()` now calls `fillCtplCoc`, `fillCtplServiceInvoice`, `fillCtplPolicySchedule`, and `fillCtplPolicyJacket` together.)

### 4.1 How the fill works

- Templates are **real fillable AcroForm PDFs** with named text fields (not scanned images or hand-built layouts) — loaded and filled with **pdf-lib** (`PDFDocument.load` → `form.getTextField(name).setText(...)` per field → `form.updateFieldAppearances()` → `form.flatten()` → `pdf.save()`).
- `form.getFieldMaybe(name)` is used, not `form.getField(name)` — a field missing from a given template revision is silently skipped rather than throwing, so a partial/older template doesn't hard-fail the whole request.
- `form.flatten()` bakes the values into the page content and removes the interactive form fields — mirroring the legacy Rails app's `pdftk.fill_form(..., flatten: true)` — so a generated document is not editable by whoever later opens it.
- Font encoding: the templates use standard Helvetica, which only supports WinAnsi. `toWinAnsi()` maps common out-of-range characters (₱ → `PHP `, curly quotes → straight, en/em dash → hyphen) and drops anything else, rather than letting `pdf-lib` throw mid-fill.
- The **Policy Jacket** is the one exception: it carries no per-application fields at all — it's boilerplate terms-and-conditions text that only varies by policy-type prefix (P/M/C/L, the same split `ctplNumbering.ts` uses for policy numbers). `fillCtplPolicyJacket()` just returns the matching static template's raw bytes.

### 4.2 Tax breakdown (Base + DST + LGT + VAT + flat fee)

`computeCtplBreakdown(base)` in `ctplDocumentFill.ts` is the single source of truth for the reconciled formula, verified against real sample invoices:

```
dst        = ceil(base / 4) * 0.5              // Documentary Stamp Tax
lgt        = round(base * 0.0075, 2)           // Local Government Tax
vat        = round(base * 0.12, 2)
otherFees  = 46                                // flat, not tax
vatExempt  = round(dst + lgt + otherFees, 2)   // for the invoice's VAT-exempt-sales line
total      = round(base + dst + lgt + otherFees + vat, 2)
```

`base` is parsed off the application's own `premium` string (`parsePremium()` strips everything but digits/dot), which itself already includes the COV fee if applicable (`totalDue` computed client-side at creation, stored as the `premium` field) — so the breakdown is derived from whatever was actually charged, not re-looked-up from the rate table.

### 4.3 The recent Unit/Total Cost bug fix

Documented directly in `fillCtplServiceInvoice()`'s code comment: the Service Invoice's **Unit Cost** and **Total Cost** fields must show the **grand total** (`breakdown.total`), not the base premium — confirmed against both the real CTPL and OFW sample invoices and the legacy Rails `payment_transaction.rb#invoice_data`. This is now fixed (`unit_cost: fmt(breakdown.total)`, `total_cost: fmt(breakdown.total)`); mentioned in the root handover as a bug caught and closed during the OFW Service Invoice investigation.

A related nuance: for a 3-Years policy, the invoice template has separate `curr_*` fields intended to show the *current year's* pro-rated charge on a multi-year policy. Per-year proration isn't implemented — the `curr_*` fields are filled with the same full totals as the regular fields rather than left blank, since leaving them blank on a real printed document would look more wrong than repeating the total.

### 4.4 Storage and the immutable record

`storeGeneratedDocument()` (`documentStorage.ts`) is shared by every product line's eventual document-fill service (CTPL is the only one using it today):

1. Uploads the PDF bytes to a private S3 bucket at `documents/{applicationType}/{applicationId}/{docKey}-{timestamp}.pdf`.
2. Writes one immutable `GeneratedDocument` row (`applicationType`, `applicationId` — **not** a DB-level FK, resolved in application code only, same polymorphic pattern as `NonLifePaymentTransaction`; `docKey`, `s3Key` unique, `contentType`, `invoiceNumber` if applicable, `generatedAt`, `generatedBy`).

`GET /api/documents/:id/url` returns a short-lived (5-minute) presigned S3 URL via `getSignedUrl`/`GetObjectCommand`, with `ResponseContentDisposition` overriding just the download filename (e.g. `coc-ABC1234.pdf`, using the application's plate number) without renaming the underlying S3 object. The bucket is private — this presigned URL is the only way to reach the bytes.

Document generation failures are swallowed, not surfaced to the caller: `generateAndStoreCtplDocuments()` wraps the whole `Promise.all` in try/catch and just `console.error`s — because by the time it runs, payment/issuance has already succeeded and a document-generation hiccup must not turn a successful application submission into a failed HTTP response. This means a silently-failed generation currently has no user-facing retry path; see §7.

### 4.5 Invoice numbering — shared across OFW/CTPL/GTP

See [[shared-nonlife-invoice-numbering]] (memory concept). The Service Invoice's own "Invoice No." (distinct from the application's Reference No. or the policy's Policy No.) is generated by `generateUniqueInvoiceNumber()` in `server/src/lib/invoiceNumbering.ts`: an 8-attempt random-digit loop producing `6000000XXXXXX` (7 fixed leading digits + 6 random), checked for uniqueness against `GeneratedDocument.invoiceNumber` (a DB unique constraint). **This is one series shared across OFW, CTPL, and GTP by design** — matching the real business process, where all three products use the same invoice series/template — not three independent per-product sequences. Do not split this into per-product numbering; see the memory note for why.

This is distinct from `generateUniqueCtplPolicyNumber()`/`generateUniqueCtplReferenceNo()` in `ctplNumbering.ts`, which are CTPL-specific series (see §5).

## 5. Policy/Reference numbering

- **Reference No.** (`referenceNo`, format `2600XXXXXX`) is assigned to **every** CTPL application the moment it exists, paid or not — it's what staff use to look an application up before any policy is issued. Assigned in both `POST /api/applications/ctpl` and the ctpl.ph ingest route.
- **Policy No.** (`policyNumber`, format `{PREFIX}COC-{10 digits}`) is assigned only once the policy is actually issued (i.e., the first time `isPaid` flips true). Prefix is `P` (Private Car), `C` (Commercial Vehicle), `M` (Motorcycle) — or `L` instead of `M` for a for-public-use motorcycle (habal-habal etc., tracked via `forPublicUse: boolean`), giving it its own LCOC series.
- Both generators retry up to 8 times against a DB uniqueness check (`findUnique` on the candidate) before throwing — not a DB sequence, just optimistic random-and-check.

## 6. Data model

See [`../general/DATABASE_SCHEMA.md`](../general/DATABASE_SCHEMA.md) for the full cross-product schema. CTPL-specific tables/fields:

- **`CtplApplication`** (table `ctpl_applications`): policy/MV type, renewal term, client/owner/applicant identity, owner address breakdown (`ownerAddress`/`ownerRegion`/`ownerCity`/`ownerBarangay`), vehicle identity (`plateNumber`/`mvFileNumber`/`chassisNumber`) + description (§3), `requiresCOV`, `effectiveDate`/`expiryDate` (defaulted from `renewalType` at issuance — 1 or 3 years out from "today"), `status` (`Completed | Spoiled | Duplicate | Reversed | Cancelled`), `isPaid`, `policyNumber`/`referenceNo`.
- **`GeneratedDocument`** (table `generated_documents`): see §4.4. Also carries an optional `endorsementId` FK (added after the root schema doc was last regenerated) linking a document to the endorsement that produced it (e.g. an endorsement form, a Term Extension's new Service Invoice, a Cancellation's Credit Memo) rather than to the base application.
- **`Endorsement`** (table `endorsements`): CTPL's policy-endorsement model — not yet documented in the root `DATABASE_SCHEMA.md` as of this writing. Polymorphic across CTPL/OFW/GTP the same way `NonLifePaymentTransaction` is (`product` enum + three nullable FKs, only one populated). Types: `Non_Financial` (name/address/vehicle corrections — auto-approved on submit), `Term_Extension` (additional premium, pushes `expiryDate` out, own Service Invoice), `Cancellation_Flat` / `Cancellation_Pro_Rata` (server picks Flat vs Pro Rata from the cancellation date vs the policy's `effectiveDate`; issues a Credit Memo on approval). Status lifecycle: `Pending → Reviewed → Approved | Denied` for financial types; non-financial types skip straight to applied/numbered. See `ARCHITECTURE.md` §5 for the request flow.
- **`NonLifePaymentTransaction`**: CTPL's row of the shared cashiering table (`product = CTPL`), keyed by `policyNumber`/`referenceNo` rather than a real FK (see root schema doc's polymorphic-FK note).

## 7. Known gaps (from the Gap Analysis cross-map)

Pulled from the root handover's §5 CTPL table, current as of this writing:

| Gap | Priority | Status | Note |
|---|---|---|---|
| Production Reporting | High | 🔴 Not started | No production dashboard/export exists for CTPL |
| Client Number Capture | High | 🔴 Not started | No "Client Number" concept exists anywhere in the CTPL data model |
| Vehicle Master Data Integrity | High | 🟡 Partial | Year/Make now sourced from a maintained reference (§3) instead of invented, but it's a static snapshot, not live-synced; Series stays free-text; `mvType` itself is still a static hardcoded list, not backed by a real LTO master table |
| Manual Authentication / Issuance | High | 🟡 Partial | Document *generation* is automated the moment `isPaid` flips true — but nothing yet *triggers* that flip except the website's own already-paid submission (or a staff `PUT`); there's no real payment-gateway integration, and no outbound call to LTO/ISAP-COCAF for authentication. Someone (the website, or staff) still has to be the one asserting "this is paid." |
| Application Lifecycle Control | High | 🟢 Addressed | ID (`referenceNo`) is generated in `buildApplication()`, called from Confirm & Submit *after* the Review step — draft form state never touches the applications list or gets an ID until final submit. Matches the BRD's desired state directly |
| User Access for Authentication | High | 🟢 (backend) / 🟡 (frontend) | Backend has JWT + role-based access control (`assertProductAccess`/`assertApprover` in `endorsements.ts` are a concrete example); frontend mock login doesn't enforce per-role screen access |
| Payment Redirection Flow (validation checkpoint) | Medium | 🟢 Addressed | The mandatory Review step before Confirm & Submit is that checkpoint |
| Premium accuracy | — (new) | 🟢 Addressed | Real per-Policy-Type/MV-Type rate table (§2), editable via Premium Maintenance (not yet persisted server-side) |
| SI/COC Issuance | — (new) | 🟢 Addressed | Real generated PDFs, tax breakdown reconciled, stored in S3 (§4) |

Additional gaps visible directly in code, not yet reflected in the Gap Analysis cross-map:

- **No payment-gateway trigger.** `isPaid` is set by whatever calls the API (the website's own already-paid submission, or a staff `PUT`) — there is no Paynamics/gateway webhook driving it.
- **Silent document-generation failures.** See §4.4 — a failure is logged server-side only; nothing in the UI tells staff a document didn't generate, and there's no manual "regenerate documents" action exposed yet.
- **Endorsement financial math is unverified against a second real-world source** the way the base premium/tax breakdown was — `ctplEndorsementCalc.ts` computes Term Extension/Cancellation amounts, but this handover did not independently re-verify those formulas the way the COC/Invoice breakdown was verified against real sample invoices.

## 8. Recommended next steps

1. **Wire a real payment-gateway (or at least a manual "Mark as Paid") trigger** for applications that arrive unpaid — right now `isPaid` only ever flips via the website's own already-paid submission or a direct staff `PUT`, with no UI control exposed for a staff-initiated "payment received" action from the detail page (the `ctpl_application_detail.tsx` "Simulate Payment Received" button exists but is explicitly a simulation, not a real payment confirmation flow).
2. **Surface document-generation failures to staff.** Add a "regenerate documents" action and/or an alert on the application when the fill service throws, instead of only a server console log.
3. **Move Premium Maintenance rates server-side** so CTPL rates survive a reload (shared with the repo-wide recommendation in the root handover).
4. **Independently verify the endorsement financial calculations** (`ctplEndorsementCalc.ts`) against real cancellation/extension invoices, the same way the base COC/Service Invoice tax breakdown was reconciled.
5. **Decide whether `mvType`/vehicle Year-Make should become a live-synced reference** rather than a static snapshot mirrored once from ctpl.ph, per the Vehicle Master Data Integrity gap.
6. **Scope the LTO/ISAP-COCAF authentication call** referenced in the Manual Authentication/Issuance gap — this is the one piece of "real" CTPL issuance that has no code footprint at all yet.
