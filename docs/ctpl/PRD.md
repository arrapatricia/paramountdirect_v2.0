# CTPL Product Requirements

Scope: the CTPL (Compulsory Third-Party Liability motor vehicle insurance) product line within the Paramount Direct admin dashboard prototype. Cross-references: [`HANDOVER.md`](HANDOVER.md) for implementation depth, [`../general/DEVELOPER_HANDOVER.md`](../general/DEVELOPER_HANDOVER.md) for the repo-wide BRD/Gap Analysis cross-map this narrows down from.

Source documents this cross-maps against (referenced, not reproduced): *Paramount Direct System: Gap Analysis*, *BRD: PD System Enhancement*.

## 1. Purpose

CTPL is the compulsory third-party liability coverage every registered motor vehicle in the Philippines must carry (LTO requirement). Paramount sells it through ctpl.ph's public-facing quote/purchase flow; this admin dashboard is the internal system staff use to register, look up, issue, and endorse those applications/policies, and to generate the client-facing documents (Certificate of Cover, Service Invoice, Policy Schedule, Policy Jacket).

Unlike PD Life (screener-driven, multi-status workflow) or OFW (employment-verification gated), CTPL's business model is **straight-through**: the client pays on the website at the point of quote, and the policy is expected to already be paid by the time it reaches this system. The admin system's job for CTPL is less "process an application to a decision" and more "register what already happened, issue the documents, and handle post-issuance changes (endorsements)."

## 2. Application lifecycle

**Desired state (per the BRD's "Application Lifecycle Control" item):** an application should not receive an ID or enter the applications registry until it is actually, finally submitted — a user should be able to abandon a draft without polluting the system of record.

**Implemented state:** matches this directly. In `ctpl_create_application.tsx`, the application object (including its Reference No.) is only constructed inside `buildApplication()`, called from `handleConfirmSubmit()` — which only runs after the mandatory **Review** step, itself only reachable after all required fields validate (`canSubmit`). Draft form state (every keystroke up to that point) lives entirely in local React `useState` and never touches the applications list or gets an ID. This is called out as a 🟢 "redesigned" item in the Gap Analysis cross-map (see `HANDOVER.md` §7).

Status values (`CtplStatus`): `Completed | Spoiled | Duplicate | Reversed | Cancelled` — see `ctpl_types.ts`'s `CTPL_STATUS_DESCRIPTIONS` for what each means operationally (e.g. `Spoiled` = unpaid and expired, `Reversed` = cancelled with the payment refunded). This is a separate axis from **Policy Status** (`Issued | Cancelled | Spoiled | Pending`, derived by `getCtplPolicyStatus()` from `isPaid` + `status` + how long ago the application was received), which answers "where does the policy itself stand" rather than "what happened to the application record."

Once a policy is issued, further lifecycle changes go through **Endorsements** (non-financial corrections; Term Extension; Flat/Pro-Rata Cancellation) rather than editing the base application directly — see §5 and `ARCHITECTURE.md` §5.

## 3. Rate rules

See `HANDOVER.md` §2 for the full current rate table. Requirement summary:

- Premium is a flat amount determined by **Policy Type × MV Type × Term (1 or 3 Years)** — no per-vehicle-value or risk-based pricing, consistent with CTPL being a compulsory, government-mandated minimum coverage rather than a rated product.
- An optional flat **COV (Certificate of Validation) fee (₱60)** may be added at quote time for an additional verification service; this is additive to the rate-table premium, not a rate-table entry itself.
- Rates must be maintainable by non-engineering staff (addressed by the shared Premium Maintenance page) — not yet persisted server-side (see `HANDOVER.md` §7 gap).
- For-public-use motorcycles (habal-habal, etc.) are priced identically to regular motorcycles at the rate-table level, but are tracked as a distinct policy series (LCOC) for numbering/document purposes (§4).

## 4. Vehicle data requirements

A CTPL policy is legally tied to a specific vehicle, so the system must capture enough vehicle identity and description to (a) uniquely identify the insured unit and (b) print a correct Certificate of Cover / Policy Schedule. Required at minimum: plate number, MV file number, chassis/serial number. Also captured (needed for the printed documents, not strictly for underwriting): Year Model, Make, Series, Color, Body Type, Motor Number, Authorized Capacity, Unladen Weight.

Requirement: vehicle Year/Make selections should draw from an actual maintained reference rather than be freely typed, to reduce data-entry errors and mismatches against LTO records — addressed via `ctpl_vehicle_reference.ts` (mirrored from ctpl.ph's own picker). This is explicitly a **static snapshot**, not a live sync — the Gap Analysis's "Vehicle Master Data Integrity" item is only partially closed by this (see `HANDOVER.md` §7). MV Type itself (Car/Jeep/SUV/... within Private Car, etc.) remains a static hardcoded list (`CTPL_MV_TYPES_BY_POLICY`), not backed by any external master table.

## 5. Document issuance requirements

Every issued CTPL policy must produce, at minimum:

- **Certificate of Cover (COC)** — the client-facing proof of coverage.
- **Service Invoice** — the billing document, with its own invoice number drawn from the shared OFW/CTPL/GTP `6000000XXXXXX` series (see [[shared-nonlife-invoice-numbering]] and `HANDOVER.md` §4.5) and a reconciled Base + DST + LGT + VAT + flat-fee tax breakdown.
- **Policy Schedule** and **Policy Jacket** are also generated (the latter being boilerplate terms-and-conditions that vary only by policy-type prefix), rounding out the same four-document set the real business process issues.

Requirement: documents must be real, retrievable, re-viewable, and printable — not merely rendered once and discarded. Addressed: every generated PDF is stored immutably in S3 with a DB row (`GeneratedDocument`) recording when/what/by whom, retrievable at any later time via a presigned URL (`HANDOVER.md` §4.4). This is the one product line where "SI/COC Issuance" is fully 🟢 in the Gap Analysis cross-map, versus PD Life (🔴, not built at all) and OFW (🟡, Service Invoice real but OR still mock).

Requirement not yet met: an automated trigger from a real payment gateway or from LTO/ISAP-COCAF authentication — see §7 Gap Analysis, "Manual Authentication / Issuance."

Post-issuance change documents (endorsement forms, extension Service Invoices, Credit Memos for cancellations) are also expected — addressed via the `Endorsement` model's own document generation (`ctplEndorsementDocuments.ts`), each linked back to its endorsement via `GeneratedDocument.endorsementId`.

## 6. User roles

From the shared role catalog (`lib/roles.ts`), the roles relevant to CTPL:

- **CTPL Admin** — single-product role, full access to CTPL applications, payments, and (per `endorsements.ts`'s `APPROVER_ROLES`) endorsement review/approval.
- **Non-Life Admin** — cross-product (OFW + CTPL + GTP), same level of access as a single-product Admin but spanning all three non-life lines; also an endorsement approver for all three.
- **Non-Life Issuer** — cross-product, day-to-day issuing role without the Admin-level endorsement-approval authority implied by `APPROVER_ROLES` (only System Admin / Non-Life Admin / `{Product}` Admin appear in that list — Non-Life Issuer is not one of them, so an Issuer can request an endorsement but not approve a financial one).
- **System Admin** — implicitly an approver for every product (present in every `APPROVER_ROLES` entry), plus the only role that can reach Users & Role Management.
- **Non-Life Cashier / Cashier Admin** — payment-recording access per `canCreatePayments(role, 'CTPL')`, not CTPL-specific but relevant to the Payments page.

A user's product access is derived from role (`productsForRole`), not assigned independently — a CTPL Admin cannot be scoped to see only some CTPL applications.

## 7. Functional requirements: met vs not

Full detail in `HANDOVER.md` §7; summarized here against the Gap Analysis's CTPL-specific items:

| Requirement | Status |
|---|---|
| Application Lifecycle Control (ID only at final submit) | 🟢 Met — §2 above |
| Payment Redirection Flow (validation checkpoint before submit) | 🟢 Met — the Review step |
| Premium accuracy (real rate table) | 🟢 Met — §3 |
| SI/COC Issuance (real generated, storable documents) | 🟢 Met — §5 |
| User Access for Authentication (role-based) | 🟢 backend / 🟡 frontend — backend JWT+role gating is real (see `endorsements.ts`'s `assertProductAccess`/`assertApprover`); the frontend's mock login doesn't yet enforce per-role screen access |
| Vehicle Master Data Integrity | 🟡 Partial — real reference data, but static, not live-synced (§4) |
| **Manual Authentication / Issuance** | 🟡 Partial — **the key open gap.** Document *generation* is automated the instant `isPaid` flips true — but nothing in this system flips it except the website's own "already paid" submission or a direct staff edit. There is no payment-gateway webhook driving that flip, and no outbound call to LTO/ISAP-COCAF for the government-side authentication step real issuance requires. In other words: the generation half of "automated issuance" is real; the "what proves this was actually paid, and who tells LTO" half is not |
| Production Reporting | 🔴 Not started | No production dashboard/export exists |
| Client Number Capture | 🔴 Not started | No "Client Number" concept anywhere in the model |

## 8. Non-functional notes

- Document generation must not block or fail the application-submission response even if it errors internally (current behavior: logged server-side, swallowed — acceptable for demo purposes, but means a failed generation is currently invisible to staff; flagged as a gap in `HANDOVER.md` §7).
- Reconciled tax math (§5) was verified against real sample invoices, not just derived from a formula — this is a stated correctness bar for this product line specifically, since CTPL is the one line with government-mandated tax components (DST, LGT) that must match exactly.
