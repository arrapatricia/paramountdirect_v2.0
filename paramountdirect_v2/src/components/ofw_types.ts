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
  phCity: string;
  phone: string;
  email: string;
  referralSource: string;

  natureOfEmployment: 'Direct-hired' | 'Balik-Manggagawa';
  coverageType: 'Land-based' | 'Sea-based';
  occupation: string;
  passportNumber: string;
  salaryAmount: number;
  salaryCurrency: 'PHP' | 'USD' | 'HKD' | 'Others';
  employerName: string;
  employerCountry: string;
  contractStart: string;
  contractEnd: string;
  insuranceStart: string;
  isConflictZone: boolean;

  documents: {
    passport: DocumentStatus;
    visa: DocumentStatus;
    employmentContract: DocumentStatus;
    medicalCertificate: DocumentStatus;
  };

  premium: string; // formatted, e.g. "$42.00"
  dateReceived: string;
  status: OfwStatus;
  screenedBy: string;

  // OFW-only caveat: unlike CTPL/GTP's straight-through website payment,
  // an issuer must first verify the employment contract before the client
  // is even sent instructions to pay. Documents only unlock once isPaid is
  // true, which itself can't happen until a payment instruction was sent.
  employmentVerified: 'Pending' | 'Yes' | 'No';
  paymentInstructionSent: boolean;
  isPaid: boolean;
}

export type OfwStatus = 'Received' | 'Cancelled' | 'Duplicate' | 'Reversed';

export const OFW_STATUSES: OfwStatus[] = ['Received', 'Cancelled', 'Duplicate', 'Reversed'];

export const OFW_STATUS_DESCRIPTIONS: Record<OfwStatus, string> = {
  'Received': 'Initial upon submission from website',
  'Cancelled': 'Cancelled by client',
  'Duplicate': "There's an existing application already",
  'Reversed': 'The application was cancelled and the payment was refunded',
};

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
