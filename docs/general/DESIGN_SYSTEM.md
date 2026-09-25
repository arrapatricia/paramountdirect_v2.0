# Design System

Grounded in `paramountdirect_v2/src/index.css`, `paramountdirect_v2/src/lib/brand.ts`, and representative components (`application_detail_ui.tsx`, `sidebar.tsx`).

## Framework

Tailwind CSS v4, imported via `@import "tailwindcss";` (no separate `tailwind.config.js` content-scanning setup — v4's CSS-first configuration). Utility classes are used directly in JSX; there is no separate CSS-module or styled-components layer. A handful of app-wide overrides live in `index.css` (see below) that intentionally fight some Tailwind defaults.

## Color tokens per product brand

Defined in `paramountdirect_v2/src/lib/brand.ts` as a `BrandTheme` interface with named slots (`text`, `accentText`, `tabActive`, `navActive`, `navActiveIcon`, `button`, `iconChip`, `bar`, `accentBar`, `focusRing`, `focusWithinBorder`) rather than raw hex values, because Tailwind can only see literal class names — each variant's classes are spelled out in full rather than generated from a hex constant.

**PD Life ("LIFE_THEME"):**

| Token | Value |
|---|---|
| Primary red | `#d0112b` (headings, active icons, primary buttons) |
| Accent blue | `#008cb4` (secondary links, focus rings) |
| Also defined as a CSS variable | `--color-paramount: #d0112b` in `index.css` |

**Non-Life — OFW/CTPL/GTP ("NONLIFE_THEME"):**

| Token | Value |
|---|---|
| Primary navy | `#002f6c` (light mode) |
| Primary in dark mode | `#49b1ea` (light blue) |
| Accent | `#1f7fbf` (light mode) / `#49b1ea` (dark mode) |

Maintenance and its sub-pages re-skin to whichever product line is active via `brandTheme(product)` — PD Life keeps its red, OFW/CTPL/GTP share the same navy/light-blue Non-Life theme (mirroring ofwinsurance.ph and the Non-Life dashboards' own branding).

## Dark mode mechanism

- Tailwind v4 defaults `dark:` to the OS `prefers-color-scheme` media query. This app **repoints it** at a class selector: `@custom-variant dark (&:where(.dark, .dark *));` in `index.css`, so a `.dark` class toggled onto `<html>` (by `App.tsx`'s own toggle button, stored state) controls dark mode — not the OS setting.
- `:root.dark` overrides `--color-slate-950/900/800/700` to true near-black values (`#000000`/`#0d0d0d`/`#1a1a1a`/`#2b2b2b`) instead of Tailwind's default slate shades, because the default slate has a blue tint that made the brand navy (`#002f6c`) disappear into dark-mode surfaces. This is scoped to `:root.dark` only, so light mode is untouched, and it applies app-wide to every `dark:bg-slate-*`/`dark:border-slate-*` class without needing to touch each component individually.
- `color-scheme: light` / `color-scheme: dark` is set on `:root` / `:root.dark` so native form controls (scrollbars, date pickers) also follow the toggle.
- Text-color defaults are forced globally: light mode forces dark slate text (`#1e293b`) on bare `td/th/p/span/label/div/input/select`; `.dark` variants of the same selectors force light slate (`#e2e8f0`). Anything explicitly given `.text-white` (buttons on colored backgrounds, badges) is protected with `!important` so it isn't overridden by the bare-selector rule.

## Typography

- Single font family app-wide: **Montserrat**, loaded via Google Fonts and forced with `* { font-family: 'Montserrat', sans-serif !important; }` plus `--font-sans: 'Montserrat', sans-serif` and a `body` fallback declaration. There is no secondary/serif/monospace font in use.
- Antialiasing is forced (`-webkit-font-smoothing: antialiased`).

## Spacing / card patterns

- The dominant card shape is a white (light) / `slate-900` (dark) panel with `rounded-2xl` (section cards) or `rounded-3xl` (modals, the detail-header block) corners, a `border-slate-200`/`dark:border-slate-800` hairline border, and `shadow-sm` (cards) or `shadow-2xl` (modals).
- Field rows inside a section use a slightly recessed `bg-slate-50`/`dark:bg-slate-800/60` chip with `rounded-xl` and a lighter border (`border-slate-200/80`) — see `Field`/`FieldGrid` in `application_detail_ui.tsx`.
- Buttons and inputs use `rounded-xl` universally; icon chips (`iconChip` brand token) use the same shape with a tinted background matching the active brand color at low opacity (e.g. `bg-red-50`/`dark:bg-red-950/30` for PD Life).
- All interactive elements (`button, a, input, select`) get a blanket `transition: all 120ms ease-in-out` for consistent hover/focus feel.

## Status-bar / badge conventions

- Status badges use a pill shape (`rounded-xl`/`rounded-md`) with a semantic color pairing: green/emerald for a positive/locked state (e.g. an application claimed and locked to a screener), slate/gray for a neutral pending state, and the brand's own red/navy for an active or highlighted state (e.g. the small `PLANCODE` badge in the detail header — `text-[10px] font-black text-[#d0112b] bg-red-50 border border-red-100`).
- List pages show a filter-aware status-counts strip (`application_status_bar.tsx`) above the table — a row of clickable counts (one per status value) that both summarizes and filters the list.

## Modal vs inline-review patterns

Per explicit stakeholder feedback during this engagement, the design deliberately favors **inline, expand-in-place review over modal dialogs**. Every create-application wizard's confirmation step (Review before "Confirm & Submit") is inline within the same page flow, not a popup. Modals are reserved for gating a genuinely irreversible, one-shot decision — the clearest example is `IssueConfirmModal` in `application_detail_ui.tsx`, which forces the screener to record Signed/Unsigned before a PD Life application's status can actually commit to Issued. The older `policy_documents.tsx` modal-based document viewer is being phased out in favor of the same real-document flow CTPL uses (open the generated PDF directly in a new tab via a presigned URL) — see `DEVELOPER_HANDOVER.md` §1.

## Table/list patterns

- Master-detail pages (e.g. `life_followup_signature.tsx`) pair a searchable/filterable list on one side with a detail panel (timeline + action buttons) rather than a full-page table, when the workflow benefits from seeing history alongside the record.
- Straight tabular list pages (application lists, payment transaction lists) use the status-counts strip described above plus per-row action buttons (View/Print, Send to Client, Mark as Paid, etc.) rather than row-level dropdown menus, keeping actions visible without an extra click.
- `billing.tsx` is a deliberate style exception — its Regular/E-Billing/Credit Card tab list uses a borderless, denser row style that intentionally does not match the app's dashboard-card look, because it mirrors the legacy billing screen's own layout more closely.

## Responsive / mobile behavior

- The sidebar collapses to an icon-only rail (`isCollapsed` state) or a slide-over drawer on small viewports (`isSidebarOpen` state in `App.tsx`), rather than reflowing into a bottom nav bar.
- Section cards and field grids reflow from multi-column to single-column at Tailwind's standard breakpoints (`sm:`/`md:`/`lg:` prefixes throughout `application_detail_ui.tsx` and page components) — there is no separate mobile-only component tree.
- Every page in the app is expected to render usably at phone width; dark mode and responsive behavior are treated as baseline requirements applied everywhere (`DEVELOPER_HANDOVER.md` §3), not opt-in per page.
