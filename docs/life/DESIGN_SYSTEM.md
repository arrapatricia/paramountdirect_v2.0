# PD Life — Design System Notes

This document covers UI patterns specific to PD Life. For the shared design system (typography, base card/table conventions, dark mode mechanism, Tailwind v4 setup) common to all four products, see [`../general/DESIGN_SYSTEM.md`](../general/DESIGN_SYSTEM.md).

## 1. Brand color

PD Life is the **red** product line: `#d0112b` (with a `hover:bg-[#a80d22]` darker shade for interactive states, and `#008cb4` as a secondary/info accent used for links, focus rings, and the "print"/informational actions). This is distinct from OFW/CTPL/GTP's navy `#002f6c` / light blue `#49b1ea`. The color is applied ad hoc via Tailwind arbitrary-value classes (`text-[#d0112b]`, `bg-[#d0112b]`) throughout the Life components rather than a themed CSS variable — `src/lib/brand.ts` centralizes this only for the cross-product Maintenance pages, which re-skin based on the selected product; the Life-specific screens (screening, inquiry, follow-up signature, hub) simply hardcode the red literal directly in each `.tsx` file.

Every PD Life page header follows the same pattern: an icon (from `lucide-react`) in `#d0112b`, next to an uppercase, tracked-out title in `font-['Montserrat']`, with a bottom border separating it from the page body. E.g. `pdlife_applications_hub.tsx`:

```tsx
<LayoutGrid className="h-6 w-6 text-[#d0112b]" />
<h1 className="... text-[#d0112b] font-['Montserrat']">APPLICATIONS</h1>
```

## 2. Shared kit: `application_detail_ui.tsx`

The three detail pages (`application_detail_health.tsx`, `application_detail_lifeaccident.tsx`, `application_detail_comprehensive.tsx`) do not each reimplement their chrome — they all import from this one file, which is PD Life's own local design-system layer (distinct from any shared cross-product kit).

- **`NotificationBanner`** — success/error/info banner, dismissible, used for save confirmations and iPeak/claim errors.
- **`StatusControl`** — the status dropdown in the detail header. Three render states:
  - `locked` prop true → plain badge with a lock icon, no dropdown (Application Inquiry's read-only mode).
  - `savedStatus === 'Issued'` → an emerald "Issued" badge with a lock icon, regardless of the `locked` prop — issued applications can never have their status changed again from any entry point.
  - otherwise → an interactive dropdown button that opens a menu of `statusOptions`.
- **`IssueConfirmModal`** — the Signed/Unsigned gate blocking entry into `Issued` (see [`PRD.md`](PRD.md) §4). A centered modal, radio choice, disabled Confirm button until a choice is made. This is the one truly Life-specific interaction pattern in the kit — no other product line in this app has an equivalent "confirm a business decision before the status commits" modal.
- **`DetailHeader`** — back button + `Application {id}` title + product/plan/premium badge line + the `statusControl` node passed in (composition, not a fixed status renderer).
- **`Section` / `FieldGrid` / `Field`** — the card body layer: a rounded-2xl card with an icon+title header and an inline Edit/Save toggle button (`Section`), a responsive grid that packs short fields side by side instead of one-per-row (`FieldGrid`), and a labeled box that swaps between a view span and an edit input/select based on `editing` (`Field`). `Section` accepts an `iconColorClass` prop defaulting to Life's red (`text-[#d0112b]`) — the same component is reused by Non-Life detail pages (e.g. `ctpl_application_detail.tsx`) by overriding this to navy, which is why this file, despite living in the same directory as PD-Life-only components, is not exclusively a PD Life file. Treat `application_detail_ui.tsx` as a Life-originated kit that OFW/CTPL later adopted, not a general design-system primitive maintained elsewhere.
- **`AddRowButton`** — a full-width dashed/ghost "+" button used for adding beneficiaries/children rows in edit mode.

## 3. `application_status_bar.tsx`

A single shared counts strip (`Active / Received / Issued / Quoted / For Verification / Cancelled / Withdrawn / Duplicate / For Evaluation / Denied / For QA / No Status / Paid`) used identically at the top of both Application Screening and Application Inquiry. It deliberately renders `0` for every legacy status PD Life doesn't currently track (Quoted, Cancelled, Withdrawn, Duplicate, Denied, For QA, No Status) rather than omitting them or fabricating a count — this mirrors how the real legacy system shows 0 for statuses that don't apply to a given product/branch, and visually signals to a developer or stakeholder exactly which statuses this prototype does vs doesn't model (see [`PRD.md`](PRD.md) §2 for why).

## 4. Follow-up Signature's master-detail timeline UI

`life_followup_signature.tsx` is the one page in PD Life that departs from the table-based list pattern used everywhere else (Screening, Inquiry, Payment Transactions). It's a **master-detail layout**:

- Left panel (fixed width, `380px` on large screens): search box + a segmented filter control (Unsigned / Followed Up / Signed / All) + a scrollable list of compact row-cards. Each card shows payor name, a status icon (signed=`FileSignature` emerald, unsigned=`ShieldAlert` amber, followed-up=`ShieldCheck` blue), policy number in monospace, plan code/desc, and a policy-status pill (INFORCE emerald / LAPSED rose).
- Right panel: when a row is selected, renders a **timeline** — a vertical sequence of icon-in-circle steps (Policy Issued → optional Application Form Shipped → Print Follow-Up → Email Follow-Up → optional Client Signature Received), each step's circle filled/colored once that milestone has happened and gray/hollow otherwise, with an inline "Log as sent today" action on any step not yet completed. This timeline pattern is unique to this page — no other PD Life or Non-Life page in the app currently uses a vertical milestone timeline.
- Stat tiles above the master-detail grid (`Issued Policies / Unsigned / Followed Up / Signed`) reuse the same rounded-3xl white-card tile pattern as the Applications hub's overview strip.

## 5. Where Life reuses the general system vs has its own patterns

| Pattern | Source |
|---|---|
| Page header (icon + uppercase Montserrat title + subtitle + bottom border) | General convention, just recolored red for Life |
| Rounded-3xl white card, `shadow-sm`, dark-mode pair classes | General convention |
| Table with sticky header row, hover row tint, pagination footer (`Prev`/`Page N of M`/`Next`) | General convention (Screening/Inquiry tables match the shape used by OFW/CTPL/GTP application lists) |
| `application_detail_ui.tsx`'s Section/Field/StatusControl kit | Life-originated, later adopted by CTPL's detail page — not a general kit maintained elsewhere |
| `IssueConfirmModal` | Life-only — no equivalent gate exists for any Non-Life product |
| Follow-up Signature's master-detail + timeline | Life-only — unique to this one page |
| Status counts strip (`application_status_bar.tsx`) | Life-only component, though the general *concept* of a filter-aware counts strip appears in Non-Life list pages with their own implementations |
| Brand color token | Life = `#d0112b` red; general system defines the mechanism (`src/lib/brand.ts`) that Maintenance pages use to switch color per selected product |
