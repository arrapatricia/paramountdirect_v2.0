# OFW Architecture

OFW-specific backend/frontend wiring. For general architecture (auth, the frontend/backend
mock-vs-real pattern, iPeak, audit logging) see
[`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md) once written, and the root
[`DEVELOPER_HANDOVER.md`](../../DEVELOPER_HANDOVER.md) §2.

---

## 1. `/api/applications/ofw` Wiring

**Router:** `server/src/routes/applications.ofw.ts`, mounted under `/api/applications/ofw` in
`app.ts`. All routes require `requireAuth` (JWT).

| Method | Path | Notes |
|---|---|---|
| `GET` | `/` | Newest-first, optional `?status=` filter, includes `beneficiaries`. |
| `GET` | `/:id` | Single application, includes `beneficiaries`. |
| `POST` | `/` | Creates an application. See below for side effects. |
| `PUT` | `/:id` | Updates an application. Same side-effect logic as `POST`, keyed off what changed from `current`. |
| `DELETE` | `/:id` | Hard delete, audit-logged. |

**Frontend:** `App.tsx` calls `ofwApi` (`lib/api.ts`) — `list()`/`create()`/`update()` — once
a real backend session exists (`ofwConnected` state), falling back to an in-memory mock array
otherwise (same connected/mock pattern used by every product line; see the general
architecture doc). The `ofwApi.create`/`update` payload shapes go through
`OFW_NATURE_TO_API`/`OFW_COVERAGE_TO_API` (and their `_FROM_API` inverses) to translate
between the frontend's hyphenated enum literals (`'Direct-hired'`) and the backend's
underscored Prisma enum values (`Direct_hired`) — see
[`HANDOVER.md §7`](./HANDOVER.md#7-data-model) for why this mapping exists and isn't
considered a bug to fix.

### Side effects computed server-side on `POST`/`PUT` (not left to the client)

Both handlers share the same conditional-stamping logic, applied only when the relevant
field is newly becoming true and hasn't already been stamped:

1. `referenceNo` — generated (`generateUniqueOfwReferenceNo()`, `lib/ofwNumbering.ts`) if not
   already set. On `POST` this always happens (a reference number exists from the moment the
   application exists); on `PUT` it's a backfill for any pre-existing row that predates this
   rule.
2. `policyNumber` (COI No.) — generated (`generateUniqueOfwCoiNumber()`) the moment `isPaid`
   is newly `true` and no `policyNumber` is already set.
3. `dateVerified` — stamped when `employmentVerified` newly becomes `'Yes'`.
4. `dateProcessed` — stamped when `paymentInstructionSent` newly becomes `true`.
5. `paymentInstructionSentBy` — looked up via `currentUserName(req.user?.sub)` (a DB lookup of
   the logged-in `User`'s `firstName lastName`) the first time `paymentInstructionSent`
   transitions to `true`. Falls back to `undefined` for API-key callers with no `req.user`
   (i.e. the ingest route never sets this, since no application arrives already
   payment-instructed from the website).
6. `dateIssued` — stamped when `isPaid` newly becomes `true`.
7. `fxRate`/`premiumPhp` — recomputed via `getUsdToPhpRate()`/`formatPhp()`/
   `parseUsdPremium()` (`lib/forex.ts`) on every write **until** `paymentInstructionSent` is
   already `true` on the *current* (pre-update) row, at which point they're left untouched —
   this is the "freeze the conversion once the instruction is sent" rule (see
   [`PRD.md §5`](./PRD.md#5-payment-instruction-flow)).
8. Document generation (`generateAndStoreOfwDocuments()`) — fires only when the *this-request*
   transition makes `isPaid` newly true (`isIssuedOnCreate` on `POST`, `isNewlyIssued` on
   `PUT`), **after** the Prisma write and its audit log succeed, wrapped in its own try/catch
   that only logs a failure — a document-generation error never rolls back or fails the
   application update itself.

**Note:** none of steps 3–6 are gated on each other server-side beyond "don't overwrite an
already-set value" — e.g. nothing stops a `PUT` from setting `paymentInstructionSent: true`
on a row whose `employmentVerified` is still `Pending`. The UI never constructs such a
request (the button simply isn't rendered), but a different API client could.

---

## 2. Website Ingest Webhook (`ofwinsurance.ph`)

**Route:** `POST /api/ingest/ofw` (`server/src/routes/ingest.ofw.ts`), mounted separately
from the authenticated applications router. Authenticated via
`requireServiceApiKey('WEBSITE_INGEST_API_KEY_OFW', 'ofwinsurance.ph', 'OFW')` —
shared-secret `X-Api-Key` header, not a JWT, since there is no logged-in user on the public
website's side.

**Built, but not yet called from `ofwinsurance.ph` itself.** The endpoint is complete and
functional (creates an `OfwApplication` with `status: 'Received'`, generates a reference
number, computes the initial `fxRate`/`premiumPhp`, and records an audit log entry noting the
application arrived "from ofwinsurance.ph") — but as of this writing, `ofwinsurance.ph`'s own
backend does not yet make the outbound call to it. This is the same "built but not wired on
the source site" state as CTPL's and GTP's own ingest webhooks; only `paramountdirect.com`'s
PD Life ingest call is actually live end-to-end. See root handover §1.

Payload differences from the staff-facing `POST /api/applications/ofw` schema:
`phRegion`/`phBarangay` default to `""` (that site's form doesn't collect them),
`beneficiaries[].birthdate` is nullable (not collected there either), and there is no
`employmentVerified`/`paymentInstructionSent`/`isPaid`/`status` in the ingest payload at all
— every ingested row starts at the same earliest-stage defaults a staff-created application
would.

If a comment or audit-log write fails after the application row itself was already
successfully created, the ingest handler still returns `201` with the new application's
`id` — a logging hiccup must never turn a successful ingest into a failed response back to
the website (`try/catch` around `recordAudit`, logged to console but not surfaced to the
caller).

---

## 3. `ofwDocumentFill.ts` — PDF-Fill + S3 Flow

**Trigger:** called once, from `applications.ofw.ts`'s `generateAndStoreOfwDocuments()`, the
moment an application's `isPaid` first flips `true` (either at `POST` or `PUT`).

**Flow:**
1. Load the real fillable template `server/src/templates/ofw/ofw-service-invoice.pdf` via
   `pdf-lib`'s `PDFDocument.load()`.
2. Compute the premium breakdown (`computeOfwBreakdown()`) and month count
   (`computeMonths()`) — see [`HANDOVER.md §4`](./HANDOVER.md#4-service-invoice-generation-real--ofwdocumentfillts)
   for the exact formulas.
3. Get a unique invoice number from the **shared** cross-product series
   (`generateUniqueInvoiceNumber()`, `lib/invoiceNumbering.ts` — see §4 below).
4. Fill each named AcroForm field (`_SVI`-suffixed) via `form.getFieldMaybe()` +
   `getTextField().setText()`, skipping any field the template revision doesn't have rather
   than throwing.
5. `form.updateFieldAppearances()` then `form.flatten()` — the output PDF is not editable by
   whoever opens it (matches the legacy Rails app's `pdftk ... flatten: true` behavior).
6. Return the filled `Buffer` + invoice number to the caller.
7. The caller (`applications.ofw.ts`) passes that buffer to
   `storeGeneratedDocument()` (`server/src/services/documentStorage.ts`), which:
   - Uploads it to a private S3 bucket.
   - Writes one immutable `GeneratedDocument` row (`applicationType: 'OFW'`,
     `docKey: 'ofw-service-invoice'`, `s3Key`, `invoiceNumber`, `generatedBy`,
     `generatedAt`) — same mechanism CTPL's `ctplDocumentFill.ts` uses for its own
     documents.

**Retrieval:** the frontend never talks to S3 directly. `ofw_application_list.tsx`'s
`handleViewDoc`/`handleSendDoc` call `documentsApi.list('OFW', applicationId)` to find the
matching `GeneratedDocument` row by `docKey`, then `documentsApi.getUrl(doc.id)` for a
short-lived presigned URL, opened directly in a new browser tab.

**Failure isolation:** the entire fill+store call is wrapped in a try/catch in
`generateAndStoreOfwDocuments()` — a template-loading error, a missing field, or an S3 upload
failure is logged to the server console but does **not** fail the `POST`/`PUT` request that
triggered it, since the payment/issuance itself has already succeeded by the time document
generation runs. A silent failure here means the application shows as paid/issued but
`documentsApi.list()` simply returns no matching row — the frontend's toast notification
("Service Invoice hasn't been generated for this application yet") is the only surfaced
signal, and there's no retry/regenerate action anywhere in the UI.

---

## 4. Shared Invoice Numbering (OFW/CTPL/GTP)

The `6000000XXXXXX` invoice-number series (`server/src/lib/invoiceNumbering.ts`,
`generateUniqueInvoiceNumber()`) is **deliberately shared across OFW, CTPL, and GTP** — not a
per-product sequence — because all three products use the same invoice series/template in
the real business process. This is a firm design constraint, not an oversight: see the
memory note `shared-nonlife-invoice-numbering.md` and the general architecture doc (once
written) for the full mechanism and how uniqueness/collision-avoidance is enforced across
concurrent writes from all three products.

Do not introduce a per-product invoice counter for OFW in isolation — any change to
numbering needs to account for CTPL and GTP simultaneously.

---

## 5. `NonLifePaymentTransaction`'s Nullable-FK Pattern, as It Applies to OFW

`NonLifePaymentTransaction` (migration `20260918052815_add_nonlife_payment_transaction`,
route `server/src/routes/payments.nonlife.ts`, `/api/payments-nonlife`) is the shared
non-life equivalent of PD Life's `PaymentTransaction`. Because `OfwApplication`,
`CtplApplication`, and `GtpApplication` each live in their own table with no shared parent
table, Prisma has no single polymorphic relation to point at "whichever of the three this
is" — the model instead carries **three nullable FK columns**
(`ctplApplicationId`/`ofwApplicationId`/`gtpApplicationId`), with exactly one expected to be
populated per row per its `product` enum value (enforced by the `payments.nonlife.ts` zod
schema at the API layer, **not** by a DB-level constraint — nothing stops a row from having
all three null, or in principle more than one set, at the database level).

For an OFW row specifically: `ofwApplicationId` is the FK into `OfwApplication.id`; the
row's own `policyNumber`/`referenceNo`/`payorName`/`planLabel`/`premium`/`dateReceived`
columns are a **denormalized snapshot**, not derived live from the FK target — this is
intentional, since `policyNumber`/`referenceNo` is the natural key a cashier actually
searches by, independent of whether `ofwApplicationId` happens to be set (e.g. a payment
logged manually with no matching application on file still needs to be searchable by those
two fields alone).

**Current state:** the migration and route exist, but **nothing in the OFW frontend calls
`/api/payments-nonlife` yet**. `nonlife_payment_transactions.tsx` (the consolidated view,
§4/§5 in `SITEMAP.md`) still only holds a cashier-created row in that component's own React
session state — it is not persisted through this endpoint. Wiring that up is a distinct,
not-yet-done follow-up (same caveat noted in root handover §4's non-life FK note).

`OfwApplication.paymentTransactions` is the Prisma back-relation into
`NonLifePaymentTransaction` for `product: OFW` rows — see `DATABASE_SCHEMA.md`'s ER diagram
(`OFW_APPLICATION ||--o{ NONLIFE_PAYMENT_TRANSACTION : "paid via"`).
