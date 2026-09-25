# GTP — Design System Notes

GTP-specific UI conventions. For the app-wide design system (typography, dark mode mechanism, card/table patterns shared by all four products), see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §2 and, once written, [`../general/DESIGN_SYSTEM.md`](../general/DESIGN_SYSTEM.md). This document covers only what is GTP-specific or where GTP deviates from/reuses the general system.

---

## 1. Branding — Non-Life navy/light-blue

GTP is one of the three Non-Life products (alongside OFW and CTPL) and uses the shared Non-Life color pair, defined in `paramountdirect_v2/src/lib/brand.ts`:

- **Navy `#002f6c`** — primary text/icon color, primary buttons (`bg-[#002f6c] hover:bg-[#00224f]`), section headings
- **Light blue `#49b1ea`** — dark-mode equivalent of navy for text/icons/accents, focus rings (`focus:ring-[#49b1ea]`), active-state chip backgrounds (`bg-[#49b1ea]/10`)

This is identical to OFW's and CTPL's palette — GTP does not have its own distinct brand color the way PD Life uses red. `sidebar.tsx`/`App.tsx`'s `resolveInitialNav` re-skins Maintenance pages to whichever product's palette is currently selected; `/maintenance/*` URLs carry no product, so GTP's navy/light-blue persists across a reload if GTP was last selected.

Every GTP page opens with the same header pattern: a `Plane` icon (destination flights) at `text-[#002f6c] dark:text-[#49b1ea]`, an uppercase `font-['Montserrat']` page title, and a one-line subtitle in muted slate — consistent with OFW/CTPL's own icon choices (this is the general design system's page-header pattern, not a GTP invention).

---

## 2. Destination-category picker and day-bracket rate display

GTP's Create Application wizard (`gtp_create_application.tsx`) has a UI pattern not present in OFW/CTPL: a **destination picker with quick-pick chips + a fallback dropdown**, rather than a single dropdown or free text.

- `POPULAR_DESTINATIONS` (10 countries) render as toggleable pill buttons above a `<select>` for the remaining ~180 countries (`ALL_COUNTRIES`, alphabetical)
- Selected destinations render as removable navy chips below, each with an inline `X` to deselect
- This is a **multi-select** UI (an application can list several destinations), unlike OFW's single-country employer field or CTPL's single-vehicle-per-application model

**Destination category and day-bracket rate are never shown to the user as raw inputs** — there is no "select rate tier" control anywhere. Instead:
- The estimated premium is shown live in the page header (top-right, `Estimated Premium`) and again in a full-width summary bar above the submit button, updating on every keystroke/selection
- Two **inline contextual notices** (not modals, not separate fields) explain *why* a rate tier applies: an amber-tinted `Info` banner for high-cost destinations ("USA / Canada / Hong Kong selected — the higher 'Including' rate is automatically applied"), and a green-tinted `ShieldAlert` banner for Schengen destinations (compliance coverage auto-applied). This "show the computed premium plus an explanatory banner, never a raw category dropdown" pattern is GTP-specific — it exists because the category is derived, not chosen, and staff need to understand *why* the number changed without exposing an internal rate-table key.
- Days of Travel is always a **read-only, auto-computed field** (`daysOfTravel = returnDate - departureDate` in days) — staff cannot type a day count directly, only pick the two dates.

This differs from CTPL's Premium Maintenance-adjacent UI, where rate lookups are keyed by an explicit Policy Type × MV Type selection the user does pick directly. GTP hides the lookup key (`destinationCategory`) entirely behind derived logic and explanatory banners.

---

## 3. The mock document-template modal (`policy_documents.tsx`) as used by GTP

`policy_documents.tsx` exports two shared components used by OFW, CTPL, and GTP detail pages:
- `PolicyDocumentsSection` — the "Documents" list row (locked notice pre-payment; View/Print + Send to Client buttons per document, post-payment)
- `PrintableDocumentModal` — the letterhead-styled printable overlay, with a hardcoded Paramount Life & General Insurance Corporation letterhead block and a browser `window.print()` button

**GTP still uses both of these exactly as originally built** — `gtp_application_list.tsx` wires `handleViewDoc`/`handleSendDoc` straight to this shared mock chrome, rendering a handful of `DocRow` key/value lines (Reference No., Traveler, Destination(s), Travel Dates, Plan, Premium, plus a hardcoded "PAID" status line for OR/Service Invoice) inside the printable modal. This is **not** a real PDF — it is an in-app-rendered `<div>` styled to look like a printed document, generated from whatever fields happen to be on the `GtpApplication` object, not from any actual template file.

**CTPL, by contrast, no longer uses this pattern at all** for its two real documents: `ctpl_application_list.tsx`'s "View/Print"/"Send to Client" call the real `GET /api/documents` list+presign endpoints and open the actual generated PDF (from `ctplDocumentFill.ts` + `server/src/templates/ctpl/*.pdf`) in a new browser tab. OFW is split — its Service Invoice is real (same pattern as CTPL), but its Certificate of Insurance (COI) still uses this same mock `policy_documents.tsx` chrome, because only static/flattened sample PDFs exist for that document, not real fillable templates.

**Reuse vs. GTP-specific:** the modal chrome itself (`PolicyDocumentsSection`, `PrintableDocumentModal`, `DocRow`) is general-purpose and shared verbatim — nothing about its styling or structure is GTP-specific. What's GTP-specific is only the `GTP_DOCUMENTS` array (which four documents appear) and the specific fields rendered inside each `DocRow`.

### Flag: switch to the CTPL-style real-PDF pattern once templates exist

Once real GTP templates exist for Policy Schedule/Policy Jacket/OR (and the frontend is wired to the Service Invoice fill service that already exists server-side — see [`HANDOVER.md`](./HANDOVER.md) §3), `gtp_application_list.tsx` should be updated to **drop this shared mock modal entirely for GTP** and adopt the same pattern CTPL uses: fetch the real generated-document list from `/api/documents`, and open a presigned S3 URL in a new tab instead of rendering a fake printable `<div>`. This is a UI/wiring change only — no new shared component is needed, since `documentStorage.ts`'s list/presign endpoints are already generic across `applicationType`.

---

## 4. Status/badge color conventions

GTP's status badges (`getStatusBadgeStyle` in `gtp_application_list.tsx`) reuse the general app convention (navy/blue-tinted for the "active/normal" status, slate for terminal/neutral, amber for anything needing attention) rather than inventing new colors:

| Status | Style |
|---|---|
| `Received` | navy/light-blue tinted (`bg-[#002f6c]/10 ... dark:bg-[#49b1ea]/10`) |
| `Cancelled` | slate/neutral |
| `Duplicate` | amber |

Row tinting (`getRowTintStyle`) applies the same three-way palette faintly across the whole table row, matching the pattern already established in OFW's and CTPL's list pages — this is general design-system reuse, not a GTP invention.
