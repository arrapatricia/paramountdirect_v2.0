# OFW Product Requirements

Scope: the OFW Compulsory Insurance product line as implemented in this admin dashboard
prototype. Cross-references the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md)'s
Gap Analysis and BRD cross-maps, and [`../general/PRD.md`](../general/PRD.md) once written for
requirements shared across product lines.

---

## 1. Purpose

Give Paramount Direct staff (issuers/admins) a working registry and issuance workflow for
OFW Compulsory Insurance applications submitted through `ofwinsurance.ph`, replacing manual
tracking with: a real premium rate card, an explicit employment-verification and
payment-instruction gate before a client can pay, and automatic generation of the real
Service Invoice once payment is confirmed.

This is a **prototype/validation build**, not the final PD System 2.0 — it validates
workflow and premium logic ahead of real backend/payment integration work; see §7 for what
is deliberately out of scope.

---

## 2. Application Lifecycle & Status Model

### Workflow status (`OfwApplication.status`)

```
Received | Spoiled | Duplicate | Reversed | Cancelled
```

| Status | Meaning |
|---|---|
| `Received` | Initial status upon submission (staff-created or ingested from the website). |
| `Spoiled` | The application was not paid and only expired. |
| `Duplicate` | There's an existing application already. |
| `Reversed` | The application was cancelled and the payment was refunded. |
| `Cancelled` | Cancelled by the client. |

`Duplicate` is present here (unlike PD Life, which has no `Duplicate`/`Denied`/`Withdrawn` at
all per explicit stakeholder direction — see root handover §4). There is no dedicated
"Denied" or "Withdrawn" status on OFW; a rejected/abandoned application would presumably be
marked `Cancelled` in practice, though the system does not enforce or suggest that mapping.

### Policy Status (derived, not stored) {#status-model}

A separate, payment-driven view computed by `getOfwPolicyStatus()`:

| Policy Status | Rule |
|---|---|
| `Issued` | `isPaid` is true, and `status` is not `Reversed`. |
| `Cancelled` | `isPaid` is true, but `status` is `Reversed` (paid, then refunded with endorsement). |
| `Spoiled` | Unpaid, and more than 7 days since `dateReceived` (auto-expires in the UI). |
| `Pending` | Unpaid, still within the 7-day payment window. |

This is purely a computed/display concept — nothing server-side enforces the 7-day cutoff by
transitioning the stored `status` field; a "Spoiled" *policy* status is a UI judgment, not a
persisted state change. See [`HANDOVER.md §8`](./HANDOVER.md#8-status-model-nuance-workflow-status-vs-policy-status).

### Milestone dates

`dateReceived` (submission) → `dateVerified` (employment verified `Yes`) → `dateProcessed`
(payment instruction sent) → `dateIssued` (payment confirmed). Each is stamped once, by the
server, the first time its corresponding condition becomes true.

---

## 3. Rate Calculation Rules

- Flat **$2.90 per month** of the employment contract (editable via Premium Maintenance;
  equivalent to the published **$0.0954/day** rate).
- **No. of Months** = whole calendar months between Contract Start and Contract End dates
  (auto-computed, not user-entered).
- **6-month minimum contract term enforced** — submission is blocked below 6 months, with an
  inline warning.
- Same rate regardless of land- or sea-based coverage type, though only land-based is
  reachable from this system's create form.
- Premium is always expressed and billed in **USD**; see §5 for PHP conversion.

Full detail: [`HANDOVER.md §2`](./HANDOVER.md#2-rate-calculation).

---

## 4. Employment Verification Gate

**Requirement:** an application cannot progress toward payment until its employment contract
has been verified by staff. This is OFW's defining functional difference from CTPL/GTP,
which are pay-on-submission with no such gate.

- `employmentVerified` starts `Pending` on every new application (staff-created or
  ingested).
- An issuer must explicitly record **Yes** or **No** — there is no automatic verification.
- Only `Yes` unlocks the next step (Send Payment Instruction). A `No` outcome is recorded but
  the UI defines no further automated action from it (e.g. no auto-cancel).
- This gate is enforced only at the UI/workflow level (the "Send Payment Instruction"
  control simply isn't rendered until `employmentVerified === 'Yes'`) — the backend `PUT`
  endpoint does not itself reject a `paymentInstructionSent: true` update sent for an
  application whose `employmentVerified` is still `Pending`/`No`. This is worth knowing if a
  different client (e.g. a future direct API integration) bypasses the dashboard UI.

---

## 5. Payment Instruction Flow

1. **Send Payment Instruction** — only actionable once employment is verified `Yes`. Sets
   `paymentInstructionSent: true`, stamps `dateProcessed`, and records
   `paymentInstructionSentBy` (the sending user's display name, server-stamped once and never
   overwritten by later edits).
2. Until the instruction is sent, the `fxRate`/`premiumPhp` (USD→PHP conversion) refreshes on
   every edit. **Once sent, the conversion is frozen** — a forex swing afterward cannot
   change what the client already owes. `fxRate` is stored as fixed-precision
   `NUMERIC(12,3)`, not a float, specifically to avoid conversion drift on a client-facing
   billed amount.
3. **Payment confirmation** — a manual "confirm payment" action (`isPaid: true`) once the
   instruction has been sent. There is no real payment gateway; this is operator-confirmed.
   A dev-only "Simulate Payment (Test)" shortcut exists for local testing, gated behind the
   same two prior steps, and does not appear in a production build.

Requirement gaps: there is no automated reconciliation against an actual payment
provider/bank feed — see §7 and the root handover's Gap Analysis ("Payment Transaction
Logging").

---

## 6. Document-Gating Rules

Documents (Service Invoice, Certificate of Insurance, Official Receipt) are locked in the UI
until `isPaid` is true — enforced purely by conditional rendering in
`PolicyDocumentsSection` (`policy_documents.tsx`), not by a separate server-side
authorization check on document endpoints beyond `documentsApi` simply having nothing to
return for an unpaid application (no `GeneratedDocument` row exists yet, since generation
itself is triggered by the same `isPaid` transition).

| Document | Status |
|---|---|
| Service Invoice | **Real**, generated PDF (pdf-lib fill of a real fillable template), S3-stored, one immutable row per generation. |
| Certificate of Insurance (COI) | **Mock** — static in-app template render, not a real generated file. No real fillable template exists yet to build against (only flattened static samples for BM/DH variants). |
| Official Receipt (OR) | **Mock** — same static-render approach; no template has even been sourced. |

See [`HANDOVER.md §6`](./HANDOVER.md#6-certificate-of-insurance-coi--still-mock-and-why) for
why COI remains mock and what's needed to close the gap.

---

## 7. User Roles That Touch OFW

From `lib/roles.ts`'s `ROLE_DEFINITIONS` (the single source of truth for role → product
access):

| Role | Group | Access to OFW |
|---|---|---|
| **System Admin** | System | Full access to every product line, including OFW. |
| **OFW Admin** | Non-Life Product Admin | Full administrative access to the OFW product line specifically (single-product role). |
| **Non-Life Admin** | Non-Life Cross-Product | Issuance and overall view across OFW, CTPL, and GTP — for work spanning more than one non-life product. |
| **Non-Life Issuer** | Non-Life Cross-Product | Create issuance and extract reports across OFW/CTPL/GTP — no rate or configuration access. |
| **Non-Life Cashier** | Cashiering | Read-only view of OFW (and CTPL/GTP) payment transactions and application inquiry — no create/edit rights. |
| **Cashier Admin** | Cashiering | Full create/manage access to payment transactions across every product line including OFW, plus application inquiry — not a product/issuance admin. |

A user's product access is *derived* from their assigned role (`productsForRole`), not
picked independently — see root handover §3 (Users & Role Management). Whether a role can
record a payment specifically is centralized in `canCreatePayments(role, product)`, used by
`ofw_payment_transactions.tsx` and the consolidated non-life view alike.

---

## 8. Functional Requirements: Met vs. Not (Gap Analysis Cross-Map)

Reproduced from the root handover's OFW Gap Analysis section (§5 there):

| Gap Analysis item | Priority | Status | Notes |
|---|---|---|---|
| Payment Tracking (static reference numbers, no TTL) | High | Not addressed | Reference numbers/application IDs don't expire; the derived Policy Status "Spoiled" state (§2) is a UI-only judgment, not a real TTL enforcement mechanism. |
| Renewal Process (no new-vs-renewal detection) | High | Not addressed | Create Application always creates a new record; no lookup-by-reference-number or renewal path exists. |
| Payment Transaction Logging | High | Partial | Audit logging exists structurally (every create/update writes a row); no real payment gateway produces events to log against. |
| SI & Official Receipt Issuance | High | Partial | Service Invoice is now real (§6); OR remains mock. |
| Premium accuracy *(new)* | — | Met | Real $2.90/month rate card (equiv. $0.0954/day), verified against the live site's published table. |

Additional functional requirements implicitly met by the build, beyond the Gap Analysis
list:
- Auto-computed No. of Months with a 6-month minimum (data validation against a business
  rule — matches BRD requirement B.a).
- Mandatory Review step before Confirm & Submit (matches BRD's minimize-data-entry-risk
  objective and the "validation checkpoint" pattern also used by CTPL/GTP).
- Conflict-zone advisory acknowledgment, blocking submission until acknowledged for a
  flagged country.

Not met / explicitly out of scope for this engagement:
- Real payment gateway integration (Paynamics or otherwise).
- iPeak/AS400 connectivity for OFW (PD Life is the only product line with any live iPeak
  wiring — see root handover §6.4).
- Production reporting/export.
- CMS/website content management (parked cross-product, not OFW-specific).
