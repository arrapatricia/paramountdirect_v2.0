# PD Life — Architecture

Scope: PD Life-specific architecture. For the overall repo layout, general request/response conventions, and cross-product patterns (audit logging, JWT auth, ingest webhooks), see [`../general/ARCHITECTURE.md`](../general/ARCHITECTURE.md) and root `DEVELOPER_HANDOVER.md` §1–2.

**PD Life is the only product line in this app with a real outbound third-party integration** (iPeak/LEAP Services, §2 below). OFW/CTPL/GTP have no iPeak connection at all.

## 1. Frontend ↔ backend wiring for `/api/applications/pd-life`

**Current state: not actually wired.** `App.tsx`'s PD Life data (`screeningData`) is still local `useState` mock data — unlike OFW/CTPL/GTP, which the root handover confirms are wired to their real `/api/applications/{ofw,ctpl,gtp}` routes. The PD Life API client exists and is ready (`lib/api.ts`'s `pdLifeApi`), and the backend route is real and tested, but nothing in `App.tsx` currently calls `pdLifeApi.list()` to populate `screeningData` from the backend on load — this is the single largest gap between PD Life and the other three product lines architecturally.

What does exist and is wired, in `lib/api.ts`:

```ts
export const pdLifeApi = {
  list: () => apiFetch<PdLifeApplicationApi[]>('/api/applications/pd-life'),
  create: (payload) => apiFetch<PdLifeApplicationApi>('/api/applications/pd-life', { method: 'POST', body: JSON.stringify(payload) }),
  claim: (id) => apiFetch<PdLifeApplicationApi>(`/api/applications/pd-life/${id}/claim`, { method: 'PATCH' }),
  updateStatus: (id, status) => apiFetch<PdLifeApplicationApi>(`/api/applications/pd-life/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  // ...
};
```

`App.tsx`'s `handleSelectScreeningApp` (the claim flow) already branches on a `pdLifeConnected` flag — when false, it fakes the claim locally by mutating `screeningData` in place; when true, it calls the real `pdLifeApi.claim(id)` and maps the response back with `mapApiToScreeningItem`. This mirrors exactly how OFW/CTPL/GTP were wired (see their own `*Connected`/`*LoadError` state pairs in `App.tsx`) — completing PD Life's wiring means flipping `pdLifeConnected` on and adding the equivalent `useEffect` fetch-on-mount that OFW/CTPL/GTP already have.

Backend router (`server/src/routes/applications.pdlife.ts`), all behind `requireAuth`:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | List, optional `?status=` filter |
| `GET` | `/:id` | Single application |
| `POST` | `/` | Create (zod-validated `createApplicationSchema`) |
| `PUT` | `/:id` | Full/partial update |
| `PATCH` | `/:id/claim` | Atomic screener claim (§2 of [`HANDOVER.md`](HANDOVER.md)) |
| `PATCH` | `/:id/status` | Status transition — this is what triggers the iPeak calls below |
| `DELETE` | `/:id` | Delete |

Every write records an `AuditLog` row via `recordAudit(req, {...})` (module `'Application Screening'`).

## 2. iPeak service call flow

```
Screener changes status
        │
        ▼
PATCH /api/applications/pd-life/:id/status  (applications.pdlife.ts)
        │
        ├─ existing.status === 'Received' && new status !== 'Received'
        │        │
        │        ▼
        │   submitNewBusinessToIpeak(application, processorEmail)
        │        │  (server/src/services/ipeak/submitNewBusiness.ts)
        │        ├─ assign policyNumber if missing (policyNumber.ts, atomic per-plan-code sequence)
        │        ├─ dedupe: skip if a NewBusiness PdLifeIpeakRequest already exists for this app
        │        ├─ buildLifeNbPolicyPayload(application, email)  (payloadBuilder.ts)
        │        ├─ callIpeak<number>('/lifemb/newbusiness', payload)  (client.ts)
        │        └─ persist PdLifeIpeakRequest{method:'NewBusiness', success, responseBody, ...}
        │
        └─ new status === 'Issued'
                 │
                 ▼
            updateIpeakStatus(application, 'APR', processorEmail)
                 │  (updateStatus.ts)
                 ├─ payload = { PolicyNo: policyNumber ?? application.id, StatusCode: 'APR', ProcessorEmail }
                 ├─ callIpeak<string>('/lifemb/update', payload)
                 └─ persist PdLifeIpeakRequest{method:'UpdateStatus', success, responseBody, ...}

Both calls: awaited inside try/catch that only logs on unexpected throw.
A failed HTTP call is captured as success:false on PdLifeIpeakRequest and
never re-thrown — the status PATCH always returns 200 to the screener
regardless of iPeak's outcome.
```

**`client.ts` (low-level HTTP)**:
- `BASE_URL = process.env.IPEAK_SERVICE_URL` (must already include the Public Application Key path segment).
- `PRIVATE_KEY = process.env.IPEAK_PRIVATE_KEY`.
- `ipeakConfigured()` — both must be set, or `callIpeak` short-circuits to a "not configured" failure result without making any network call.
- Request: `POST {BASE_URL}{webMethodPath}`, header `Authentication-Hash: {PRIVATE_KEY}` (raw, unhashed — see [`HANDOVER.md`](HANDOVER.md) §1.3 for why the documented SHA256 scheme doesn't work), body = JSON payload, 120s timeout (`AbortSignal.timeout`).
- Response envelope: `ServiceResponse<T>` — `ok` is computed as `res.ok && response.StatusCode is 2xx`; non-JSON bodies (e.g. an upstream gateway error page) fall back to `rawBody`.

**Request/response shapes** (`types.ts`, transcribed from the LEAP Services System Documentation):
- `LifeNBPolicy` — the Insert New Business payload: policy header, insured personal/employment/financial fields, agent/branch-manager block (hardcoded, see below), coverage details. Built by `payloadBuilder.ts` from a `PdLifeApplication` row — prefers the dedicated scalar columns (firstName, gender, birthdate, etc.), falls back to parsing the legacy `details: Json` blob for anything not yet populated in those columns.
- `LifeLeap` — the Update Status payload: `{ PolicyNo, StatusCode, ProcessorEmail }`. `StatusCode` is a `LifeLeapStatusCode` — currently only `'APR'` is ever sent (no Declined/Postponed path exists in `PdLifeStatus`).

**Retry/audit via `PdLifeIpeakRequest`:** every attempt (successful or not) is persisted as a row — `applicationId`, `policyNumber`, `method` (`NewBusiness | UpdateStatus | PolicyInquiry`), `requestPayload`, `responseBody`, `statusCode`, `success`, `errorMessage`, `retryCount` (present in the schema but not currently incremented by any retry loop — there is no automatic retry logic today, this is a manual/future hook). This table is the sole audit trail for iPeak transmissions; there's no separate application-level "transmitted to iPeak: yes/no" flag — `application_screening.tsx`'s own comment notes the old "Transmitted to iPeak" column was removed from the UI because every application now transmits regardless of status, making it uninformative as a column.

**Known broken link:** Update Status (`updateIpeakStatus`) is fully wired end-to-end but fails server-side on the real UAT environment — `LifeLeap.PolicyNo` is typed `decimal` there, and this app's `PLANCODE-NNNNNN-D` alphanumeric policy number can't be sent as that type. See [`HANDOVER.md`](HANDOVER.md) §1.3 for the full finding.

**Inbound (Policy Inquiry) — schema-ready, not callable.** `policyInquiryTypes.ts` transcribes the `PDPolicy`/`PolCoverages`/`PolBeneficiaries`/`PayHistory`/`Loans` contract. `distributePolicyInquiry.ts` can turn a `PDPolicy` into a `LifePaymentTransaction` upsert (keyed on `policyNo`), but there is no `client.ts`-equivalent wired up to actually call it — the spec sheet gives only the data contract, not a URL or auth scheme, and it's under a different service label (`GAService`) than the outbound `WorkflowService`.

## 3. Screener-claim atomic update endpoint

```
PATCH /api/applications/pd-life/:id/claim
  1. Resolve the calling user from req.user.sub (JWT) → prisma.user.findUnique
     (403 if not a logged-in user)
  2. screenerName = `${user.firstName} ${user.lastName}`.trim()
  3. prisma.pdLifeApplication.updateMany({
       where: { id, OR: [{ screenedBy: null }, { screenedBy: '' }] },
       data: { screenedBy: screenerName },
     })
     → count is 0 or 1; this is the atomicity primitive - a conditional
       UPDATE at the database level, so two concurrent claims can't both
       succeed in setting screenedBy.
  4. Re-fetch the row (regardless of whether this call won the race) and
     return it - a loser's response still carries the winner's screenedBy,
     which the frontend uses to show "Access Restricted: assigned to ...".
  5. If count > 0 (this call won), record an AuditLog entry.
```

No optimistic locking / version column is needed here specifically because the `WHERE screenedBy IS NULL OR screenedBy = ''` clause itself is the concurrency guard — a second claim attempt against an already-claimed row simply updates zero rows.

## 4. Billing / payment ledger data flow

**Currently two disconnected halves**, unlike a normal frontend↔backend product flow:

- **Frontend (mock only):** `payment_transactions.tsx` (PD Life tab) and `billing.tsx` both run entirely on local generated/mock data (`billing_types.ts`'s `generateLeapPool()` synthesizes fake `LeapDueBilling`-shaped records; `payment_transactions.tsx` has its own local `PaymentTransaction`/`PaymentLedgerItem` interfaces for its mock rows). Neither page calls any backend endpoint.
- **Backend (real, unconnected):** `LifePaymentTransaction` is a real Prisma model, one-to-one with `PdLifeApplication` via `policyNumber`, intended to hold "the current snapshot" of a policy's billing/ledger state once populated — by design, from an inbound iPeak Policy Inquiry response (`distributePolicyInquiry.ts`), not from anything staff enter directly. Since Policy Inquiry isn't callable yet (§2), this table has no real population path today either. There is no Express route exposing `LifePaymentTransaction` at all yet (no `payments.pdlife.ts`-equivalent router).

Both halves are deliberately shaped like their real iPeak counterparts (`LeapDueBilling`, `PDPolicy`) so that wiring them together later is a mapping exercise, not a redesign — but as of now, **no PD Life payment/billing data flows end-to-end from iPeak → backend → frontend**, unlike CTPL/OFW's document generation which is fully real (see general architecture docs for that comparison).

## 5. Summary: PD Life vs the other three products

| | PD Life | OFW / CTPL / GTP |
|---|---|---|
| Frontend ↔ backend application CRUD | **Not wired** (mock `screeningData` in `App.tsx`) | Wired |
| Outbound third-party integration | **Yes** — iPeak/LEAP, live against UAT | None |
| Real generated documents | None | CTPL: real (COC + Service Invoice); OFW: Service Invoice real, COI mock; GTP: mock |
| Payment/billing ledger persisted server-side | `LifePaymentTransaction` model exists, unpopulated, no route | `NonLifePaymentTransaction` model + route exist, generated but frontend not calling it either |
| Ingest webhook from public site | `POST /api/ingest/pd-life` exists | Same pattern for the other three |
