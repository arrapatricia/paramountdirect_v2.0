# GTP — Architecture

GTP-specific backend wiring. For the cross-product architecture (Express app structure, Prisma setup, auth, audit logging), see the root [`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §1–2 and, once written, [`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md).

---

## 1. `/api/applications/gtp` — application CRUD

Router: `server/src/routes/applications.gtp.ts`, mounted (per the app's per-resource router convention) at `/api/applications/gtp`. Requires auth (`requireAuth` middleware — a logged-in staff session).

| Method | Route | Behavior |
|---|---|---|
| `GET` | `/` | List, optional `?status=` filter, ordered newest-first |
| `GET` | `/:id` | Single application, 404 if missing |
| `POST` | `/` | Create. Validated via a zod schema mirroring `GtpApplication`. If the incoming `isPaid` is `true` (the normal case — staff Create Application and the website both submit already-paid), fires document generation (§3) after the row is committed |
| `PUT` | `/:id` | Partial update (zod `.partial()`). Detects a `false → true` transition on `isPaid` (`isNewlyIssued`) and fires document generation only on that transition, not on every update |
| `DELETE` | `/:id` | Hard delete |

Every create/update/delete calls `recordAudit(req, { module: 'GTP Applications', ... })`, writing into the shared `AuditLog` table — same mechanism as every other resource (see root handover §2).

Frontend wiring: `paramountdirect_v2/src/App.tsx` fetches via `gtpApi` (`lib/api.ts`) once a real backend session exists, falling back to local `useState` mock data (`initialGtpMockData`) when the backend is unreachable — `gtpConnected`/`gtpLoadError` state track this. `handleCreateGtpApp`/`handleUpdateGtpApp` post to the real API when connected, otherwise only mutate local state. This is the same "frontend↔backend parity, mock fallback" pattern used for OFW/CTPL (see root handover §2's "frontend does not call the backend" caveat — that caveat is now stale for all three of OFW/CTPL/GTP, which *are* wired, unlike the document-generation pipeline described in §3 below).

---

## 2. Website-ingest webhook — built, not yet called

Router: `server/src/routes/ingest.gtp.ts`, mounted at `/api/ingest/gtp`. Mirrors `ingest.pdlife.ts`'s contract for `paramountdirect.com`.

- Auth: `requireServiceApiKey('WEBSITE_INGEST_API_KEY_GTP', 'yourtravelinsurance.ph', 'GTP')` — a shared-secret header check, not a user JWT, since there is no logged-in user on the calling side. As of commit `3218154`, each product has its **own** ingest API key (`WEBSITE_INGEST_API_KEY_GTP`) rather than one key shared across all four products.
- Accepts the same shape as `applications.gtp.ts`'s create schema minus staff-only fields (no `status` override — always forced to `Received`; no `screenedBy`; no `isPaid` — the ingest schema has no `isPaid` field at all, meaning ingested applications are **not** automatically marked paid the way the staff Create Application wizard forces `isPaid: true`. This is a real difference worth confirming with the business: if `yourtravelinsurance.ph`'s actual submission flow is post-payment like the frontend assumes, the ingest schema may need an `isPaid` field added before go-live).
- On success, records an audit log entry and returns `{ id: application.id }`. A logging failure is caught and swallowed (never turns a successful ingest into a failed HTTP response) — same defensive pattern as the other ingest routes.

**Status: built and ready, but `yourtravelinsurance.ph` does not call it yet.** Per the root handover §1: *"ofwinsurance.ph/ctpl.ph/yourtravelinsurance.ph's are built and ready but that outbound call hasn't been added on those three sites yet."* Only `paramountdirect.com`'s PD Life ingest is actually live. This is a gap on the **website side**, not this codebase — someone needs to add the outbound `POST` call from `yourtravelinsurance.ph`'s own backend once a GTP application is saved there.

---

## 3. Document-fill pipeline — where GTP plugs in (partially)

The general pipeline (built for CTPL, partially reused by OFW and GTP): `applications.{product}.ts` route → `{product}DocumentFill.ts` service (uses `pdf-lib` to fill a named-field template from `server/src/templates/{product}/*.pdf`) → `documentStorage.ts`'s `storeGeneratedDocument()` (uploads to S3, writes a `GeneratedDocument` row) → `invoiceNumbering.ts`'s `generateUniqueInvoiceNumber()` for documents that carry their own invoice number (shared `6000000XXXXXX` series across OFW/CTPL/GTP by design, per the root handover §1 — do not split this into a per-product sequence).

**GTP's actual plug-in state, precisely:**

- `gtpDocumentFill.ts` and `server/src/templates/gtp/gtp-service-invoice.pdf` **already exist** and are wired into `applications.gtp.ts` (`generateAndStoreGtpDocuments`, called on the `isPaid` `false → true` transition, same trigger CTPL/OFW use). This is real, working backend code — not a gap.
- What GTP is missing is (a) templates for the other three documents (Policy Schedule, Policy Jacket, OR) and their corresponding fill functions, and (b) frontend wiring in `gtp_application_list.tsx` to actually fetch and display what the Service Invoice service already produces (see [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) §3 for the frontend-side detail).
- `gtpDocumentFill.ts` deliberately leaves every CTPL-only motor-insurance field (`plate_number`, `motor_number`, `ctpl_premium`, etc.) blank when filling the shared invoice template — GTP has no vehicle data, so those AcroForm fields simply go unset.
- The GTP premium has no itemized VAT/DST/LGT breakdown anywhere in the data model (see [`HANDOVER.md`](./HANDOVER.md) §4), so `gtpDocumentFill.ts` treats the whole premium amount as VAT-exempt on the invoice rather than computing a split — a simplification that should be revisited once/if GTP needs a real tax breakdown (CTPL's is reconciled against the legacy Rails source; GTP's is not).

**Recommended framing for anyone picking this up:** treat "wire GTP into the document-fill pipeline" as **90% done for the Service Invoice, 0% done for the other three documents** — not a single monolithic gap. The highest-leverage remaining step is templates for Policy Schedule/Policy Jacket/OR plus the frontend fetch wiring, not backend service-layer work (see [`HANDOVER.md`](./HANDOVER.md) §7 recommended next steps).

---

## 4. No iPeak/AS400 connection

Unlike PD Life (§1 of the root handover — a live outbound integration to iPeak/LEAP Services on status change), GTP has **no integration of any kind** with iPeak, AS400, or any core-system backend. There is no `GtpIpeakRequest`-equivalent table, no outbound call anywhere in `applications.gtp.ts`. This mirrors OFW and CTPL's current state exactly.
