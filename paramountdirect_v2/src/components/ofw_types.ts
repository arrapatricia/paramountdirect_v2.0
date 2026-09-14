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
  status: 'Received' | 'For Verification' | 'For Evaluation' | 'Paid' | 'Issued';
  screenedBy: string;
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
