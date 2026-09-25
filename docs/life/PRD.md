# PD Life — Product Requirements

Scope: PD Life only. For cross-product objectives and the full BRD/Gap Analysis cross-map covering all four products, see [`../general/PRD.md`](../general/PRD.md) and the root `DEVELOPER_HANDOVER.md` §5–6.

## 1. Purpose

PD Life is Paramount Direct's flagship product line: health, life & accident, and comprehensive insurance applications sold direct-to-consumer (paramountdirect.com / apply.paramountdirect.com), then screened, verified, priced, and issued by internal staff before transmission to the company's AS400-backed policy system ("iPeak"/LEAP Services). This system (the admin dashboard prototype) exists to validate the screening workflow, UI/UX, and premium logic ahead of the real PD System 2.0 rollout, and — uniquely among the four products — has a working outbound integration to the real iPeak UAT environment.

## 2. Application lifecycle / status model

```
Received → For Verification → For Evaluation → Paid → Issued
```

- **Received**: a new inbound application (from the public website's apply wizard, ingested via `POST /api/ingest/pd-life`, or created directly by staff). No screener assigned yet.
- **For Verification / For Evaluation**: intermediate screening stages — the specific business distinction between these two isn't encoded as separate business logic in the prototype; they're free status values a screener sets.
- **Paid**: premium payment has been recorded against the application.
- **Issued**: the terminal state. Reaching it requires the screener to explicitly confirm whether the client's physical application form is Signed or Unsigned (the `IssueConfirmModal` gate — see §3). Once Issued, the application's status is locked (no further status dropdown) and it's no longer subject to the screener-claim lock (anyone can view it).

**This list is intentionally narrower than the source BRD's status list** (Received, For Verification, For Evaluation, Duplicate, Denied, Withdrawn, Issued, Cancelled) — per explicit stakeholder direction to keep PD Life "as-is" for this engagement. **Duplicate, Denied, and Withdrawn are not modeled anywhere in PD Life** (unlike OFW/CTPL, which do model `Duplicate`). This is a tracked gap, not an oversight — see [`HANDOVER.md`](HANDOVER.md) §4.

There is also no dedicated **Payment Status** enum (Paid/Underpaid/Unpaid/Reversed) distinct from Application Status — Application Inquiry derives a two-value Paid/Unpaid payment badge purely from Application Status (`Paid`/`Issued` → Paid; anything earlier → Unpaid).

## 3. Screener assignment rules

- A new application starts with no screener (`screenedBy` null/empty, rendered as "-").
- **First issuer to open it from Application Screening claims it.** This is an atomic, race-safe operation (`PATCH /api/applications/pd-life/:id/claim` does a conditional `updateMany` guarded on `screenedBy` still being empty) — if two issuers open the same application at once, exactly one wins the claim and the loser is shown who won.
- Once claimed, the application is **locked to that issuer** for all further screening actions (viewing/editing/status changes) until it reaches `Issued`.
- **Issued applications are never locked** — any issuer can view an Issued application (read its detail, but it can no longer change status).
- Application Inquiry is unaffected by claiming — it's a separate read-only lookup path with no lock semantics of its own.

## 4. Issue confirmation (Signed/Unsigned) rule

Moving an application to `Issued` requires the screener to declare, via a blocking modal, whether the client's physical application form has already been signed:
- **Signed** → the policy is immediately resolved; it will show as "Signed" everywhere (Signed Applications, Follow-up Signature).
- **Unsigned** → the policy enters the Follow-up Signature chasing queue (see §5).

The status change and this decision commit together — there is no way to reach Issued without making this choice. (Currently this decision only updates frontend state, `signedFollowUpIds`; it is not yet persisted to a backend column — see [`HANDOVER.md`](HANDOVER.md).)

## 5. Follow-up Signature queue rules

A policy belongs in the Follow-up Signature queue while:
1. Application Status = `Issued`, **and**
2. It has not yet been marked Signed, **and**
3. Its (mock-derived) Policy Status is `INFORCE`, **or** it is `LAPSED` but has been lapsed **3 years or less**.

A policy lapsed for more than 3 years drops out of the queue entirely — chasing a wet-ink signature on a policy that lapsed that long ago is considered pointless. Within the queue, a row is further classified as:
- **Unsigned**: no print or email follow-up has been logged yet.
- **Followed Up**: at least one follow-up (print or email) has been logged, but the signature still hasn't come back.
- **Signed**: resolved — no longer counts toward either bucket above.

Follow-up Signature and Signed Applications share the same underlying "signed" flag, so marking a policy signed in either page reflects immediately in the other.

## 6. Billing rules

(`billing.tsx` / `billing_types.ts` — mock data, models what a LEAP `GetDueBilling`-style response would look like.)

- **Renewal-must-be-Regular**: any installment beyond the policy's first year (policy year ≥ 2) is classified `Renewal` and can only be billed through the **Regular** channel — Create Billing blocks attempts to put a Renewal policy on E-Billing or Credit Card, listing which selected policies are Renewals.
- **E-Billing plan-code eligibility**: only specific plan codes (`GSP`, `GPP`, `DRE`, `FIP`, `MSP`) are eligible for E-Billing — Create Billing blocks any selected policy whose plan code isn't in that list from being placed on an E-Billing run.
- Reminder Schedule (offsets like "30 days before due", "on due", "30 days after due") is split by First Year vs Renewal eligibility per row, editable but not wired to any real notification job.

## 7. User roles that touch PD Life

From `src/lib/roles.ts` (`ROLE_DEFINITIONS`, `PRODUCT_MODULE_MAP['PD Life']`, `ROLE_PERMISSION_TEMPLATES`):

| Role | Group | PD Life access |
|---|---|---|
| System Admin | System | Full read/write/delete on every PD Life module |
| DM Operations | Direct Marketing | Application Screening (read/write), Application Inquiry (read), Sending of Policy Docs (read/write), Sending of Billing (read/write), Payment Transactions & Ledger (read/write), Audit Logs (read) |
| DM POS | Direct Marketing | Application Inquiry (read), Payment Transactions & Ledger (read/write) — point-of-sale/cashiering |
| DM Marketing | Direct Marketing | Application Inquiry (read), CMS Content (read/write) |
| Contact Center | Direct Marketing | Application Inquiry (read), Follow-up Calls (read), Payment Transactions & Ledger (read) — read-only role |
| Life Cashier | Cashiering | Application Inquiry (read), Payment Transactions & Ledger (read) — no create/edit rights |
| Cashier Admin | Cashiering | Application Inquiry (read), Payment Transactions & Ledger (read/write) — plus the same across OFW/CTPL/GTP |

PD Life-specific modules (`PRODUCT_MODULE_MAP['PD Life']`): Application Screening, Application Inquiry, Follow-up Calls, Sending of Policy Docs, Sending of Billing, Payment Transactions & Ledger, Call Out, Maintenance & Rate Tables, CMS Content, Audit Logs. **"Sending of Billing" and "Call Out" are modules that describe committed-to workflows whose pages don't exist yet** (`MODULES_NOT_YET_BUILT`) — roles can be pre-configured for them so access is ready the day those pages ship.

`canCreatePayments(role, 'PD Life')` — only `System Admin`, `Cashier Admin`, `DM POS`, or `DM Operations` can record a new PD Life payment transaction.

## 8. Functional requirements — met vs not met

(PD Life rows from the root handover's Gap Analysis Cross-Map and BRD Cross-Map; see those sections for the full four-product picture.)

### Met (🟢)
- UI/UX: full redesign — dark mode, mobile-responsive, consistent card/table patterns, red branding.
- Audit Logs: backend logs every write (user/action/module/timestamp/IP); frontend viewer wired with search/module filter/CSV export.
- User Experience / streamlined navigation: sidebar reorganized, Life Statistics and Premium Maintenance added without cluttering existing nav.
- Login Page, Landing Page (per-product, not unified — see §6.2 gap below), Application Inquiry Page: all built.

### Partially met (🟡)
- System Integration (real-time iPeak sync): outbound Insert New Business / intended Update Status is live and verified against UAT; no inbound sync, and Update Status itself doesn't currently work (see [`ARCHITECTURE.md`](ARCHITECTURE.md)).
- Payment Logging: `LifePaymentTransaction` model + audit logging exist structurally; no real payment gateway to log against, and the frontend page (`payment_transactions.tsx`) isn't wired to it yet.
- Automate repetitive manual tasks (BRD 6.1): premium computation is automatic; application status changes still require manual screening action (by design — no auto-decisioning requested).
- Single View dashboard across products (BRD A.b): each product has its own dashboard; PD Life's `dashboard.tsx` is not a unified cross-product landing view.

### Not met (🔴)
- Data Reliability: out of scope (no data migration performed).
- Policy Maintenance: no structured module (beneficiary changes, post-issuance status updates) exists.
- SI Issuance: no Service Invoice generation for PD Life specifically (unlike CTPL, which has a real document-fill service).
- Reports: no reporting/export module — Life Statistics pages are dashboards, not extractable reports.
- Automated status reports / exception flagging (BRD B.b/B.c): not built.
- Eliminate constant manual monitoring via self-validating outputs (BRD objective): no exception-based notification system exists.

See [`HANDOVER.md`](HANDOVER.md) §5 for the prioritized list of what to do about these.
