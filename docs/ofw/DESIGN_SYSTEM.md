# OFW Design System Notes

This is not a standalone design system — OFW reuses the app's general component patterns
and the shared Non-Life branding almost entirely. This doc records the pieces that are
**specific to OFW**, and calls out explicitly where OFW instead just inherits the general
design system. See [`../general/DESIGN_SYSTEM.md`](../general/DESIGN_SYSTEM.md) once written
for the shared component kit, typography, dark mode, and general layout conventions.

---

## 1. Branding — inherited, not OFW-specific

OFW uses the same **Non-Life** branding as CTPL and GTP: navy `#002f6c` as the primary accent
(headers, primary buttons, active nav) and light blue `#49b1ea` as the dark-mode equivalent
accent / secondary highlight color. This is applied via `src/lib/brand.ts`'s product-based
re-skinning, which also drives Maintenance and its sub-pages. There is nothing OFW does
differently here from CTPL/GTP — the same two hex values, the same component classes
(`bg-[#002f6c]`, `dark:text-[#49b1ea]`, etc.) appear throughout `ofw_dashboard.tsx`,
`ofw_application_list.tsx`, and `ofw_create_application.tsx`.

**One OFW-specific deviation:** in the *consolidated* Non-Life Payment Transactions view
(`nonlife_payment_transactions.tsx`), OFW's row accent is `#008cb4` (a distinct teal-blue),
different from the `#002f6c` navy used everywhere else in OFW's own dedicated pages. This
exists purely to visually distinguish OFW rows from CTPL (`#002f6c`) and GTP within that one
shared, product-filterable table — it is not used anywhere else in OFW's UI.

---

## 2. OFW Dashboard UI

Purpose-built KPI/chart layout (`ofw_dashboard.tsx`), following the same card-grid structure
as the other product dashboards (`ctpl_dashboard.tsx`, `gtp_dashboard.tsx`) but with
OFW-specific content: a Coverage Type donut fixed at 100% Land-based (there being no other
reachable coverage type), a Nature of Employment split (Direct-hired vs Balik-Manggagawa),
and a Top Countries of Employment bar list — none of which have an equivalent on CTPL/GTP's
dashboards, since those products have no comparable "country of employment" concept. The
year-over-year monthly premium bar chart pattern (2025 vs. 2026, current month rendered at
reduced opacity as "month-to-date") is shared scaffolding (`lib/dashboardStats.ts`), not
OFW-specific.

---

## 3. Create Application Wizard

**Component:** `ofw_create_application.tsx`. Three internal states: `'form' | 'review' |
'confirmed'` — a simpler flow than PD Life's category-picker wizard, and matching the same
Review-step pattern CTPL/GTP use (a validation checkpoint before the record is ever created
— see the root handover's BRD cross-map, "Payment Redirection Flow"/"Submission to Payment
Transition" items).

1. **Form step** — four cards in sequence: Personal Information, Employment Information,
   Beneficiaries, Required Documents. Standard shared input classes
   (`inputClass`/`labelClass`/`cardClass`/`sectionHeadingClass`, all locally defined constants
   in this file — not yet promoted to a shared module, unlike some other per-product forms).
   Two fields are computed and rendered **disabled** rather than editable: **No. of Months**
   (auto-computed from contract dates, with an inline red warning if below the 6-month
   minimum) and **Insurance Start Date** (auto-aligned to today or the contract start date).
   A conflict-zone advisory panel (amber background, bilingual Tagalog/English copy) appears
   only when the selected employer country is flagged, and requires an explicit
   acknowledgment checkbox before submission is allowed.
2. **Review step** (`OfwReviewSummary`) — a read-only summary of every section using a shared
   `row()` label/value helper, ending in **Back to Edit** / **Confirm & Submit**. Nothing is
   added to the applications list before this click.
3. **Confirmed step** — a centered success card (green checkmark, Reference No./Coverage/
   Premium recap) with a single **Back to OFW Applications** button.

This whole wizard's shape (form → review → confirmed, with a header showing a live
"Estimated Premium" figure that updates as the form is filled) matches the general
create-application pattern used across CTPL/GTP, not something unique to OFW — the
OFW-specific parts are strictly the field content, not the flow shape.

---

## 4. Employment Verification & Payment Gating UI

This section (inside `renderDetailSections()` in `ofw_application_list.tsx`, titled
**"Employment Verification & Payment"**) is entirely OFW-specific — CTPL/GTP have no
equivalent, since they're pay-on-submission with no verification/instruction gate. UI
pattern: a stack of pill-shaped status rows, each either showing a completed state (green
checkmark badge + timestamp, e.g. "Verified" or "Sent") or an actionable control:

- **Employment Contract Verification** — two buttons, **Yes** / **No**, shown until a
  decision is made; once `Yes`, replaced by a green "Verified" badge + the verification date.
- **Send Payment Instruction** — only rendered once verification is `Yes`. A single navy
  button with a paper-airplane icon (`Send` from lucide-react); once clicked, replaced by a
  "Sent" badge + date + the sender's name (`paymentInstructionSentBy`).
- **Awaiting client payment** — an amber-tinted row (distinguishing "waiting on someone
  else" from the green "done" states) with a **Simulate Payment Received** button, shown
  once the instruction is sent and payment isn't yet confirmed.
- A `import.meta.env.DEV`-only purple-tinted developer shortcut ("Simulate Payment (Test)")
  duplicates the payment-confirmation action for local testing, visually distinct (purple,
  dashed border) from the three real-workflow rows above it, and disabled until both real
  prerequisites are met.

This progressive-disclosure pattern (each step only appearing once its prerequisite is
satisfied, rather than showing all three controls disabled up front) is the core UX idea
worth preserving if this flow is ever reimplemented — it keeps an issuer from being
presented with a payment-confirmation button before there's anything to confirm.

---

## 5. Document Section UI — Real Service Invoice vs. Mock COI

Both live inside the shared `PolicyDocumentsSection`/`PrintableDocumentModal` component kit
(`policy_documents.tsx`, also used by GTP's still-fully-mock document section and — for its
modal chrome only — CTPL's older flow before CTPL moved to real document links). The visible
UI is identical regardless of which document is real vs. mock (same row: label + "View /
Print" + "Send to Client" buttons) — the difference is entirely in what happens on click,
not in how the row looks:

- **Service Invoice** (`key: 'serviceInvoice'`) — `handleViewDoc`/`handleSendDoc` in
  `ofw_application_list.tsx` special-case this key: instead of opening the shared mock modal,
  they call `documentsApi.list('OFW', app.id)` to find the real `ofw-service-invoice`
  `GeneratedDocument` row, then `documentsApi.getUrl(doc.id)` for a presigned S3 URL, opened
  in a new tab (`window.open(url, '_blank', 'noopener')`). If no document row exists yet
  (e.g. generation failed silently server-side — see `HANDOVER.md §4`), a toast notification
  says so rather than opening a broken link.
- **COI** and **OR** (`key: 'coi'` / `'or'`) — fall through to the generic branch, which just
  sets `viewingDoc` and renders `printableDocBody()`'s static template inside
  `PrintableDocumentModal` — the same "print this browser-rendered mock" pattern GTP uses for
  all of its documents.

**Locked-state messaging is OFW-specific**, narrating exactly which of the three gates (§4)
is still open, rather than the shared component's generic default copy:
*"Documents will be available once employment is verified, payment instructions are sent,
and the client completes payment"* → *"Send the payment instruction to the client to
proceed"* → *"Awaiting confirmation that the client has completed payment."* CTPL/GTP, having
no such multi-step gate, use the shared component's default locked message instead
("These documents will be generated automatically once the premium payment has been
confirmed").

---

## 6. Endorsements Section

`ofw_policy_endorsements.tsx`, shown only for paid applications, inside "Documents &
Endorsements". Same expandable-row UI shape as CTPL's own `ctpl_policy_endorsements.tsx` and
built from the same shared primitives (`endorsement_shared.tsx`'s `EndorsementDetail`,
`EndorsementStatusBadge`, `ENDORSEMENT_TYPE_LABEL`, `displayDate`, `peso`,
`isFinancialType`) — not an OFW-specific visual pattern. The one OFW-specific behavior is
that requesting a *new* endorsement is not yet wired server-side, so its **New Endorsement**
button is a placeholder that only shows a "coming soon" toast — this differs from whatever
state CTPL's equivalent button is in (check `ctpl_policy_endorsements.tsx` directly if that
matters for a given task, as this may have moved since).
