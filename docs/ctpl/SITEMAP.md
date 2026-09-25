# CTPL Sitemap

Every page/route in the admin dashboard that belongs to the CTPL product line. URLs are synced via the History API in `App.tsx`, using the tab↔path table in `paramountdirect_v2/src/lib/routes.ts` (no router library is used). See [`../general/DEVELOPER_HANDOVER.md`](../general/DEVELOPER_HANDOVER.md) for how product-line routing/branding works in general, and [`HANDOVER.md`](HANDOVER.md) / [`ARCHITECTURE.md`](ARCHITECTURE.md) for the mechanics behind each page.

Sidebar entries for CTPL (`sidebar.tsx`, shown when CTPL is the selected product line):

| Nav label | Tab id | URL | Component |
|---|---|---|---|
| Dashboard | `ctpl-dashboard` | `/ctpl` | `ctpl_dashboard.tsx` |
| CTPL Applications | `ctpl-applications` | `/ctpl/applications` | `ctpl_application_list.tsx` (+ `ctpl_application_detail.tsx` / `ctpl_create_application.tsx`) |
| Endorsements | `ctpl-endorsements` | `/ctpl/endorsements` | `endorsements_queue.tsx` |
| Payment Transactions | `ctpl-payments` | `/ctpl/payment-transactions` | `ctpl_payment_transactions.tsx` |

`ctpl-applications` is the default landing tab for the CTPL product line (`resolveInitialNav` in `App.tsx`).

---

## 1. CTPL Dashboard (`/ctpl`)

`ctpl_dashboard.tsx`. Year-to-date performance view, computed live from real backend application data (no mock numbers), comparing 2026 against 2025 since this is the first year CTPL has its own dashboard on the new system.

- **KPI cards:** Total Premium Collected (YTD), Annual Premium Target (with attainment %), New Applications (YTD), COCs Issued (YTD) — each with a YoY delta.
- **Policy Type donut** (Private Car / Motorcycle / Commercial Vehicle), toggle between 2026/2025.
- **Premium Collected — This Year vs Last Year** bar chart, monthly, with the current month shown dimmed (month-to-date, not yet complete).
- **Top Vehicle Types** bar list, by LTO MV Type, current year.
- **Plate Ending Schedule** reference card — the LTO staggered-registration effectivity-month table (`PLATE_ENDING_SCHEDULE` in `ctpl_types.ts`), shown as a static reference, not tied to any application.
- **Recently Issued Policies** table — latest 8 paid applications with a `policyNumber`, showing Policy No., Reference No., Registered Owner, Policy/MV Type, Plate No., Premium, Date Received.

## 2. CTPL Applications (`/ctpl/applications`)

`ctpl_application_list.tsx` is the list/search/filter page. It branches into two very different detail experiences depending on payment state — this is a CTPL-specific pattern (see `DESIGN_SYSTEM.md`):

### 2.1 List view
- Search by owner name, plate number, or reference/policy number.
- Filter by Policy Type (`All` / Private Car / Commercial Vehicle / Motorcycle).
- Status tabs: `All`, `Completed`, `Spoiled`, `Duplicate`, `Reversed`, `Cancelled` — each tab shows a live count.
- Table columns: Reference No., Policy Number, Insured Name, Plate No., Premium, Issuer, COV badge, (Paid/Unpaid + policy-status) badge stack, and a "View" action.
- Pagination, 20 rows/page.
- "New Application" button → Create Application wizard.

### 2.2 Viewing a **paid** application → `/ctpl/applications/<referenceNo>` (full-page, read-only quick preview)
Rendered inline by `ctpl_application_list.tsx` itself (not a separate route component) when `viewingId` matches a paid row. Sections, top to bottom:
- Header: reference no., owner name + plate, premium, Paid badge, policy-status badge (Issued/Cancelled/Spoiled/Pending), COV badge if applicable.
- **Owner & Applicant** (icon: User) — registered owner, client type, email, mobile, applicant (if different), full owner address.
- **Vehicle Details** (icon: Car) — policy/MV type, plate, MV file number, chassis number, COV note if applicable.
- **Documents & Endorsements** (icon: FileStack) — the four real generated documents (Policy Schedule, Policy Jacket, COC, Service Invoice) via `PolicyDocumentsSection`, each with **View/Print** (opens the real generated PDF, see §2.4) and **Send to Client** actions; plus the embedded **Endorsements** list/creation UI for this one policy (`CtplPolicyEndorsements`, see `ARCHITECTURE.md` §5).
- **Consent** (icon: ShieldCheck) — Data Privacy Act (DPA) consent record with a "Print DPA" action opening a printable modal.
- **Remarks** — free-text remark log (remarks/recipients/sender/date/time), add-remark form.
- **Uploaded Documents** (labeled "COV Document" in this component) — ad-hoc file upload/view/send/delete list.
- "Back to CTPL Applications" footer button.

### 2.3 Viewing an **unpaid** application → separate component, `ctpl_application_detail.tsx`
A full page (not the list's inline view), reachable the same way but rendered by `App.tsx` routing to a different component when the target application isn't paid yet, since an unpaid application can still be edited. Two modes:
- **View mode** — same Section/FieldGrid/Field layout as the paid quick-preview (Application Status, Personal Information, Vehicle Details, Payment — with a "Simulate Payment Received" action — locked Documents section, Consent/Remarks/Uploaded Documents). No Endorsements section (nothing to endorse before a policy exists).
- **Edit mode** (toggled via the header "Edit" button) — a flat form covering client type, owner/applicant identity and address (region/city/barangay cascading selects), application status, term, policy/MV type, plate/MV file/chassis numbers, COV/for-public-use checkboxes, with a live-computed Total Premium footer. Save posts a `PUT` back to the application.

### 2.4 Document view/print/send (both paid views)
Calls the real `/api/documents` endpoints (`documentsApi.list('CTPL', applicationId)` → find by `docKey` → `documentsApi.getUrl(doc.id)` → `window.open(url, '_blank')`), opening the actual generated PDF via a presigned S3 URL in a new browser tab — **not** the older in-app mock-template modal that OFW's COI and GTP's documents still use. "Send to Client" currently only shows a toast notification (`${label} emailed to ${email}`) — no real outbound email is sent yet.

## 3. Create Application (`/ctpl/applications`, wizard state)

`ctpl_create_application.tsx`. Three states: `form` → `review` → `confirmed`.

### 3.1 Form
- **Choose Your Policy** — Term (1/3 Years), Policy Type, LTO MV Type (options depend on Policy Type), For Public Use checkbox (Motorcycle only), live Base Premium readout.
- **Personal Information** — Client Type, email, mobile, registered owner's name/address (region→city cascading selects, barangay), "same as owner?" toggle revealing separate applicant name fields if No.
- **Vehicle Details** — plate number, MV file number, chassis number (each with a format hint), then a **Vehicle Description** sub-section: Year Model / Vehicle Maker dropdowns (from `ctpl_vehicle_reference.ts`), Series/Color/Body Type/Motor Number/Authorized Capacity/Unladen Weight free-text fields, plus the COV checkbox.
- Right-aligned header shows a running Estimated Premium / Total Amount Due as fields are filled in.
- "Review Application" submit button, disabled until all required fields are present.

### 3.2 Review step
Read-only summary of every section above (Choose Your Policy / Personal Information / Vehicle Details), plus "Back to Edit" and "Confirm & Submit". This is the **mandatory validation checkpoint before an ID is ever assigned** — see `PRD.md` §Application Lifecycle.

### 3.3 Confirmed
Success screen showing the assigned Reference No., Policy/MV Type, and Premium, with a "Back to CTPL Applications" button. The application record itself (`buildApplication()`) is only constructed here, with `isPaid: true` baked in.

## 4. Payments

### 4.1 CTPL tab, within Payment Transactions (`/ctpl/payment-transactions`)
`ctpl_payment_transactions.tsx` → shared `ProductPaymentTransactions` shell. One row per paid application (filtered `isPaid`), no ledger/installments (CTPL is one-time, not amortized like PD Life). Columns: Policy Number, Reference No., Payor Name, Plan Label (Policy Type — MV Type), Premium, Date Received. "Create Payment" gated by `canCreatePayments(role, 'CTPL')` from the shared role catalog.

### 4.2 Consolidated Non-Life view
Inside the main Pay Tran page (not CTPL-specific navigation): `nonlife_payment_transactions.tsx` shows CTPL/OFW/GTP rows together in one product-filterable table, backed by the same `NonLifePaymentTransaction` model.

## 5. Endorsements (`/ctpl/endorsements`)

`endorsements_queue.tsx` (shared component, used with `product="CTPL"`). This is the **standalone work-queue view** across every CTPL policy's endorsements (as opposed to the per-policy endorsement list embedded in the paid-application quick preview, §2.2). Tabs: Awaiting Action / Pending / Reviewed / Approved / Denied / All. Search by insured name. Clicking a row expands `EndorsementDetail`. Approve/Deny actions are gated by `canApproveEndorsements('CTPL', role)` — only System Admin / Non-Life Admin / CTPL Admin. See `ARCHITECTURE.md` §5 for the underlying endorsement lifecycle and calculation services.

## 6. VVIP sections (cross-referenced above, defined once in `ctpl_vvip_sections.tsx`)

Three reusable sections shared by both the paid quick-preview and the unpaid detail page — added per the commit "feat: add Consent (DPA), Remarks, and Uploaded Documents sections to CTPL views":

- `ConsentSection` — DPA consent rows (Processing / Retention / Marketing & Promotions / Services / Sharing of Data), "Print DPA" → printable modal.
- `RemarksSection` — free-text remarks log with add form (local component state only — not yet wired to a backend endpoint).
- `UploadedDocumentsSection` — ad-hoc file upload list with View/Send/Delete (local component state, `URL.createObjectURL` for preview — files are not actually persisted anywhere; see `ARCHITECTURE.md` for the gap this implies).
