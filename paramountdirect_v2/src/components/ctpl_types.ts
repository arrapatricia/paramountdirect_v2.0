// Shared CTPL (Compulsory Third Party Liability) application data model,
// based on the real quote + application flow researched at ctpl.ph.

export interface CtplApplication {
  id: string;
  policyType: 'Private Car' | 'Commercial Vehicle' | 'Motorcycle';
  mvType: string; // Car, SUV, Truck, Trailer, Motorcycle, Tricycle, etc.
  renewalType: 'New (1 Year)' | 'Renewal';

  clientType: 'Individual' | 'Corporate without assignee' | 'Corporate with assignee';
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerSurname: string;
  ownerAddress: string;
  ownerRegion: string;
  ownerCity: string;
  ownerBarangay: string;
  sameAsOwner: boolean;
  applicantFirstName: string;
  applicantSurname: string;
  email: string;
  mobileNumber: string;

  plateNumber: string; // 6-7 alphanumeric
  mvFileNumber: string; // 15 numeric digits
  chassisNumber: string; // 17 alphanumeric

  requiresCOV: boolean; // Certificate of Validation - additional COV_FEE via DBP-DCI

  // Motorcycle-only: for-hire/public utility motorcycle (e.g. habal-habal) -
  // gets its own policy number series (LCOC-) instead of the regular MCOC-.
  forPublicUse: boolean;

  premium: string; // formatted, e.g. "₱606.00"
  dateReceived: string;
  status: CtplStatus;
  screenedBy: string;

  // CTPL is straight-through payment on the client's website (unlike OFW,
  // there's no employment-verification-style gate) - documents unlock as
  // soon as isPaid is true.
  isPaid: boolean;

  // Assigned once the policy is issued; the identifying field the Non-Life
  // Payment Transactions page (in Pay Tran) correlates this application by.
  policyNumber?: string;
  // OR/reference number generated at the moment payment is confirmed.
  referenceNo?: string;
}

export const CTPL_POLICY_TYPES = ['Private Car', 'Commercial Vehicle', 'Motorcycle'] as const;

// Certificate of Validation verification fee, collected via DBP-DCI on top
// of the base CTPL premium when requested - added to Other Fees/Charges on
// the Service Invoice (see premium_rates.ts for the full 1-year premium
// computation this is part of).
export const COV_FEE = 60;

export type CtplStatus = 'Completed' | 'Spoiled' | 'Duplicate' | 'Reversed' | 'Cancelled';

export const CTPL_STATUSES: CtplStatus[] = ['Completed', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled'];

export const CTPL_STATUS_DESCRIPTIONS: Record<CtplStatus, string> = {
  'Completed': 'Initial upon submission from website',
  'Spoiled': 'The application was not paid and only expired',
  'Duplicate': "There's an existing application already",
  'Reversed': 'The application was cancelled and the payment was refunded',
  'Cancelled': 'Cancelled by client',
};

// Policy Status is a separate, payment-driven view on top of the workflow
// `status` above - it answers "where does the policy itself stand", not
// "what happened to the application":
//   Issued    - paid, and not since reversed/refunded.
//   Cancelled - paid, then refunded with endorsement (status: Reversed).
//   Spoiled   - unpaid for more than 7 days since submission (auto-expires).
//   Pending   - unpaid, still within the 7-day payment window.
export type CtplPolicyStatus = 'Issued' | 'Cancelled' | 'Spoiled' | 'Pending';

export function getCtplPolicyStatus(app: Pick<CtplApplication, 'isPaid' | 'status' | 'dateReceived'>): CtplPolicyStatus {
  if (app.isPaid) return app.status === 'Reversed' ? 'Cancelled' : 'Issued';
  const received = new Date(app.dateReceived);
  if (!Number.isNaN(received.getTime())) {
    const daysSinceReceived = (Date.now() - received.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReceived > 7) return 'Spoiled';
  }
  return 'Pending';
}

// LTO MV Type options, grouped by Policy Type and matching the official
// 1-year basic-premium rate card (see premium_rates.ts) - each mvType here
// maps to exactly one of the 7 official rate classes:
//   Private Car:       Car/Jeep/Utility Vehicle (₱447.01) or AC/Tourist Car (₱590.65)
//   Commercial Vehicle: Light/Medium Truck ≤3,930kg (₱486.92), Heavy Truck/
//                       Private Bus >3,930kg (₱957.88), Taxi/PUJ/Mini Bus
//                       (₱878.05), or PUB/Tourist Bus (₱1,157.43)
//   Motorcycle:         Motorcycle/Tricycle/Trailer, all one class (₱199.55)
export const CTPL_MV_TYPES_BY_POLICY: Record<(typeof CTPL_POLICY_TYPES)[number], string[]> = {
  'Private Car': ['Car', 'Jeep', 'Sports Utility Vehicle', 'Utility Vehicle', 'AC / Tourist Car'],
  'Commercial Vehicle': [
    'Light/Medium Truck (Own Goods, ≤ 3,930kg)',
    'Heavy Truck (Own Goods) / Private Bus (> 3,930kg)',
    'Taxi / PUJ / Mini Bus',
    'PUB / Tourist Bus',
  ],
  Motorcycle: ['Motorcycle', 'Motorcycle with Side Car', 'Tricycle', 'Trailer'],
};

export const CTPL_MV_TYPES = Object.values(CTPL_MV_TYPES_BY_POLICY).flat();

// Ending plate digit -> coverage effectivity month, per the LTO staggered
// registration schedule the real site publishes.
export const PLATE_ENDING_SCHEDULE: { ending: string; month: string }[] = [
  { ending: '1', month: 'February' },
  { ending: '2', month: 'March' },
  { ending: '3', month: 'April' },
  { ending: '4', month: 'May' },
  { ending: '5', month: 'June' },
  { ending: '6', month: 'July' },
  { ending: '7', month: 'August' },
  { ending: '8', month: 'September' },
  { ending: '9', month: 'October' },
  { ending: '0', month: 'November' },
];
