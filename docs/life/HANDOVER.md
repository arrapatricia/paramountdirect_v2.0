# PD Life — Developer Handover

**Scope:** PD Life only (the original/flagship product — health, life & accident, and comprehensive insurance applications, the screening workflow, and the iPeak/LEAP integration). For OFW/CTPL/GTP, see the general handover; for cross-product architecture and design conventions, see [`../general/HANDOVER.md`](../general/HANDOVER.md), [`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md) and [`../general/DESIGN_SYSTEM.md`](../general/DESIGN_SYSTEM.md) (links assumed; the concurrent general-docs pass may not have landed these paths yet).

Primary factual source for this document: the root `DEVELOPER_HANDOVER.md` (as of 2026-09-25) plus direct reading of the PD Life components/routes listed below. Where this document and the root handover appear to disagree (e.g. payment-ledger model naming), this document defers to the current source code.

---

## 1. What's built

### 1.1 Screening workflow

PD Life applications move through a fixed status pipeline:

```
Received → For Verification → For Evaluation → Paid → Issued
```

This is intentionally narrower than the BRD's full status list (which also has Duplicate, Denied, Withdrawn, Cancelled) — per explicit stakeholder direction to keep PD Life "as-is" during this engagement. `PdLifeStatus` (Prisma enum, `server/prisma/schema.prisma`) has only `Received | For_Verification | For_Evaluation | Paid | Issued`. **Duplicate/Denied/Withdrawn are not modeled anywhere in PD Life** — this is a known gap (see §5).

Three pages drive the workflow, sharing one UI kit:

- `application_screening.tsx` — the editable worklist. Tabs for All/Received/For Verification/For Evaluation/Paid/Issued, search by name/reference, source/product/date filters, and an `ApplicationStatusBar` counts strip (`application_status_bar.tsx`) that also renders the BRD's legacy statuses (Quoted, Cancelled, Withdrawn, Duplicate, Denied, For QA, No Status) as hardcoded 0 rather than fabricating data for statuses PD Life doesn't track.
- `application_inquiry.tsx` — a read-only lookup registry over the same data (`ScreeningItem[]`), with its own App Status / Payment Status filters and a batch/single "print policy certificate" modal. Opens the same detail page as Screening but in `readOnly` mode.
- `application_detail_{health,lifeaccident,comprehensive}.tsx` — one detail page per `PdLifePlanCategory`, all built from the shared kit in `application_detail_ui.tsx` (header, `StatusControl`, `Section`/`FieldGrid`/`Field` cards with inline edit, `IssueConfirmModal`).

**Screener claiming/locking:** a new application has no `screenedBy` (null/`''`, shown as "-" in the UI, matched via `isUnassignedScreener()` in `lib/api.ts`) and is open to any issuer. The first issuer to open it from Application Screening claims it — `application_screening.tsx`'s `handleViewDetails` calls `onSelectApplication`, which (in `App.tsx`'s `handleSelectScreeningApp`) calls `PATCH /api/applications/pd-life/:id/claim`. That route (`server/src/routes/applications.pdlife.ts`) does an atomic conditional `updateMany` (`WHERE id = ? AND (screenedBy IS NULL OR screenedBy = '')`) so a lost race just returns the winner's row — the loser's UI shows an "Access Restricted: assigned to Issuer ..." warning banner. Once claimed, the application is locked to that issuer until it reaches `Issued` (checked client-side in the list: `isLockedByOther`). Issued applications are never locked by screener — `application_screening.tsx` treats `status === 'Issued'` as always viewable, and `StatusControl` renders it as a plain locked badge (`Lock` icon) rather than a dropdown for anyone.

**Issue confirmation gate:** moving any detail page to `Issued` is gated behind `IssueConfirmModal` (in `application_detail_ui.tsx`) — the screener must pick Signed/Unsigned before the status change actually commits. The status change and that Signed/Unsigned decision are applied together via the page's `onIssueDecision` prop, wired in `App.tsx` to the same `handleMarkSigned` callback used by Follow-up Signature and Signed Applications' own "Mark as Signed" buttons (`setSignedFollowUpIds`). This is currently **frontend-only state** (`signedFollowUpIds` is a `useState` array in `App.tsx`, not persisted to any backend field) — there is no `signed`/`isSigned` column on `PdLifeApplication` in Prisma.

### 1.2 Follow-up Signature queue

`life_followup_signature.tsx` + `followup_signature_data.ts` track Issued applications still awaiting the client's physically-signed application form.

- **Queue membership** (`buildFollowUpRows` in `followup_signature_data.ts`): `status === 'Issued'`, and a derived `policyStatus` of `INFORCE` or `LAPSED`. A `LAPSED` row is deterministically mock-derived (`seed % 11 === 0`) with a mock "years lapsed" value (`(seed % 5) + 1`); rows lapsed more than 3 years are filtered out of the queue entirely (`lapsedYearsAgo > 3` → excluded) — chasing a signature on something that lapsed that long ago serves no purpose.
- `signed` on each row comes from the shared `signedIds` array (`App.tsx`'s `signedFollowUpIds`), so Follow-up Signature and Signed Applications (`life_signed_applications.tsx`) always agree on which policies are resolved.
- `isUnsigned(row)` = no print AND no email follow-up logged yet — distinct from `row.signed` (whether the client's physical form has actually come back). A row can be followed-up but still legally unsigned.
- The page itself is a master-detail UI: a searchable/filterable list (Unsigned/Followed Up/Signed/All tabs) on the left, and a detail panel on the right with a visual timeline (Policy Issued → [Application Form Shipped] → Print Follow-Up → Email Follow-Up → [Client Signature Received]) plus "log follow-up sent today" actions and a "Mark as Signed" button. All follow-up log state (`overrides`) is component-local (`useState`), not persisted anywhere — a page refresh loses it.
- Dates, policy numbers, and lapse/shipped/follow-up fields on `FollowUpRow` are entirely **mock-derived** from each `ScreeningItem`'s `id` as a numeric seed (not real backend fields) — there is no dedicated Prisma model backing this queue. The real policy number, once one exists, does come from `PdLifeApplication.policyNumber`, but `followup_signature_data.ts` still fabricates its own for display purposes rather than reading the real column.

### 1.3 iPeak (LEAP Services) outbound integration

Lives entirely in `server/src/services/ipeak/` and is PD-Life-only. See `server/src/services/ipeak/README.md` (also reproduced/expanded here since it's the most detailed source in the repo).

**Trigger points** (`applications.pdlife.ts`'s `PATCH /:id/status`):
- `Received → anything else` fires `submitNewBusinessToIpeak()` (Insert New Business).
- `→ Issued` fires `updateIpeakStatus(..., 'APR')` (Update Status) — **currently broken**, see below.

Both calls are `await`ed inside a try/catch that only logs on unexpected throw — a transmission failure (bad HTTP status, network error, missing config) is captured as a `PdLifeIpeakRequest` row with `success: false` and never blocks the screener's status update from committing.

**Env vars** (`server/.env`, not committed):
- `IPEAK_SERVICE_URL` — base URL **including** the Public Application Key segment (e.g. `http://ws.paramount.com.ph/test/workflowservice.svc/afpp`); only the web-method path (`/lifemb/newbusiness`, `/lifemb/update`) is appended per call.
- `IPEAK_PRIVATE_KEY` — sent as-is (unhashed) as the `Authentication-Hash` header. The LEAP doc describes a `hex(SHA256(privateKey + lowercased path/query))` scheme, but that returns `401` against the real UAT server; sending the raw key is what actually works (confirmed live, and matches the legacy PD system's own `LifeMbNewBusinessService`).

If either var is unset, `callIpeak()` (`client.ts`) never fires an HTTP request — it returns a failure result immediately and the orchestration functions persist a `PdLifeIpeakRequest{success:false, errorMessage:'iPeak integration is not configured...'}` row instead.

**Data sourcing:** `PdLifeApplication` has dedicated scalar columns for the insured's personal/employment details (added specifically for this integration — `firstName`, `middleName`, `lastName`, `gender`, `civilStatus`, `birthdate`, `nationality`, `billingAddress`, `residingAddress`, `heightCm`, `weightKg`, `occupation`, `companyAddress`, `sourceOfFunds`, `tin`, `sssNo`, `mobileNumber`, `telephoneNumber`, `email`), but the create/update routes don't populate them yet — the PD Life frontend still writes everything into the loose `details: Json` blob (`policyOwner`/`contact`/category-specific fields per `pdlife_types.ts`). `payloadBuilder.ts` reads the scalar columns first and falls back to parsing `details` for anything not yet populated, so the integration works today against real application data without waiting on that follow-up wiring.

**Known gaps / hard-won findings** (from `ipeak/README.md`):
- Auth doesn't match the LEAP doc (see above) — resolved by using the raw key.
- iPeak rejects a blank Agent/Branch-Manager section outright. `payloadBuilder.ts` hardcodes the legacy system's own house/direct-channel agent (GRACE R. ARTIZA / code 30831, branch manager LOLITA V. RUFO / code 23135) — **replace with PD Direct's actual assigned agent code once known**.
- **Update Status is broken.** `LifeLeap.PolicyNo` is typed `decimal` server-side (confirmed by a live `400` deserialization error), so the alphanumeric `PLANCODE-NNNNNN-D` policy number this app generates (`policyNumber.ts`) can't be sent there as-is — and neither Insert New Business's response (`ResponseData: 1`, just a row count) nor anything else observed gives a numeric policy identifier to use instead. `updateIpeakStatus` is fully wired but will always fail server-side until this is resolved with Paramount's iPeak/AS400 side.
- Field-length caps found only by testing, not fully documented: `ApplicationID` ≤ 15 chars, `CoverageType` ≤ 10 chars (both enforced via `truncate()` in `payloadBuilder.ts`).
- Owner/Bank/Policy-payment fields in the LEAP payload are typed placeholders — not collected anywhere in this app (PD Life is always insured-is-owner, matching the legacy implementation).
- `PdLifeStatus` has no Declined/Postponed states, so Update Status (once fixed) can currently only ever fire `APR`.

**Inbound — not yet wired.** Paramount shared a "Policy Inquiry" data contract (`policyInquiryTypes.ts`): given a Policy/App ID, iPeak would return a `PDPolicy` header plus `PolCoverages[]`/`PolBeneficiaries[]`/`PayHistory[]`/`Loans[]`. `distributePolicyInquiry.ts` exists and can turn a `PDPolicy` response into a `LifePaymentTransaction` upsert (keyed on `policyNo`), but **this was never tested against a live server** — the spec sheet gives only the data contract, not a URL or auth scheme, and it's under a different service label (`GAService`) than the outbound `WorkflowService`. There is deliberately no `client.ts`-style call wired for it yet. `PayHistory` (ledger/payment-transaction detail) is deliberately **not** persisted as its own table — read it back on demand from the most recent successful `PdLifeIpeakRequest{method: PolicyInquiry}` row's `responseBody`, rather than keeping a second normalized copy in sync.

**Verified working (2026-09-16):** a full round trip was run against the real UAT server and the real RDS dev database — create an application → `PATCH .../status` → `200 OK` / `"ResponseData": 1` from iPeak, with the request/response persisted on `PdLifeIpeakRequest`.

### 1.4 Screener-claim endpoint

`PATCH /api/applications/pd-life/:id/claim` — see §1.1. Notable: the claim is resolved using the *currently authenticated* user (`req.user.sub` → `prisma.user.findUnique`), not a name passed from the client, so a claim can't be spoofed as someone else.

---

## 2. Tech notes specific to Life

- **`billing.tsx` (Billing)** — due-date-driven view with three channel tabs: Regular, E-Billing, Credit Card (`billing_types.ts`'s `BillingChannel`), plus a Create Billing flow and an editable Reminder Schedule tab. Entirely mock data, **not wired to the backend** — `billing_types.ts` deliberately models its mock pool as what a `GetDueBilling`-style LEAP (iPeak) response would look like (`LeapDueBilling`, PascalCase/coded-enum fields matching `LifeNBPolicy`/`LifeLeap`'s style) and maps it into the plain camelCase `BillingRecord` the UI renders — this exists because iPeak has no due-billing retrieval method implemented yet on the outbound side (`server/src/services/ipeak/` only does Insert New Business / Update Status), so there's nothing real to fetch. Business rules enforced in the Create Billing flow: **Renewal installments must go through Regular Billing** (never E-Billing/Credit Card — `billingTypeFromYear(policyYear)` treats year 1 as First Year, year 2+ as Renewal), and **E-Billing is only eligible for specific plan codes** (`E_BILLING_PLAN_CODES = ['GSP','GPP','DRE','FIP','MSP']` — note GSP/GPP/FIP/MSP are legacy/traditional plan codes not otherwise modeled elsewhere in this app).
- **`payment_transactions.tsx` (Payments — PD Life)** — an installment ledger per policy (view/search/print), now with a "PD Life" / "Non-Life" tab switcher at the top (the Non-Life tab renders `nonlife_payment_transactions.tsx` inline). The frontend's local `PaymentTransaction`/`PaymentLedgerItem` interfaces here are mock-data shapes; the backend's persisted equivalent is `LifePaymentTransaction` (see §3) — the two are *not* wired together yet (page still runs on mock data per the root handover's Feature Inventory). `policyStatus` values (`Inforced/Lapsed/Terminated/Matured/Involuntary/Voluntary/Surrender`) match the BRD's Policy Status table and the Prisma `PolicyStatus` enum.
- **Premium logic** for PD Life create-application lives in `src/components/premium_rates.ts` + `pdlife_create_application.tsx`, editable via `premium_maintenance.tsx` — not persisted server-side (resets to seeded defaults on reload). No backend endpoint exists yet for rate maintenance.
- **Brand color:** PD Life is red (`#d0112b`), distinct from the Non-Life navy/light-blue (`#002f6c`/`#49b1ea`) used by OFW/CTPL/GTP (`src/lib/brand.ts`).

---

## 3. Data model (Prisma, `server/prisma/schema.prisma`)

### `PdLifeApplication`
- `id` (cuid), `applicationSeq` (autoincrement int — display as zero-padded 7-digit, e.g. `"0000001"`; distinct from `policyNumber`).
- `payor`, `planCategory` (`Health | LifeAccident | Comprehensive`), `planCode`, `planDesc`, `premium` (string), `source`, `dateReceived`, `dateScreened?`, `screenedBy?`.
- `status` (`PdLifeStatus`, default `Received`).
- `details: Json` (default `{}`) — category-specific structured data (policyOwner/contact/payor/category-specific fields), matching `pdlife_types.ts`'s `PdLifeApplicationDetails`.
- `policyNumber?` (`@unique`) — assigned once transmitted to iPeak; doubles as iPeak's `ApplicationID`/`PolicyNo`.
- Dedicated insured-detail scalar columns added for iPeak (not yet populated by the create/update routes — see §1.3): `firstName`, `middleName`, `lastName`, `otherName`, `gender` (`Gender` enum), `civilStatus` (`CivilStatus` enum), `birthdate`, `placeOfBirth`, `nationality`, `billingAddress`, `residingAddress`, `heightCm`, `weightKg`, `occupation`, `companyAddress`, `sourceOfFunds`, `tin`, `sssNo`, `mobileNumber`, `telephoneNumber`, `email`.
- Relations: `beneficiaries: PdLifeBeneficiary[]`, `ipeakRequests: PdLifeIpeakRequest[]`, `lifePaymentTransaction: LifePaymentTransaction?` (one-to-one, keyed by `policyNumber`).
- Indexes on `status`, `planCategory`. Table mapped to `pd_life_applications`.

### `PdLifeBeneficiary`
- `id`, `applicationId` (FK, cascade delete), `fullName`, `birthdate`, `relationship`, `sharePercent?`, `designation?`, `trusteeName?`, `createdAt`.
- Beneficiaries were promoted out of the `details` JSON blob into this real relation as part of the iPeak integration work — there's no frontend equivalent type yet (the frontend still keeps beneficiaries inside `LifeAccidentDetails.beneficiaries` / `ComprehensiveDetails.beneficiaries` in `pdlife_types.ts`).

### `PdLifeIpeakRequest`
- Per-call audit/retry trail, mirroring the legacy system's `LifeMbPendingRequest`. `id`, `applicationId` (FK), `policyNumber`, `method` (`PdLifeIpeakMethod`: `NewBusiness | UpdateStatus | PolicyInquiry`), `requestPayload: Json`, `responseBody: Json?`, `statusCode?`, `success` (default false), `errorMessage?`, `retryCount` (default 0), timestamps.
- No frontend equivalent — this is a backend-only audit trail, readable directly via Prisma/psql for debugging a failed transmission.

### `PdLifePolicyNumberSequence`
- One row per plan code (`planCode` PK), holding `lastNumber` — the atomic counter behind the `PLANCODE-NNNNNN-D` policy-number format (`policyNumber.ts`), incremented so concurrent submissions never collide.

### `LifePaymentTransaction` (the real, backend-persisted PD Life ledger/billing model)
- `policyNo` (`@unique`, FK to `PdLifeApplication.policyNumber`) — can only exist once an application has actually been issued a policy number by iPeak.
- Insured/contact fields (`title`, `firstName`/`middleName`/`lastName`, `birthdate`, `gender`, `currentAge`, `issueAge`, `address`, `mobileNumber`, `telephoneNumber`, `emailAddress`).
- Policy/ledger fields: `policyStatus` (`PolicyStatus` enum), `hcrStatus`, `hcrUnit`, `premium`, `hcrPremium`, `deposit`, `underpay`, `dueDate`, `payType`, `cashValue`, `lifeBenefits`, `accidentalBenefits`, `mode`, `issueDate`, `effectivityDate`, `policyDate`, `expiryDate`, `planCode`, `planDesc`, `orDate?`, `orNumber?`.
- Deliberately **no** per-installment child table — `PaymentLedgerItem` was removed; ledger/installment detail (iPeak's `PayHistory`) is read on demand from the most recent successful `PdLifeIpeakRequest{method: PolicyInquiry}` row instead of being duplicated and kept in sync.
- Not yet wired to any frontend page — `payment_transactions.tsx` still runs on local mock data.

---

## 4. Known gaps (PD Life rows, from the root handover's Gap Analysis and BRD cross-maps)

| Item | Priority | Status | Note |
|---|---|---|---|
| Data Reliability (migrated data has inconsistencies) | High | Not started | No data migration performed; fresh mock/seed data only |
| Policy Maintenance (no structured module) | High | Not started | No beneficiary-change/status-update workflow exists |
| System Integration (real-time iPeak sync) | High | Partial | Outbound (Insert New Business / Update Status intent) is live; no inbound sync, Update Status itself is broken (§1.3) |
| Payment Logging | High | Partial | `LifePaymentTransaction` model + audit logging exist, but no real payment gateway to log against, and no frontend wiring yet |
| SI Issuance | High | Not started | No Service Invoice generation for PD Life — unlike CTPL/OFW, PD Life has no document-fill service |
| Reports | High | Not started | Life Statistics pages are dashboards, not extractable reports |
| UI/UX | Medium | Done | Dark mode, mobile-responsive, red brand throughout |
| Audit Logs | Medium | Done | Every write logged; frontend viewer wired |
| User Experience / navigation | Medium | Done | Sidebar reorganized; Life Statistics + Premium Maintenance added |

**Status/enum gaps:** `PdLifeStatus` is missing `Duplicate`/`Denied`/`Withdrawn`/`Cancelled` from the BRD's fuller list (kept "as-is" by stakeholder direction). No dedicated Payment Status enum (Paid/Underpaid/Unpaid/Reversed) exists anywhere — `LifePaymentTransaction.policyStatus` covers policy lifecycle, not per-installment payment status.

**BRD 6.4 (iPeak Migration):** mostly out of scope for this engagement, with the one outbound exception above. No inbound path for iPeak's own results (policy issuance confirmation, service invoice, policy schedule) to flow back for client-facing document delivery — the PD Life frontend itself also isn't wired to the real backend (it still runs on `App.tsx`'s local `screeningData` mock state; see root handover §2), so nothing in the UI triggers the transmission yet even though the backend route is real and tested.

---

## 5. Recommended next steps (Life-specific)

1. **Wire the PD Life frontend to the real backend.** `screeningData` in `App.tsx` needs to move from local mock state to `pdLifeApi` (already stubbed in `lib/api.ts`) the same way OFW/CTPL/GTP already are — this is the single highest-leverage change, since the backend routes, claim endpoint, and iPeak transmission are all already real and tested.
2. **Resolve iPeak Update Status.** Needs Paramount's side to supply a numeric policy identifier usable in `LifeLeap.PolicyNo`, or confirmation that the field type can change.
3. **Get PD Direct's actual agent code** to replace the hardcoded GRACE R. ARTIZA / 30831 placeholder in `payloadBuilder.ts`.
4. **Decide on Duplicate/Denied/Withdrawn** — reconcile the BRD's fuller `PdLifeStatus` list against the current 5-state pipeline before more real data accumulates against the narrower enum.
5. **Populate the iPeak scalar columns directly** (firstName/lastName/etc.) from the create-application flow instead of only writing into `details: Json` — removes `payloadBuilder.ts`'s fallback-parsing path and makes the insured's data queryable directly.
6. **SI issuance for PD Life** — no document-fill service exists yet for this product line (CTPL has one, `ctplDocumentFill.ts`); PD Life would need its own once real fillable templates are available.
7. **Wire the inbound Policy Inquiry call** once Paramount provides a real endpoint/auth scheme — `distributePolicyInquiry.ts` and the `policyInquiryTypes.ts` contract are ready to receive it.
8. **Persist the Signed/Unsigned decision** (`signedFollowUpIds`) and Follow-up Signature's per-row overrides (`overrides` in `life_followup_signature.tsx`) to real backend fields — both are currently frontend-only `useState`, lost on reload.
