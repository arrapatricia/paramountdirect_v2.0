# Product Requirements Document

Synthesized from the app's actual built behavior (as of 2026-09-25) plus the BRD/Gap Analysis cross-maps in `DEVELOPER_HANDOVER.md`. This describes what the system does and is meant to do, not a wishlist — items not yet built are called out explicitly as gaps, not requirements in progress.

## 1. Purpose

Paramount Direct's admin dashboard ("PD 2.0") is the internal staff tool for processing insurance applications across four product lines — **PD Life**, **OFW** (Overseas Filipino Worker insurance), **CTPL** (Compulsory Third-Party Liability, motor vehicle), and **GTP** (Group Travel Policy) — from initial submission (via staff-entered data or a public-website webhook) through screening/verification, premium computation, payment confirmation, and policy-document issuance. It replaces a legacy PD v1 system and is being built ahead of a fuller integration with iPeak/AS400 (the insurer's core policy system) and Paynamics (payment gateway), per the *BRD: PD System Enhancement* and *Paramount Direct System: Gap Analysis*.

## 2. In scope

- Application intake for all four product lines: staff-entered creation, plus an inbound website-ingest webhook per product.
- Screening/verification workflow with per-product status models (PD Life's Received → For Verification → For Evaluation → Paid → Issued being the most elaborate; OFW/CTPL/GTP simpler Received/Cancelled/Duplicate-style flows).
- Real, verified premium computation per product (rate cards reconciled against each product's real published/legacy rate tables — see each product's own handover for the exact formula).
- Payment tracking: an installment ledger for PD Life, straight-through one-time payment records for OFW/CTPL/GTP.
- Policy document generation (Certificate of Cover, Service Invoice, etc.) for the products/documents that have real fillable templates on hand (CTPL: COC + Service Invoice; OFW: Service Invoice) — S3-stored, immutably logged.
- Role-based access control across an 11-role catalog, scoped per product line.
- Branch directory, marketing-dashboard analytics view (zeroed, not yet connected to real GA data), and audit logging across every write operation.
- One outbound integration: PD Life application status changes transmit to iPeak/LEAP Services (UAT-verified).
- Dark mode and mobile-responsive UI across the entire app.

## 3. Out of scope (explicitly, per stakeholder direction or current gap)

- **CMS / Website Content Management** — explicitly parked; nav placeholder only, no page built.
- **Inbound iPeak sync** — no policy-issuance/invoice results flow back from iPeak into this system yet; PD Life's UI itself is not yet triggering the outbound call from a live user action (the transmission fires from the backend route directly).
- **Paynamics / real payment gateway** — no payment events are logged because no real payment processing exists; ledgers exist structurally only.
- **Data migration from PD v1** — no migrated data exists; the system runs on fresh seed/mock data.
- **Reporting/export module** — no reports or production-reporting pages exist for any product.
- **Renewal detection (OFW)**, **Client Number capture (CTPL)**, **production dashboards (CTPL/GTP)** — not modeled.
- **Automated exception flagging / self-validating status reports** — no notification system beyond manual review exists.

See `DEVELOPER_HANDOVER.md` §5–6 and each product's own handover for the full Gap Analysis / BRD line-item cross-map.

## 4. User roles

Source of truth: `paramountdirect_v2/src/lib/roles.ts`. Products a role can access are *derived* from the role, not assigned independently.

| Role | Group | Products | Summary |
|---|---|---|---|
| System Admin | System | PD Life, OFW, CTPL, GTP | Full access everywhere; only role that can open Users & Role Management |
| DM Operations | Direct Marketing | PD Life | Screens applications, sends policy docs/billing, manages payment transactions |
| DM POS | Direct Marketing | PD Life | Point-of-sale/cashiering — records PD Life payments |
| DM Marketing | Direct Marketing | PD Life | Read-only application view, plus CMS website content |
| Contact Center | Direct Marketing | PD Life | Read-only: Application Inquiry, Follow-up Calls, Payment Transactions |
| Life Cashier | Cashiering | PD Life | Read-only payments + application inquiry |
| Non-Life Cashier | Cashiering | OFW, CTPL, GTP | Read-only payments + application inquiry, non-life |
| Cashier Admin | Cashiering | PD Life, OFW, CTPL, GTP | Full create/manage access to payments across every product, plus inquiry |
| CTPL Admin | Non-Life Product Admin | CTPL | Full admin, single product |
| GTP Admin | Non-Life Product Admin | GTP | Full admin, single product |
| OFW Admin | Non-Life Product Admin | OFW | Full admin, single product |
| Non-Life Admin | Non-Life Cross-Product | OFW, CTPL, GTP | Issuance + full view across all three non-life products |
| Non-Life Issuer | Non-Life Cross-Product | OFW, CTPL, GTP | Create issuance + report extraction across non-life products, no rate/config access |

Module-level permission templates (read/write/delete per module per role) live in `ROLE_PERMISSION_TEMPLATES` in the same file, and are rendered as an editable matrix in the Users & Role Management page.

## 5. Core cross-cutting requirements

- **Validation.** Every create-application flow enforces per-field required validation plus cross-field business rules (e.g. OFW's 6-month contract minimum, GTP's Schengen auto-detection, CTPL's plate/chassis format hints) before allowing submission.
- **Three-click rule.** Every page must be reachable within three clicks of the sidebar/product switcher from login — the sidebar is deliberately organized around product-line pills to satisfy this (BRD requirement A.c).
- **Mandatory Review step.** Every create-application wizard, across all four products, requires an explicit Review step before "Confirm & Submit" — the application record (and its ID) is only created after that confirmation, never from in-progress draft state. This directly addresses the BRD's "Payment Redirection Flow / Application Lifecycle Control" concerns about IDs or records being generated too early.
- **Audit logging.** Every create/update/delete on the backend writes an `AuditLog` row (user, role, action, module, timestamp, IP address); the Audit Logs page exposes this with search/module filtering and CSV export. This is treated as non-negotiable infrastructure, not a per-feature add-on.
- **RBAC.** Every page and API route is expected to respect the role/product/module permission model in §4; Users & Role Management is the only page gated to a single role (System Admin) at the page level today — other pages rely on the module permission matrix (backend enforcement should be verified per route, see each product's handover for current gaps).
- **Inline review over modals.** Per explicit stakeholder feedback, confirmation UI is inline (expand-in-place) rather than a modal dialog, except for gating genuinely irreversible actions (e.g. `IssueConfirmModal` before marking a PD Life application Issued).

## 6. Non-functional requirements

| Requirement | Target (from BRD) | Current state |
|---|---|---|
| Usability | Consistent, streamlined UI, three-click navigation | Met — dark mode, mobile-responsive, consistent card/table patterns, per-product branding |
| Reliability | 99.9% automated-output accuracy | Partially met — premium calculations verified against real rate cards; no live-transaction volume yet to validate at scale |
| Performance | Responsive UI, background processing for heavy jobs | Not yet applicable — no long-running background jobs exist to evaluate |
| Auditability | Every action traceable | Met — see Audit Logging above |
| Security | Role-scoped access, credential hashing | JWT + bcrypt in place; see `DEVELOPER_HANDOVER.md` §2 and §8 for current gaps (e.g. premium rates not yet backend-persisted, which is a data-integrity rather than security gap) |

## 7. Known gaps / out-of-scope items (from the Gap Analysis)

Pulled from `DEVELOPER_HANDOVER.md` §5 — see that section (and each product's own handover) for the full per-item status:

- No structured Policy Maintenance module (beneficiary changes, mid-term status updates) for any product.
- No production reporting/export for any product.
- Payment logging exists structurally (ledger/transaction models, audit-logged) but nothing posts against it because no real payment gateway is integrated.
- PD Life has no Service Invoice generation yet (unlike CTPL/OFW).
- CMS / website content management is entirely unbuilt (parked).
- OFW has no renewal-detection or payment-TTL logic; CTPL has no Client Number concept; GTP has no production dashboard.
- The BRD's fuller status enums (Duplicate/Denied/Withdrawn for PD Life; Paid/Underpaid/Unpaid/Reversed for payments generally) are not fully modeled — see `DEVELOPER_HANDOVER.md` §4 for the exact enum gap.
