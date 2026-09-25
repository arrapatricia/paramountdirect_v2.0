# GTP — Product Requirements

Scope: GTP (Global Travel Protect Premium) only. Cross-references the BRD ("BRD: PD System Enhancement") and Gap Analysis documents the whole engagement maps against — see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §5–6 for the full cross-map, and [`../general/PRD.md`](../general/PRD.md) for the cross-product PRD once written.

---

## 1. Purpose

GTP is Paramount's travel insurance product line, sold through `yourtravelinsurance.ph`. This admin dashboard's GTP module lets staff:
- review applications submitted from the public website (or entered manually by staff via Create Application)
- see premium computed automatically from the correct destination-category/day-bracket/plan-type rate, including automatic Schengen compliance flagging
- track payment status and (eventually) issue policy documents
- monitor GTP performance via a dedicated dashboard

It validates workflow/UI/UX and premium logic ahead of the real PD System 2.0 / iPeak integration — it is a prototype, not the production system. GTP has **no iPeak/AS400 connection** of any kind today (unlike PD Life, which has a live outbound integration — see root handover §1).

---

## 2. Application Lifecycle

```
[yourtravelinsurance.ph submission]  --or--  [staff Create Application wizard]
                |
                v
        status: Received  (isPaid = true, straight-through — no verification gate)
                |
                v
     [staff reviews, views documents, or marks Cancelled/Duplicate]
```

GTP has no `For_Verification`/`For_Evaluation`/`Issued` progression like PD Life, and no employment-verification-style gate like OFW. It is **straight-through payment**: `isPaid` is set true the moment the application exists (at `POST` creation, both from the website ingest and from staff Create Application), the same pattern CTPL uses — contrast with OFW, which requires an explicit Employment Contract Verification step before a payment instruction is even sent.

**Review-step-before-Confirm-&-Submit checkpoint:** the Create Application wizard generates the application's ID only inside `buildApplication()`, called from the "Confirm & Submit" button on the Review screen (`gtp_create_application.tsx`) — not earlier. Draft form state never touches the applications list or receives an ID until that point. This is the same redesigned pattern CTPL received against the BRD's "Payment Redirection Flow (no validation checkpoint)" gap, and directly satisfies the BRD's desired validation checkpoint for GTP's own "Submission to Payment Transition (no validation checkpoint)" gap item (see root handover §5, GTP table).

Status enum: `Received | Cancelled | Duplicate` (`GtpStatus`, `gtp_types.ts`). No `Denied`/`Withdrawn`/`Spoiled`/`Reversed` states exist for GTP (CTPL additionally has `Spoiled`/`Reversed`/`Cancelled`; PD Life is missing `Duplicate`/`Denied`/`Withdrawn` entirely — see root handover §4 "Status/enum gaps").

---

## 3. Rate Rules

Full technical detail in [`HANDOVER.md`](./HANDOVER.md) §2; summarized here as product requirements:

1. **Destination category is auto-detected, never manually selected.** Domestic travel type always prices as `Domestic`. International travel prices as `Including` (USA/Canada/Hong Kong) if any selected destination is one of those three, otherwise `Excluding`. Staff cannot override this — it is inferred purely from the Travel Type + Destination(s) fields.
2. **Single Trip pricing uses a day-bracket ladder** (up to 4, 8, 15, 24, 31, 45, 60 days; then a 60-day base + per-additional-10-days add-on beyond that), split further by Individual vs. Family — not a per-day rate.
3. **Multi-Trip 90 / Multi-Trip 180 are flat annual premiums** per destination category, with no day-bracket math.
4. **Cruise Coverage and Hazardous Sports Coverage are percentage add-ons** of the base premium (21.90% and 126.30% respectively as currently configured), not flat fees.
5. **Schengen coverage auto-detection:** any Schengen-member destination triggers an `isSchengenDestination` flag and a compliance notice (€30,000 / ₱2.5M medical emergency coverage), applied automatically with no separate line item and no manual toggle. This is a compliance/disclosure requirement, not a distinct premium adjustment as currently modeled.
6. **No quote is shown until travel dates are complete** — premium is `0` until both Departure Date and Return Date are set and yield a positive day count, to avoid silently quoting against a fabricated 1-day trip.
7. **Applicants 66 and older cannot self-submit** through the form; they are directed to email `yourtravelinsurance@paramount.com.ph` for manual handling. This is a hard eligibility gate, not a rate loading.

Rates are currently editable via Premium Maintenance (`premium_maintenance.tsx`) but **not persisted server-side** — this is a cross-product gap (see root handover §2, §7), not GTP-specific: any page reload resets rates to seeded defaults.

---

## 4. User Roles

From `paramountdirect_v2/src/lib/roles.ts` (11-role catalog, replacing the old sprawling legacy per-product role lists):

| Role | Product scope | GTP access |
|---|---|---|
| System Admin | All | Full |
| **GTP Admin** | GTP only | Full administrative access to the GTP product line |
| **Non-Life Admin** | OFW, CTPL, GTP | Cross-product administrative access spanning all three Non-Life lines, for staff whose work spans more than one product |
| **Non-Life Issuer** | OFW, CTPL, GTP | Cross-product issuance/creation access across all three Non-Life lines, without rate/configuration access |
| Non-Life Cashier | OFW, CTPL, GTP | View-only on payments + application inquiry |
| Cashier Admin | All | Can create payments across every product, including GTP |
| Contact Center | (Direct Marketing set) | Read-only on Application Inquiry, Follow-up Calls, Payment Transactions |

A user's product access is *derived* from their role (`productsForRole` in `roles.ts`), not picked independently — assigning a role to a user automatically grants (or withholds) GTP tab visibility. `canCreatePayments(role, 'GTP')` centralizes the "who can record a GTP payment" check used by `gtp_payment_transactions.tsx`.

GTP's own Maintenance sub-nav (per `roles.ts`'s per-product module list) includes: Group Corporate Accounts, Billing Schedule & Master Roll, Endorsements & Rates, Audit Logs — though as with rates above, most of these are navigation entries rather than fully built modules; verify against `sidebar.tsx`/`premium_maintenance.tsx` before assuming a given sub-page is functional.

---

## 5. Document Issuance Requirements (Currently Unmet)

GTP's document set (`GTP_DOCUMENTS` in `gtp_application_list.tsx`): **Policy Schedule, Policy Jacket, Official Receipt (OR), Service Invoice.**

Requirement per the BRD/Gap Analysis pattern established by CTPL/OFW: once payment is confirmed, these documents should be automatically generated as real filled PDFs, stored durably (S3 + `GeneratedDocument` row), and retrievable/printable/emailable by staff.

**Current state (see [`HANDOVER.md`](./HANDOVER.md) §3 for the full technical account):**
- **Service Invoice:** the backend *does* generate and store a real filled PDF (`gtpDocumentFill.ts`, shared invoice template/numbering with OFW/CTPL) the moment `isPaid` first flips true — but the frontend document section is not wired to fetch it; staff currently see only the old mock modal for all four document types.
- **Policy Schedule, Policy Jacket, OR:** no fill service and no template exist at all yet. These are genuinely mock/placeholder, with no path to becoming real until Paramount supplies fillable templates.

This requirement is **not met** for any of the four documents from a staff-facing perspective, even though one of the four (Service Invoice) is closer to done than it looks.

---

## 6. Functional Requirements — Met vs. Not Met (Gap Analysis)

| Gap Analysis item | Priority | Status |
|---|---|---|
| Submission to Payment Transition (no validation checkpoint) | High | Met — Review step redesign |
| Transaction Logs (user & system actions) | High | Partially met — audit logging exists structurally, no real system-triggered events yet |
| Payment Audit Trail | High | Not met — no payment gateway integration |
| Production Reporting | High | Not met |
| Premium accuracy *(new)* | — | Met — real day-bracket/destination-category rate card, Schengen auto-detection |
| Document issuance (Policy Schedule/Jacket/OR/Service Invoice) | High (implied by CTPL/OFW precedent) | Not met for 3 of 4 documents; partially generated but unreachable for the 4th (Service Invoice) |

See [`HANDOVER.md`](./HANDOVER.md) §5 for the same table with implementation notes, and root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §5 for how this compares against PD Life/OFW/CTPL.
