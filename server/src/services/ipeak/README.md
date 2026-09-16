# PD Life → iPeak (LEAP Services) integration

Transmits PD Life applications to Paramount's AS400-backed "LEAP Services"
API (what the business calls iPeak) the moment a screener moves an
application out of `Received` status. This is a one-way, PD-Life-only
integration — OFW/CTPL/GTP are untouched, and there is no inbound sync yet
for iPeak's own results (policy issuance, service invoice, policy schedule)
to flow back into this system.

See `DEVELOPER_HANDOVER.md` (repo root) Change Log entries (10) and (11) for
the full history of how this was built and verified.

## How it's wired

`PATCH /api/applications/pd-life/:id/status` ([../../routes/applications.pdlife.ts](../../routes/applications.pdlife.ts)):
- `Received → anything` calls `submitNewBusinessToIpeak` (Insert New Business).
- `→ Issued` calls `updateIpeakStatus(..., 'APR')` (Update Status) — **currently broken**, see Known gaps below.

Both are `await`ed but wrapped in try/catch: a transmission failure is
recorded on `PdLifeIpeakRequest` and logged, but must never block the
screener's status update from succeeding.

## Files

| File | Purpose |
|---|---|
| `types.ts` | `LifeNBPolicy`/`LifeLeap`/etc. request & response shapes, transcribed from the LEAP Services System Documentation (2022-07-06). |
| `client.ts` | Builds the request URL, sets the `Authentication-Hash` header, POSTs, parses the `ServiceResponse` envelope. |
| `payloadBuilder.ts` | Builds a `LifeNBPolicy` from a `PdLifeApplication` row — prefers the dedicated scalar columns, falls back to parsing the legacy `details` JSON blob (see "Data sourcing" below). |
| `policyNumber.ts` | Generates the real `PLANCODE-NNNNNN-D` policy number format, atomically per plan code. |
| `submitNewBusiness.ts` | Insert New Business orchestration: assigns a policy number if missing, dedupes, calls `client`, persists a `PdLifeIpeakRequest` row. |
| `updateStatus.ts` | Update Status orchestration — same persistence pattern as above. |

## Environment variables (`server/.env`)

```
IPEAK_SERVICE_URL   # base URL INCLUDING the Public Application Key segment,
                     # e.g. http://ws.paramount.com.ph/test/workflowservice.svc/afpp
                     # - only the web-method path (/lifemb/newbusiness,
                     # /lifemb/update) is appended per call.
IPEAK_PRIVATE_KEY   # sent as-is as the Authentication-Hash header (see below).
```

If either is unset, `callIpeak` never fires an HTTP request — it just
persists a `PdLifeIpeakRequest` row with `success: false` and an explanatory
`errorMessage`. This is intentional: local/dev work without real iPeak
credentials should never crash a status update.

## Data sourcing

`PdLifeApplication` has dedicated scalar columns for the insured's personal
and employment details (added specifically for this integration), but the
create/update routes don't populate them yet — the PD Life frontend still
writes everything into the loose `details: Json` blob
(`policyOwner`/`contact`/category-specific fields, see
`paramountdirect_v2/src/components/pdlife_types.ts`). `payloadBuilder.ts`
reads the scalar columns first and falls back to parsing `details` for
anything not yet populated there, so the integration works today against
real application data without waiting on that follow-up wiring.

## Verified working (2026-09-16)

A full round trip was run against the real UAT server
(`http://ws.paramount.com.ph/test/workflowservice.svc/afpp`) and the real
RDS dev database: create an application → `PATCH .../status` →
`200 OK` / `"ResponseData": 1` from iPeak, with the request/response
persisted on `PdLifeIpeakRequest`.

## Known gaps / hard-won findings

- **Auth doesn't match the doc.** The LEAP Services doc describes an
  `Authentication-Hash` computed as `hex(SHA256(privateKey + lowercased
  request path/query))`. That returns `401` on the real UAT server. What
  actually works — confirmed by testing, and matching what the legacy PD
  system's own `LifeMbNewBusinessService` did — is sending `IPEAK_PRIVATE_KEY`
  **as-is**, unhashed, as the header value. If a future environment enforces
  the documented hash instead, `client.ts` is the only place that needs to
  change.
- **A blank Agent/Branch-Manager section is rejected outright** ("Agent
  details are not valid or do not match our records") — iPeak requires a
  real, registered agent for every submission; it's not a free placeholder.
  `payloadBuilder.ts` hardcodes the same fixed house/direct-channel agent the
  legacy PD system always used (GRACE R. ARTIZA / code 30831, branch manager
  LOLITA V. RUFO / code 23135), confirmed live. Replace with PD Direct's
  actual assigned agent code once known.
- **Update Status is broken.** `LifeLeap.PolicyNo` is typed `decimal`
  server-side (confirmed by a live `400` deserialization error), so our
  alphanumeric `PLANCODE-NNNNNN-D` policy number can't be sent there as-is,
  and neither the Insert method's response (`ResponseData: 1`, just a row
  count) nor anything else we've seen gives us a numeric policy identifier.
  `updateIpeakStatus` is wired but will always fail until this is resolved
  with Paramount's iPeak/AS400 side.
- **Field-length caps found by testing, not fully documented.**
  `ApplicationID` ≤ 15 chars, `CoverageType` ≤ 10 chars — both enforced in
  `payloadBuilder.ts` (`truncate()`), along with the doc's own documented
  per-field max lengths for the I* fields.
- **Owner/Bank/Policy-payment fields are typed placeholders**, not
  collected anywhere in this app (this product line is always
  insured-is-owner, per the legacy implementation too).
- **`PdLifeStatus` has no Declined/Postponed states**, so Update Status
  (once fixed) can currently only ever fire `APR`.
