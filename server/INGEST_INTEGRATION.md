# Website → Admin System Integration Guide

For whoever has access to the ofwinsurance.ph, ctpl.ph, and yourtravelinsurance.ph
codebases (staging: ctpl-demo.herokuapp.com, plgic-ofw-staging.herokuapp.com,
globaltravelprotectstaging.herokuapp.com).

## What this is

Each site keeps saving applications to its own database exactly as it does
today — **nothing about that changes**. This just adds one extra step right
after that save succeeds: a server-to-server `POST` to this admin system, so
the application shows up in the right product's Application list here too,
without anyone re-keying it. This is the same pattern paramountdirect.com
already uses in production for PD Life (`POST /api/ingest/pd-life`).

## Auth

Every ingest endpoint is authenticated by a shared secret, not a login —
there's no logged-in user on the website's side:

```
X-Api-Key: <WEBSITE_INGEST_API_KEY>
```

Ask whoever manages this admin system's environment for the current key
value. All four products share the same key.

## Endpoints

| Site | Endpoint |
|---|---|
| paramountdirect.com (PD Life, already live) | `POST /api/ingest/pd-life` |
| ofwinsurance.ph | `POST /api/ingest/ofw` |
| ctpl.ph | `POST /api/ingest/ctpl` |
| yourtravelinsurance.ph | `POST /api/ingest/gtp` |

Base URL is this admin system's API host (ask for the dev/staging/prod URL —
same convention as wherever PD Life's ingest already points). Body is JSON,
`Content-Type: application/json`. A successful call returns `201` with
`{ "id": "<new application id>" }`. Fire this *after* your own save succeeds —
if it fails, log it and move on; it should never block or roll back the
website's own submission.

---

## `POST /api/ingest/ofw`

```json
{
  "lastName": "Dela Cruz",
  "firstName": "Juan",
  "middleName": "Santos",
  "gender": "Male",
  "civilStatus": "Single",
  "birthdate": "1990-05-14",
  "placeOfBirth": "Manila",
  "phAddress": "123 Sample Street",
  "phRegion": "NCR - National Capital Region",
  "phCity": "Quezon City",
  "phBarangay": "Barangay 1",
  "phone": "09171234567",
  "email": "juan@example.com",
  "referralSource": "Google",

  "natureOfEmployment": "Direct_hired",
  "coverageType": "Land_based",
  "occupation": "Household/Domestic Worker",
  "passportNumber": "P1234567A",
  "salaryAmount": 500,
  "salaryCurrency": "USD",
  "employerName": "Sample Employer LLC",
  "employerCountry": "Saudi Arabia",
  "contractStart": "2026-10-01",
  "contractEnd": "2028-10-01",
  "insuranceStart": "2026-10-01",
  "isConflictZone": false,

  "passportDoc": "Uploaded",
  "visaDoc": "Uploaded",
  "employmentContractDoc": "Uploaded",
  "medicalCertificateDoc": "Missing",

  "premium": "42.00",
  "dateReceived": "2026-09-21T10:00:00Z",

  "beneficiaries": [
    { "fullName": "Maria Dela Cruz", "relationship": "Spouse", "birthdate": "1992-03-10" }
  ]
}
```

Notes:
- `natureOfEmployment` is `Direct_hired` or `Balik_Manggagawa` (underscore, not the site's own "Direct-hired" spelling).
- `coverageType` is `Land_based` or `Sea_based`.
- `passportDoc`/`visaDoc`/`employmentContractDoc`/`medicalCertificateDoc` are each `Uploaded` or `Missing`.
- `premium` is a plain numeric string, no currency sign (e.g. `"42.00"`, not `"$42.00"`).
- `beneficiaries`: at least one, up to three.
- The application always lands with `status: "Received"` and `employmentVerified: "Pending"` — OFW's own verification/payment-instruction/paid steps happen here afterward, not at ingest.

## `POST /api/ingest/ctpl`

```json
{
  "policyType": "Private_Car",
  "mvType": "Car",
  "renewalType": "New_1_Year",

  "clientType": "Individual",
  "ownerFirstName": "Juan",
  "ownerMiddleName": "Santos",
  "ownerSurname": "Dela Cruz",
  "ownerAddress": "123 Sample Street",
  "ownerRegion": "NCR - National Capital Region",
  "ownerCity": "Caloocan City",
  "ownerBarangay": "N/A",
  "sameAsOwner": true,
  "applicantFirstName": "Juan",
  "applicantSurname": "Dela Cruz",
  "email": "juan@example.com",
  "mobileNumber": "09171234567",

  "plateNumber": "ABC1234",
  "mvFileNumber": "130100001002045",
  "chassisNumber": "JT4BR38J2R0123456",

  "requiresCOV": false,

  "premium": "606.00",
  "dateReceived": "2026-09-21T10:00:00Z"
}
```

Notes:
- `policyType` is `Private_Car` \| `Commercial_Vehicle` \| `Motorcycle`.
- `renewalType` is `New_1_Year` \| `Renewal`.
- `clientType` is `Individual` \| `Corporate_without_assignee` \| `Corporate_with_assignee`.
- CTPL is straight-through payment on the site itself — the application always lands here with `status: "Completed"` and is already treated as paid, matching how `ctpl_create_application.tsx` behaves for staff-created applications.

## `POST /api/ingest/gtp`

```json
{
  "travelType": "International",
  "destinations": ["Japan"],
  "departureDate": "2026-11-01",
  "returnDate": "2026-11-10",
  "daysOfTravel": 9,
  "applicationType": "Individual",

  "travelerFirstName": "Juan",
  "travelerSurname": "Dela Cruz",
  "birthdate": "1990-05-14",
  "email": "juan@example.com",
  "mobileNumber": "09171234567",

  "planVariant": "Single_Trip",
  "cruiseCoverage": false,
  "hazardousSportsCoverage": false,
  "isSchengenDestination": false,

  "premium": "850.00",
  "dateReceived": "2026-09-21T10:00:00Z"
}
```

Notes:
- `planVariant` is `Single_Trip` \| `Multi_Trip_90` \| `Multi_Trip_180`.
- The application always lands here with `status: "Received"`.

---

## If a call fails

- `401` — missing/wrong `X-Api-Key`, or `WEBSITE_INGEST_API_KEY` isn't configured on this admin system yet.
- `400` — payload didn't match the shape above (check the response body for which field).
- Anything else — treat as transient; log it and retry later, or alert someone. The site's own save has already succeeded by this point regardless.
