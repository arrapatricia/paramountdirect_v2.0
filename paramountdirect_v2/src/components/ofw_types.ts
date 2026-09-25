// Shared OFW application data model, used by both the application list and
// the create-application form. Field names follow ofwinsurance.ph's own
// application form (researched directly from the live site).

export type DocumentStatus = 'Uploaded' | 'Missing';

export interface OfwApplication {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widower' | 'Separated';
  birthdate: string; // yyyy-mm-dd
  placeOfBirth: string;
  phAddress: string;
  phRegion: string;
  phCity: string;
  phBarangay: string;
  phone: string;
  email: string;
  referralSource: string;

  natureOfEmployment: 'Direct-hired' | 'Balik-Manggagawa';
  // Paramount Direct only sells the land-based OFW package.
  coverageType: 'Land-based';
  occupation: string;
  passportNumber: string;
  salaryAmount: number;
  salaryCurrency: 'PHP' | 'USD' | 'HKD' | 'Others';
  employerName: string;
  employerCountry: string;
  contractStart: string;
  contractEnd: string;
  insuranceStart: string;
  // At least one required, up to three.
  beneficiaries: { fullName: string; relationship: string; birthdate: string }[];
  isConflictZone: boolean;

  documents: {
    passport: DocumentStatus;
    visa: DocumentStatus;
    employmentContract: DocumentStatus;
    medicalCertificate: DocumentStatus;
  };

  premium: string; // formatted, e.g. "$42.00"
  // USD->PHP rate and the resulting PHP-formatted amount - refreshed on
  // every premium change until the payment instruction is sent, then frozen
  // (see applications.ofw.ts) so a forex swing afterward can't change what's due.
  // Fixed-precision NUMERIC(12,3) from the DB, arrives as a string.
  fxRate?: string;
  premiumPhp?: string;
  dateReceived: string;
  // Set once employment is verified 'Yes', once the payment instruction is
  // sent to the client (dateProcessed), and once the policy is issued
  // (isPaid), respectively - blank until then.
  dateVerified?: string;
  dateProcessed?: string;
  dateIssued?: string;
  // Account that sent the payment instruction - set by the server.
  paymentInstructionSentBy?: string;
  status: OfwStatus;
  screenedBy: string;

  // OFW-only caveat: unlike CTPL/GTP's straight-through website payment,
  // an issuer must first verify the employment contract before the client
  // is even sent instructions to pay. Documents only unlock once isPaid is
  // true, which itself can't happen until a payment instruction was sent.
  employmentVerified: 'Pending' | 'Yes' | 'No';
  paymentInstructionSent: boolean;
  isPaid: boolean;

  // OFW calls its policy identifier the "COI Number" (Certificate of
  // Insurance) rather than a policy number - assigned once payment is
  // confirmed, same as CTPL/GTP's policyNumber field.
  policyNumber?: string;
  // Reference No. is assigned to every application as soon as it exists,
  // paid or not - it's what staff use to look an application up before a
  // policy is ever issued.
  referenceNo?: string;
}

export type OfwStatus = 'Received' | 'Spoiled' | 'Duplicate' | 'Reversed' | 'Cancelled';

export const OFW_STATUSES: OfwStatus[] = ['Received', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled'];

export const OFW_STATUS_DESCRIPTIONS: Record<OfwStatus, string> = {
  'Received': 'Initial upon submission from website',
  'Spoiled': 'The application was not paid and only expired',
  'Duplicate': "There's an existing application already",
  'Reversed': 'The application was cancelled and the payment was refunded',
  'Cancelled': 'Cancelled by client',
};

// Policy Status is a separate, payment-driven view on top of the workflow
// `status` above - it answers "where does the policy itself stand", not
// "what happened to the application" (mirrors CtplPolicyStatus):
//   Issued    - paid, and not since reversed/refunded.
//   Cancelled - paid, then refunded with endorsement (status: Reversed).
//   Spoiled   - unpaid for more than 7 days since submission (auto-expires).
//   Pending   - unpaid, still within the 7-day payment window.
export type OfwPolicyStatus = 'Issued' | 'Cancelled' | 'Spoiled' | 'Pending';

export function getOfwPolicyStatus(app: Pick<OfwApplication, 'isPaid' | 'status' | 'dateReceived'>): OfwPolicyStatus {
  if (app.isPaid) return app.status === 'Reversed' ? 'Cancelled' : 'Issued';
  const received = new Date(app.dateReceived);
  if (!Number.isNaN(received.getTime())) {
    const daysSinceReceived = (Date.now() - received.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReceived > 7) return 'Spoiled';
  }
  return 'Pending';
}

// Countries the live form flags with a conflict-zone advisory. Kept short
// and limited to widely-reported active conflict zones for underwriting
// purposes, matching the real product's own advisory feature.
export const CONFLICT_ZONE_COUNTRIES = ['Ukraine', 'Israel', 'Yemen', 'Syria'];

export const OFW_OCCUPATIONS = [
  'Household/Domestic Worker',
  'Construction Worker',
  'Service Worker',
  'Transport Service',
  'Professional Office Worker',
  'Education Professional',
  'Seafarers',
  'Maritime Professional',
  'Factory Worker',
  'Medical Professional',
  'Others',
];
