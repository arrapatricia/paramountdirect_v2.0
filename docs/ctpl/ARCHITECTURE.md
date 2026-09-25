# CTPL Architecture

Deep dive into how CTPL is wired end to end. See [`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md) for the repo-wide architecture (frontend↔backend wiring pattern, auth, audit logging) this narrows down from, and [`HANDOVER.md`](HANDOVER.md) for the "why"/gap-analysis framing of the same material.

## 1. Component map

```
Frontend                                Backend
--------                                -------
ctpl_dashboard.tsx        ──GET──▶      /api/applications/ctpl
ctpl_application_list.tsx ──GET──▶      /api/applications/ctpl
                           ──GET──▶      /api/documents?applicationType=CTPL&applicationId=...
                           ──GET──▶      /api/documents/:id/url   (presigned S3 URL)
ctpl_create_application.tsx──POST──▶     /api/applications/ctpl
ctpl_application_detail.tsx──PUT───▶     /api/applications/ctpl/:id   (unpaid edit / "Simulate Payment Received")
ctpl_policy_endorsements.tsx──GET/POST─▶ /api/endorsements
ctpl_endorsement_modal.tsx  ──POST──▶    /api/endorsements  (create) , /api/endorsements/preview (calc)
endorsements_queue.tsx     ──GET/PATCH─▶ /api/endorsements , /api/endorsements/:id/{review,decide}
(website) ctpl.ph          ──POST──▶     /api/ingest/ctpl   (X-Api-Key, not JWT)
```

Backend-internal, not called from the frontend directly:

```
applications.ctpl.ts (POST/PUT)
  └─▶ generateAndStoreCtplDocuments()
        ├─▶ ctplDocumentFill.ts: fillCtplCoc / fillCtplServiceInvoice /
        │     fillCtplPolicySchedule / fillCtplPolicyJacket
        └─▶ documentStorage.ts: storeGeneratedDocument()  ×4
              ├─▶ S3 PutObjectCommand
              └─▶ prisma.generatedDocument.create()

endorsements.ts (POST /:id/decide, Approve)
  └─▶ ctplEndorsementCalc.ts (computeCtplExtension / computeCtplCancellation)
  └─▶ ctplEndorsementDocuments.ts: generateCtplEndorsementDocuments()
        └─▶ documentStorage.ts: storeGeneratedDocument()  (endorsementId set)
```

## 2. Request wiring: `/api/applications/ctpl`

`server/src/routes/applications.ctpl.ts`, mounted behind `requireAuth` (JWT). Routes: `GET /` (list, `?status=` filter, newest-first), `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. Every mutating route calls `recordAudit()`.

### 2.1 The `isPaid`-flip trigger

This is the crux of CTPL's backend design — document generation is **not** a separate action staff take; it is a **side effect** of `isPaid` becoming `true` for the first time, detected inline in both `POST` and `PUT`:

```ts
// POST — CTPL's website flow is already-paid on arrival
const isIssuedOnCreate = Boolean(data.isPaid && !data.policyNumber);
if (isIssuedOnCreate) {
  data.policyNumber = await generateUniqueCtplPolicyNumber(data.policyType, data.forPublicUse);
  // ...default effectiveDate/expiryDate from renewalType if not supplied
}
// ...create the row...
if (isIssuedOnCreate) await generateAndStoreCtplDocuments(application, req.user?.email);
```

```ts
// PUT — the staff path: this PUT is issuing the policy for the first time
const isNewlyIssued = Boolean(data.isPaid && !current.policyNumber && !data.policyNumber);
if (isNewlyIssued) {
  data.policyNumber = await generateUniqueCtplPolicyNumber(...);
  // ...same effectiveDate/expiryDate default...
}
// ...update the row...
if (isNewlyIssued) await generateAndStoreCtplDocuments(application, req.user?.email);
```

The guard condition is really "does this row not have a `policyNumber` yet, and is `isPaid` now true" — so a policy is only ever issued (numbered + documented) once, regardless of how many times the row is subsequently updated. `isIssuedOnCreate`/`isNewlyIssued` are computed *before* the Prisma write, using `data` (incoming) vs `current` (existing row, `PUT` only) — the actual `create`/`update` call happens in between, and `generateAndStoreCtplDocuments()` runs only after, against the now-persisted `application` object (so the generated documents reference the real assigned `policyNumber`/dates).

`generateAndStoreCtplDocuments()` itself deliberately swallows errors (try/catch around the whole `Promise.all`, logs via `console.error`) — see `HANDOVER.md` §4.4 for why this is a deliberate choice (payment/issuance has already succeeded by this point) and the gap it implies (no staff-visible failure signal).

Reference No. assignment is a separate, simpler rule: assigned unconditionally the first time an application row exists without one (both `POST` for new rows, and `PUT` as a backfill for legacy rows created before this rule existed) — independent of `isPaid`.

## 3. Document fill: pdf-lib against real AcroForm templates

`server/src/services/ctplDocumentFill.ts`. Templates live at `server/src/templates/ctpl/*.pdf` and are loaded from disk (`readFileSync`, `TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'ctpl')`) — not fetched from S3 or a database; they ship as part of the deployed backend code.

Fill sequence per document (`fillFields()`):
1. `PDFDocument.load(bytes)` → `pdf.getForm()`.
2. For each `{name, value}` pair: `form.getFieldMaybe(name)` (returns `undefined` rather than throwing if the template doesn't have that field) → if present, `form.getTextField(name).setText(toWinAnsi(value))` inside a try/catch (in case the named field isn't actually a text field).
3. `form.updateFieldAppearances()` — regenerates the visual appearance streams for the values just set.
4. `form.flatten()` — bakes values into page content, removes the AcroForm fields entirely (output PDF is not further editable).
5. `pdf.save()` → `Buffer`.

Each of the four document-builder functions (`fillCtplCoc`, `fillCtplServiceInvoice`, `fillCtplPolicySchedule`, `fillCtplPolicyJacket`) assembles its own field-name→value map against the same underlying `CtplApplication` row plus the shared `computeCtplBreakdown()` tax calculation (see `HANDOVER.md` §4.2). `fillCtplPolicyJacket` short-circuits this whole pipeline — it has no fields to fill, so it just reads and returns the matching static template's bytes keyed by policy-type prefix (P/M/C/L).

`insuredNameAndAddress(app)` centralizes one piece of business logic used by every document: the insured name/address printed on the document is the **applicant's**, not the owner's, when `sameAsOwner` is false — otherwise it's the registered owner's.

## 4. Storage: S3 + `GeneratedDocument`

`server/src/services/documentStorage.ts`, generic across every product line (only CTPL calls it today).

- `storeGeneratedDocument()`: `PutObjectCommand` to a private S3 bucket (`s3Bucket`/`s3Client` from `server/src/lib/s3.ts`) at key `documents/{applicationType}/{applicationId}/{docKey}-{Date.now()}.pdf`, then `prisma.generatedDocument.create()` with that key plus metadata. The timestamp suffix means re-generating a document (e.g. after a future "regenerate" action) would create a new S3 object and a new `GeneratedDocument` row rather than overwriting — consistent with the model's "one immutable row per generated file" contract.
- `getDocumentViewUrl()`: `GetObjectCommand` + `getSignedUrl`, 5-minute TTL (`PRESIGNED_URL_TTL_SECONDS`), with an optional `ResponseContentDisposition: inline; filename="..."` override so the browser shows/saves a human-readable filename without renaming the underlying object.

`server/src/routes/documents.ts` exposes this to the frontend:
- `GET /api/documents?applicationType=CTPL&applicationId=...` — lists what's already generated (used to know which "View" buttons should be enabled/what exists).
- `GET /api/documents/:id/url` — returns `{ url }`, the presigned link, with a filename built from `DOC_KEY_FILENAME_LABEL[docKey]` + the application's plate number (looked up via `findFilenameSuffix()`, which for CTPL queries `CtplApplication.plateNumber`).
- `POST /api/documents` (multipart upload) — exists as a generic "accept a pre-rendered PDF and store it" path for products/flows that render client-side rather than server-fill; CTPL doesn't use this path (its documents are always server-filled), but it's there for OFW/GTP's eventual real document services.

## 5. Endorsements

`server/src/routes/endorsements.ts` + `server/src/services/ctplEndorsementCalc.ts` + `server/src/services/ctplEndorsementDocuments.ts`, model `Endorsement` (table `endorsements`, see `HANDOVER.md` §6).

- **Non-Financial** endorsement (name/address/vehicle-field corrections): auto-approved on submit. The request carries a `changes: [{field, label, from, to}]` list against a fixed catalogue of editable fields (`CTPL_INSURED_FIELDS`/`CTPL_VEHICLE_FIELDS` in `endorsements.ts`); applied to the application immediately, numbered via `nextEndorsementNumber()` (`endorsementNumbering.ts`), and a document is generated recording the change.
- **Financial** endorsements (`Term_Extension`, `Cancellation_Flat`, `Cancellation_Pro_Rata`): go `Pending → Reviewed → Approved | Denied`. `computeCtplExtension()`/`computeCtplCancellation()` in `ctplEndorsementCalc.ts` compute the new premium/DST/LGT/VAT/other-fees/total delta (signed: positive for an extension's additional charge, negative for a cancellation's refund) from the policy's own rate and dates; `EndorsementCalcError` is caught and surfaced as an HTTP 400 for bad input (e.g. an invalid cancellation date). The policy itself (`expiryDate`, `status`) is only touched on **Approve** — a Denied request leaves the application exactly as it was. On approval, `generateCtplEndorsementDocuments()` issues either an extension Service Invoice (drawing from the shared `6000000XXXXXX` series, same as base issuance) or a Cancellation Credit Memo (its own `creditMemoNumber` series), stored via the same `storeGeneratedDocument()` path with `endorsementId` set instead of left null.
- **Authorization:** `assertProductAccess()` gates every endorsement route to users whose `assignedProducts` includes `CTPL`; `assertApprover()` additionally restricts review/decide actions to `APPROVER_ROLES.CTPL = ['System Admin', 'Non-Life Admin', 'CTPL Admin']` — a Non-Life Issuer can request an endorsement but not approve a financial one.

Frontend surfaces: the per-policy `CtplPolicyEndorsements` list embedded in the paid quick-preview (request + view history for one policy), the standalone `EndorsementsQueue` work-queue page at `/ctpl/endorsements` (review/approve/deny across every CTPL policy), and `CtplEndorsementModal` (the request form itself, calling `POST /api/endorsements/preview` for a live calculated preview before final submit — mirroring the base application's own Review-step pattern).

## 6. Invoice numbering service

`server/src/lib/invoiceNumbering.ts` — one function, `generateUniqueInvoiceNumber()`, an 8-attempt random-digit-and-check loop against `GeneratedDocument.invoiceNumber`'s DB unique constraint, producing `6000000XXXXXX`. Called from both `fillCtplServiceInvoice()` (base issuance) and the Term Extension endorsement path. This is intentionally **not** namespaced by product — see [[shared-nonlife-invoice-numbering]] and `HANDOVER.md` §4.5: OFW and GTP's eventual real invoice services are expected to call this exact same function, drawing from the same series, matching the real business process where all three non-life products share one invoice template/series.

`server/src/lib/ctplNumbering.ts` is the CTPL-specific counterpart for Policy Number (`{PREFIX}COC-{10 digits}`, prefix by policy type + public-use flag) and Reference No. (`2600XXXXXX`) — same random-and-check pattern, separate namespaces, not shared with OFW/GTP (each of those products has, or will have, its own numbering module).

## 7. Website ingest

`server/src/routes/ingest.ctpl.ts`, mounted at `POST /api/ingest/ctpl`, authenticated by `requireServiceApiKey('WEBSITE_INGEST_API_KEY_CTPL', 'ctpl.ph', 'CTPL')` — a shared-secret header (`X-Api-Key`), not a user JWT, since there's no logged-in user on the website's side. Accepts a CTPL application payload (same shape as the staff-facing `createApplicationSchema` minus a few staff-only fields), assigns a Reference No., creates the row with `status: 'Completed'`, and records an audit-log entry (failure to audit-log does not fail the ingest response — the application is already saved and is the result the website actually cares about).

Note: this route does **not** itself set `isPaid: true` or trigger document generation — the payload schema has no `isPaid`/`policyNumber` fields at all. In practice this means an application arriving via this webhook lands as *unpaid* until a subsequent staff `PUT` (or a future direct payment-gateway integration) flips it — worth flagging against the "CTPL is already-paid on arrival" framing elsewhere in this doc set, which describes the **staff-facing create wizard's** behavior (which hardcodes `isPaid: true` because it's modeling "this was already paid on ctpl.ph before reaching us"), not this webhook's current schema. The webhook path and the "hardcode isPaid true" UI path are two different entry points that haven't yet been reconciled to agree on when/how payment state is actually asserted — see `HANDOVER.md` §7's "no payment-gateway trigger" gap.

## 8. End-to-end flow diagram

```
                    ┌─────────────────────┐
                    │   ctpl.ph website    │
                    │  (quote + payment)    │
                    └──────────┬───────────┘
                               │ POST /api/ingest/ctpl (X-Api-Key)
                               │  [not yet called live — see §7]
                               ▼
   ┌───────────────────────────────────────────────────────────┐
   │              CTPL Create Application wizard                 │
   │   (staff re-keying, or future direct website integration)    │
   │        Form → Review → Confirm & Submit                      │
   │        buildApplication(): isPaid = true (hardcoded)          │
   └──────────────────────────┬────────────────────────────────┘
                               │ POST /api/applications/ctpl
                               ▼
                  ┌─────────────────────────┐
                  │  applications.ctpl.ts     │
                  │  isPaid && !policyNumber?  │
                  └────────────┬─────────────┘
                     yes ───────┼────────── no
                       │                     │
                       ▼                     ▼
        generateUniqueCtplPolicyNumber   (row saved, unpaid;
        default effectiveDate/expiryDate  no documents yet —
                       │                   staff PUT can trigger
                       ▼                   this path later)
        prisma.ctplApplication.create/update
                       │
                       ▼
        generateAndStoreCtplDocuments(application)
                       │
          ┌────────────┼─────────────┬─────────────┐
          ▼            ▼             ▼             ▼
      fillCtplCoc  fillService   fillPolicy    fillPolicy
                   Invoice()     Schedule()    Jacket()
      (pdf-lib, AcroForm templates in server/src/templates/ctpl/*.pdf)
          │            │             │             │
          └────────────┴─────────────┴─────────────┘
                       │  storeGeneratedDocument() ×4
                       ▼
        ┌───────────────────────────────┐
        │  S3 (private bucket)            │
        │  documents/CTPL/<id>/<docKey>-   │
        │  <timestamp>.pdf                │
        └───────────────┬────────────────┘
                         │  PutObjectCommand
                         ▼
        ┌───────────────────────────────┐
        │  GeneratedDocument row (Postgres)│
        │  s3Key, docKey, invoiceNumber,    │
        │  applicationType/applicationId    │
        └───────────────┬────────────────┘
                         │
     ── later, from the CTPL Applications list/detail UI ──
                         │
                         ▼
        GET /api/documents?applicationType=CTPL&applicationId=...
                         │ (list what's generated)
                         ▼
        GET /api/documents/:id/url
                         │ getSignedUrl (5 min TTL)
                         ▼
        window.open(presignedUrl, '_blank')
        (real generated PDF opens directly — no in-app mock modal)
```
