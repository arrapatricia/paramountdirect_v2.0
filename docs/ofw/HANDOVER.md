# OFW Product Line — Developer Handover

**Scope:** the OFW Compulsory Insurance product line only (`OfwApplication` and everything
built around it). For the cross-product picture (auth, iPeak, audit logs, other product
lines), see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) and
[`../general/`](../general/) once written.

**Last verified against code:** 2026-09-25.

---

## 1. What OFW Is, In This System

OFW Compulsory Insurance is Paramount Life & General Insurance Corporation's insurance
product for overseas Filipino workers, sold through `ofwinsurance.ph`. In this admin
dashboard it is one of the three "Non-Life" product lines (alongside CTPL and GTP), sharing
their navy/light-blue branding and several structural patterns, but with its own data model,
its own multi-step issuance workflow (employment verification → payment instruction →
payment confirmation), and its own document-generation service.

Unlike CTPL and GTP — which are straight-through, pay-on-submission products (`isPaid` is
already `true` by the time the application reaches this system) — OFW is **not**
paid-at-source. An application arrives `Unpaid`, and staff must verify the employment
contract and explicitly send a payment instruction to the client before the client even has
something to pay against.

Frontend: `paramountdirect_v2/src/components/ofw_dashboard.tsx`,
`ofw_application_list.tsx`, `ofw_create_application.tsx`, `ofw_types.ts`,
`ofw_payment_transactions.tsx`, `ofw_policy_endorsements.tsx`.
Backend: `server/src/routes/applications.ofw.ts`, `server/src/routes/ingest.ofw.ts`,
`server/src/services/ofwDocumentFill.ts`, `server/src/lib/ofwNumbering.ts`,
`server/src/lib/forex.ts`.

---

## 2. Rate Calculation

The published OFW rate card is expressed as **$0.0954 per day**, but the system (like the
legacy PD site) applies it as a **flat $2.90 per month** of the employment contract — the
two are consistent (`0.0954 × ~30.4 ≈ 2.90`) and $2.90/month is the actual constant coded and
editable in Premium Maintenance (`premium_rates.ts`, id `ofw-monthly-rate`, currently `2.90`
USD/month), verified against Paramount's own OFW premium computation sheet and published
rate table (e.g. 12 months = $34.80). The rate is the same regardless of land- or sea-based
coverage type — though Paramount Direct itself only sells the **land-based** package (the
create-application form hardcodes `coverageType: 'Land-based'`; `Sea_based` exists in the
Prisma enum for completeness/future use, and is handled in the Service Invoice month
calculation, see §4, but has no UI entry point here).

**No. of Months** is the actual pricing driver, not a raw day count:

- Computed client-side in `ofw_create_application.tsx` as whole calendar months between
  **Contract Start Date** and **Contract End Date** (`(end.year - start.year) * 12 +
  (end.month - start.month)`, minus 1 if the end day precedes the start day).
- **6-month minimum enforced**: if the computed month count is below 6, the form blocks
  submission (`isContractTooShort`, shown as an inline red warning) — this mirrors
  ofwinsurance.ph's own published minimum term.
- The field itself is read-only/auto-computed in the UI; there is no way to override it by
  hand.
- Premium = `contractMonths × monthlyRate`, rounded to 2 decimals.

**Insurance Start Date** (separate from Contract Start Date) cannot be backdated: if the
contract already started in the past, coverage starts today; otherwise it's aligned to the
contract start date. This is also auto-computed, not user-editable.

The premium is always in **USD** (`premium: "$XX.XX"` string). See §5 for how it converts to
PHP.

---

## 3. Employment Verification → Payment Instruction → Payment Confirmation

This is OFW's defining workflow, implemented entirely in
`ofw_application_list.tsx`'s "Employment Verification & Payment" section (rendered inside
`renderDetailSections`) and enforced server-side in `applications.ofw.ts`. It is a strict
three-step gate, and document generation only fires at the end of it:

1. **Employment Contract Verification** (`employmentVerified: 'Pending' | 'Yes' | 'No'`) —
   an issuer clicks **Yes** or **No** on the application detail page. Only `'Yes'` unlocks the
   next step; `'No'` is a recorded outcome with no further action implied by the UI itself.
   The server stamps `dateVerified` the first time this flips to `'Yes'` (both on `POST` and
   `PUT`, only if not already set).
2. **Send Payment Instruction** (`paymentInstructionSent: boolean`) — only shown once
   `employmentVerified === 'Yes'`. Clicking **Send Payment Instruction** sets the flag; the
   server stamps `dateProcessed` the first time this happens, and — the OFW-specific
   tracking field — records **`paymentInstructionSentBy`**, the display name (`firstName
   lastName`) of the logged-in user who sent it, looked up server-side from `req.user.sub`
   (see §6). This is a one-time stamp: later edits by other users never overwrite who
   actually sent it (`applications.ofw.ts`'s `PUT` handler only sets it `if
   (data.paymentInstructionSent && !current.paymentInstructionSent)`). It's shown in the
   application detail view next to the "Sent" badge, and in the paid quick-preview modal's
   "Application Status" section as its own field.
3. **Payment confirmation** (`isPaid: boolean`) — only shown (as "Awaiting client payment" /
   "Simulate Payment Received") once the instruction has been sent and the application isn't
   already paid. There is no real payment gateway wired up — clicking the button just flips
   `isPaid` directly via `onUpdate`. A `import.meta.env.DEV`-only "Simulate Payment (Test)"
   shortcut also exists, gated on the same two prior steps, purely for local testing (it
   disappears in a production build).

The moment `isPaid` first flips `true` (in either `POST` at creation or a staff `PUT`), the
server:
- Assigns the **COI Number** (`policyNumber`, via `generateUniqueOfwCoiNumber()` in
  `ofwNumbering.ts`) if not already set.
- Stamps `dateIssued`.
- Calls `generateAndStoreOfwDocuments()`, which fills and stores the real Service Invoice PDF
  (see §4). This runs in a try/catch that only logs on failure — a document-generation error
  never fails the request, since the payment/issuance itself already succeeded.

Document visibility in the UI (`PolicyDocumentsSection` in `policy_documents.tsx`, shared
with CTPL/GTP) is driven purely by `isPaid`, with an OFW-specific locked-state message that
narrates exactly which of the three gates is still open:
*"Documents will be available once employment is verified, payment instructions are sent,
and the client completes payment."* → *"Send the payment instruction to the client to
proceed."* → *"Awaiting confirmation that the client has completed payment."*

---

## 4. Service Invoice Generation (Real) — `ofwDocumentFill.ts`

As of 2026-09-25, OFW's **Service Invoice is a real, generated, S3-stored PDF** — no longer
the shared mock-template modal. This closes the gap noted in the root handover's Gap
Analysis ("SI & OR Issuance").

**Template:** `server/src/templates/ofw/ofw-service-invoice.pdf` — the actual fillable PDF
Bernadette sent, with PascalCase `_SVI`-suffixed AcroForm field names (a different template
revision from CTPL's own Service Invoice template, which uses lowercase field names — an
earlier implementation pass incorrectly assumed they were the same template and had to be
corrected).

**Tax breakdown** — reverse-engineered from and verified against the legacy Rails source
(`github.com/plgic/paramountdirect`, `app/models/ofw/application.rb`'s
`DocStamp`/`life_premium`/`non_life_premium`/`premium_tax`/`lg_tax`, and
`payment_transaction.rb`'s `invoice_data` `'ofw'` branch), and checked against a real sample
invoice — matches to the thousandth (₱/$ gross 64.681 → 63.113 net + 0.600 DST + 0.088 LGT +
0.880 other fees, all figures in USD):

- **Documentary Stamp (DST):** flat **$0.600**, fixed regardless of premium size (not
  proportional — matches `Ofw::Application::DocStamp` in the legacy model). Constant
  `OFW_DOC_STAMP = 0.6` in `ofwDocumentFill.ts`.
- **Life/non-life split:** `lifePremium = base * 0.3 - 0.3`; `nonLifePremium = (base * 0.7 +
  0.3 - OFW_DOC_STAMP) / 1.022`.
- **Premium Tax ("Other Fees" on the invoice):** `round(nonLifePremium * 0.02, 3 decimals)`.
- **LGT (Local Government Tax):** `round(nonLifePremium * 0.002, 3 decimals)`.
- **Premium (net of taxes):** `lifePremium + nonLifePremium`.
- **Entirely VAT-exempt** — unlike CTPL, there is no VATable/zero-rated/VAT-amount portion at
  all; the invoice's `Vat_Exempt_SVI` field carries the full base amount and
  `Vatable_Sales_SVI`/`ZeroRated_Sales_SVI`/`Vat_Amount_SVI` are all rendered as `'-'`.

**No. of Months on the invoice** is recomputed independently inside `ofwDocumentFill.ts`
(`computeMonths()`), mirroring the legacy `Ofw::EmploymentInfo#months`: whole calendar
months for land-based, 30-day blocks rounded up for sea-based. This is a second, standalone
computation from the create-application form's own month count (§2) — both should agree for
any application actually created through this system's UI, but they are not the same code
path.

**Invoice numbering:** uses `generateUniqueInvoiceNumber()` from
`server/src/lib/invoiceNumbering.ts` — the shared `6000000XXXXXX` series across
OFW/CTPL/GTP, not a per-product sequence (see [shared invoice numbering note](#5-invoice-numbering-is-shared-with-ctplgtp) below
and the general architecture doc once written).

**A rendering quirk worth knowing:** a handful of fields on this template ship with an
auto-size (`0pt`) default appearance that `pdf-lib` can't always recompute, which renders
blank rather than erroring. `EffectiveDate_SVI` is the one field caught so far and is forced
to a fixed 10pt font (`FIXED_FONT_SIZE_FIELDS`); this isn't applied to every field, since a
couple (e.g. the multi-line `ItemDesc_SVI`) rely on auto-sizing to fit their box. If a future
sample invoice comes back with another field blank, this is the first place to check.

The filled form is **flattened** (`form.flatten()`) before saving — a generated invoice must
not stay editable by whoever opens it, matching the legacy Rails app's
`pdftk.fill_form(..., flatten: true)`.

Storage: one immutable `GeneratedDocument` row per file
(`applicationType: 'OFW'`, `docKey: 'ofw-service-invoice'`), via `documentStorage.ts`'s
`storeGeneratedDocument()` — same mechanism CTPL uses. See root
[`DATABASE_SCHEMA.md`](../../DATABASE_SCHEMA.md#generated-documents) for the table shape.

### 5. Invoice numbering is shared with CTPL/GTP

By explicit design, the Service Invoice's own numbering series (`6000000XXXXXX`,
`invoiceNumbering.ts`) is **shared across OFW/CTPL/GTP** — not a per-product sequence —
because all three use the same invoice series/template in the real business process. Do not
split this per product; see the memory note `shared-nonlife-invoice-numbering.md` and the
general architecture doc for the mechanism.

---

## 6. Certificate of Insurance (COI) — Real, as of 2026-09-25

OFW's **Certificate of Insurance is now a real, generated, S3-stored PDF**, filled from the
actual fillable AcroForm templates (`DM_Certificate of Insurance BM/DH_withFields_07072026.pdf`,
sourced from the team's shared Drive folder) — no longer the HTML mock rendered through
`PrintableDocumentModal`/`DocRow`.

**Templates:** `server/src/templates/ofw/ofw-coi-dh.pdf` (Direct Hired) and
`ofw-coi-bm.pdf` (Balik Manggagawa) — selected in `fillOfwCoi()` by
`app.natureOfEmployment`. Both variants share the exact same 6 AcroForm fields (the DH
template's fields are also named `BM_*` — not a typo, that's how the template was built):

| Field | Filled with |
|---|---|
| `BM_Fullname` | `firstName middleName lastName`, uppercased |
| `BM_COIno` | `policyNumber` (the COI Number, §7) |
| `BM_MasterPolNo` | `G-3083` (DM/OFW Compulsory Insurance master policy number, same for both BM and DH — `OFW_MASTER_POLICY_NUMBER` constant in `ofwDocumentFill.ts`) |
| `BM_DateIssued` | `dateIssued` (falls back to "now" if unset) |
| `BM_Term` | `insuranceStart` to `contractEnd` |
| `QRCode_ofwCOI` (`PDFButton`) | Left untouched — no QR-code generation exists in this system; the template's own placeholder renders as blank |

The benefit table, legal wording, head-office/OFW-Ortigas-office letterhead, and Term of
Insurance clause are all baked into the template PDF itself (this is a real filled document,
not an HTML re-creation), so there is nothing to keep in sync with the real product on our
side beyond these 6 fields.

Generation is wired into `generateAndStoreOfwDocuments()` in `applications.ofw.ts`, right
alongside the Service Invoice call, in its own try/catch (a COI-generation failure doesn't
block the other). Stored the same way — one immutable `GeneratedDocument` row
(`docKey: 'ofw-coi'`) via `documentStorage.ts`. The frontend's `handleViewDoc`/`handleSendDoc`
in `ofw_application_list.tsx` fetch it via presigned S3 URL exactly like the Service Invoice
(`REAL_DOC_KEYS` map); the old HTML mock in `printableDocBody()` was removed for both and is
now only reachable for the **Official Receipt (OR)**, which still has no real template.

**To close the remaining gap:** source a real fillable OR template the same way the COI and
Service Invoice templates were sourced.

---

## 7. Data Model

Full reference: root [`DATABASE_SCHEMA.md`](../../DATABASE_SCHEMA.md#ofw-applications).
Summary of the OFW-specific fields worth calling out:

### `OfwApplication`

| Field | Notes |
|---|---|
| `referenceNo` (unique) | Assigned to every application as soon as it exists — paid or not. This is what staff use to look an application up pre-issuance, and is also the URL segment for the detail page (`/ofw/applications/:referenceNo`, see `lib/routes.ts`). |
| `policyNumber` (unique) | The **COI Number** — OFW's term for its policy identifier. Assigned only once `isPaid` first flips true. |
| `phRegion` / `phBarangay` | Added in migration `20260921132500_add_ofw_ctpl_gtp_missing_fields`, alongside the pre-existing `phAddress`/`phCity`. Default to `""` — `ofwinsurance.ph`'s own public form only collects city/province, not region or barangay, so ingested rows (§9) legitimately arrive with these blank; this is an expected data gap for ingested rows, not a validation bug. |
| `natureOfEmployment` | Enum `Direct_hired \| Balik_Manggagawa` in Prisma/zod — note the **underscore**, vs. the frontend `OfwApplication['natureOfEmployment']` TypeScript type which uses **hyphens** (`'Direct-hired' \| 'Balik-Manggagawa'`). `lib/api.ts`'s `OFW_NATURE_TO_API`/`OFW_NATURE_FROM_API` maps translate between the two at the API boundary — this is a real, permanent naming mismatch between frontend and backend conventions, not a bug to "fix" by aligning them (doing so would touch both the zod schema and every existing frontend literal). |
| `coverageType` | Same hyphen/underscore mapping applies (`Land_based`/`Sea_based` vs `'Land-based'`/`'Sea-based'`) via `OFW_COVERAGE_TO_API`/`FROM_API`. Only `Land-based` is reachable from the UI (§2). |
| `employmentVerified` | `Pending \| Yes \| No` — see §3. |
| `paymentInstructionSent` / `paymentInstructionSentBy` | See §3. `paymentInstructionSentBy` added in migration `20260925060000_add_ofw_payment_instruction_sent_by`. |
| `isPaid` | See §3. |
| `fxRate` / `premiumPhp` | See §5 (rate freeze behavior). `fxRate` is `NUMERIC(12,3)` (fixed-precision, not `Float`) specifically to avoid binary floating-point drift on a value clients are billed against — see memory note on this fix. |
| `dateReceived` / `dateVerified` / `dateProcessed` / `dateIssued` | Stamped at receipt, verification, payment-instruction-sent, and payment, respectively — see §3. |
| `screenedBy` | The issuer shown in the list — plain string, not a `User` FK. |
| `status` | `Received \| Spoiled \| Duplicate \| Reversed \| Cancelled` (workflow status — see §8 for how this differs from Policy Status). |

### `OfwBeneficiary`

Child table (migration `20260921132500_...`), replacing what would otherwise have been a
JSON blob. `applicationId` FK, cascade delete. At least one required, up to three per
application (`MAX_BENEFICIARIES = 3` in the create form). Fields: `fullName`,
`relationship`, `birthdate` (nullable — `ofwinsurance.ph`'s own form never collects a
beneficiary's birthdate, so ingested rows legitimately have `null` here even though the
staff-facing create form makes it optional-but-collectable). On edit, beneficiaries are
**wholesale deleted and recreated**, not diffed (`applications.ofw.ts`'s `PUT` handler) —
simplest correct approach given there are at most three.

---

## 8. Status Model Nuance: Workflow Status vs. Policy Status

`OfwApplication.status` (`Received | Spoiled | Duplicate | Reversed | Cancelled`) tracks
*what happened to the application as a record* — it is not the same axis as *where the
policy itself stands*, which is derived, not stored:

```ts
// ofw_types.ts — getOfwPolicyStatus()
Issued    — isPaid, and status is not Reversed
Cancelled — isPaid, but status is Reversed (paid, then refunded with endorsement)
Spoiled   — unpaid, and more than 7 days since dateReceived (auto-expires)
Pending   — unpaid, still within the 7-day payment window
```

This means an application can carry `status: 'Spoiled'` (a workflow status an issuer
explicitly set) independent of the *derived* `'Spoiled'` **policy** status computed purely
from the 7-day-unpaid rule — the two happen to share a label but are computed differently
(one is a stored enum value, the other a function of `isPaid`/`dateReceived`). Read
`getOfwPolicyStatus()` directly rather than assuming the displayed "Policy Status" badge is
just echoing the `status` column.

`Duplicate` exists on OFW (the Gap Analysis's Application Status list calls for it) — see
the root handover §4 for how this differs from PD Life, which has no `Duplicate`/`Denied`/
`Withdrawn` at all.

---

## 9. Website Ingest (`ofwinsurance.ph`)

`POST /api/ingest/ofw` (`ingest.ofw.ts`), authenticated by `WEBSITE_INGEST_API_KEY_OFW`
(shared-secret, `X-Api-Key` header — no logged-in user on the website's side). This is how
`ofwinsurance.ph` is *meant* to push a newly submitted application into this system without
anyone re-keying it. **As of this writing, the route is built and functional, but the
outbound call from `ofwinsurance.ph`'s own backend to this endpoint has not been added on
that site yet** — this mirrors the same "built but not called" state as CTPL's/GTP's own
ingest routes (see root handover §1 and the general architecture doc once written; only
`paramountdirect.com`'s PD Life ingest call is actually live).

The ingest schema is a strict subset/relaxation of the staff-facing create schema:
`phRegion`/`phBarangay` default to `""` (not required — see §7), `beneficiaries[].birthdate`
is nullable, and there is no `status`/`employmentVerified`/`paymentInstructionSent`/`isPaid`
in the payload at all — every ingested row starts `status: 'Received'`,
`employmentVerified: 'Pending'` (the Prisma column default), unpaid, unverified, exactly
like a staff-created application at its earliest stage. `fxRate`/`premiumPhp` are still
computed fresh on ingest, same as a normal `POST`.

---

## 10. Known Gaps (from the Gap Analysis, OFW section)

Pulled directly from the root handover's Gap Analysis cross-map (§5 there):

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Payment Tracking (static reference numbers, no TTL) | High | Not addressed | OFW application IDs/reference numbers don't expire; the derived "Spoiled" *policy* status (§8) is a 7-day soft-expiry in the UI layer, not a real TTL mechanism, and doesn't touch the underlying record. |
| Renewal Process (no new-vs-renewal detection) | High | Not addressed | Create Application always creates a brand-new record; there's no lookup-by-reference-number or renewal path. |
| Payment Transaction Logging | High | Partial | Backend audit logging exists structurally (every create/update writes an `AuditLog` row), but there's no real payment gateway producing events to log against. |
| SI & Official Receipt Issuance | High | Partial | **Service Invoice and Certificate of Insurance are now real** (§4, §6). **OR is still mock** — no fillable template on hand. |
| Premium accuracy *(new, not in original Gap Analysis)* | — | Covered | Real $2.90/month (~$0.0954/day) rate card replacing a placeholder flat rate, verified against the live site's own published table (§2). |

---

## 11. Recommended Next Steps (OFW-specific)

In addition to the cross-product priorities in the root handover §7:

1. **Get a real fillable Official Receipt template** — no template has even been sourced
   yet; this is now the single highest-leverage remaining OFW document gap (COI and Service
   Invoice are both real as of §4/§6).
2. **Wire `ofwinsurance.ph`'s outbound ingest call.** The receiving endpoint
   (`POST /api/ingest/ofw`) is done and tested; the missing half is entirely on the public
   website's side (§9).
3. **Decide on a real Renewal Process** before this becomes a production system — right now
   every submission, including what should be a renewal of an existing policy, creates a
   brand-new `OfwApplication` row with no link back to the original.
4. **Payment Tracking TTL** — decide what a "reference number expires" rule should actually
   do (e.g. auto-transition `status` to `Spoiled` server-side, rather than only computing a
   derived Policy Status badge client-side) before relying on it operationally.
5. Reconcile the frontend hyphen vs. backend underscore enum convention
   (`natureOfEmployment`/`coverageType`, §7) into the shared cross-product data-model
   decision recommended in the root handover §7 item 3, if/when enums are revisited broadly.
