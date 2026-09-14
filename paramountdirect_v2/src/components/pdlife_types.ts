// PD Life application data model. Unlike OFW/CTPL/GTP (one flat shape per
// product), PD Life's own products split into three plan categories that
// each have a materially different application form - matching the three
// existing application_detail_*.tsx views and researched directly from the
// live wizards/paper forms at paramountdirectdev.herokuapp.com.
//
// The common fields below mirror App.tsx's ScreeningItem exactly (so a
// PdLifeApplication is a drop-in ScreeningItem for the existing Screening /
// Inquiry list views); `details` carries everything specific to the chosen
// plan category, matching the `details: Json` column on the backend's
// PdLifeApplication model.

export type PdLifePlanCategory = 'Health' | 'Life & Accident' | 'Comprehensive';

export const PD_LIFE_PLAN_CODES: Record<PdLifePlanCategory, { code: string; name: string }[]> = {
  'Health': [
    { code: 'HCP', name: 'HealthCARE Cash Plan' },
    { code: 'HIP', name: 'Hospital Income Benefit Plan' },
    { code: 'PCP', name: 'PrimeCARE Cash Plan' },
    { code: 'PHC', name: 'Premium HealthCare Plus Plan' },
  ],
  'Life & Accident': [
    { code: 'GLP', name: 'Guaranteed Life Plan' },
    { code: 'GLA', name: 'Golden Life Advantage' },
    { code: 'GPR', name: 'Go Protect Plan' },
  ],
  'Comprehensive': [
    { code: 'MPR', name: 'MoneyPlus Protection Plan' },
    { code: 'SSP', name: 'Sure Savings Plan' },
    { code: 'PHP', name: 'PrimeHealth Cash Plan' },
    { code: 'DRE', name: 'Dream College Plan' },
  ],
};

export interface PolicyOwnerInfo {
  title: 'Mr.' | 'Ms.' | 'Mrs.';
  firstName: string;
  middleName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  birthdate: string; // yyyy-mm-dd
  placeOfBirth: string;
  nationality: string;
}

export interface ContactInfo {
  houseNumber: string;
  street: string;
  building: string;
  region: string;
  city: string;
  barangay: string;
  zipcode: string;
  mobileNumber: string;
  telephoneNumber: string;
  email: string;
}

export interface PayorInfo {
  sameAsInsured: boolean;
  name: string;
  contactNumber: string;
  email: string;
  relationship: string;
}

export const PAYOR_RELATIONSHIPS = [
  'Aunt', 'Brother', 'Cousin', 'Daughter', 'Father', 'Grandfather', 'Grandmother',
  'Husband', 'Mother', 'Nephew', 'Niece', 'Sister', 'Son', 'Uncle', 'Wife', 'Others',
];

export interface ChildBeneficiary {
  fullName: string;
  birthdate: string;
  relationship: 'Spouse' | 'Child';
}

export interface Beneficiary {
  fullName: string;
  relationship: string;
  birthdate: string;
  revocable: boolean;
}

export type NonForfeitureOption = 'Paid-up Insurance' | 'Automatic Payment of Premium' | 'Cash Surrender';

// Health-specific
export interface HealthDetails {
  insuredOption: 'Individual' | 'Married Couple' | 'Family';
  paymentOption: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  hasLegalSpouse: boolean;
  children: ChildBeneficiary[];
}

// Life & Accident-specific
export interface LifeAccidentDetails {
  units: number;
  paymentOption: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  beneficiaries: Beneficiary[];
  nonForfeitureOption: NonForfeitureOption;
  hasExistingPolicy: boolean;
  existingPolicyDetails: string;
}

// Comprehensive-specific - modeled on the paper-form fields (MPR/SSP), which
// are richer than the PHP web wizard; a simple medical questionnaire is
// included since it's part of every real comprehensive application form but
// wasn't previously captured anywhere in this codebase.
export interface ComprehensiveDetails {
  weightKg: number;
  heightCm: number;
  occupation: string;
  specificDuties: string;
  officeAddress: string;
  officeZipcode: string;
  officeTelephone: string;
  sourceOfFunds: string;
  tin: string;
  gsisOrSss: string;
  beneficiaries: Beneficiary[];
  nonForfeitureOption: NonForfeitureOption;
  hasExistingPolicy: boolean;
  existingPolicyDetails: string;
  medicalQuestionnaire: {
    consultedDoctorPast5Years: boolean;
    advisedOfSeriousCondition: boolean;
    awareOfImpairment: boolean;
    detailsIfYes: string;
  };
}

export interface PdLifeApplicationDetails {
  policyOwner: PolicyOwnerInfo;
  contact: ContactInfo;
  payor: PayorInfo;
  category: HealthDetails | LifeAccidentDetails | ComprehensiveDetails;
}

// Matches App.tsx's ScreeningItem field-for-field (so this is a valid
// ScreeningItem) plus the PD-Life-only planCategory/details extension.
export interface PdLifeApplication {
  id: string;
  payor: string;
  planCode: string;
  planDesc: string;
  premium: string;
  source: string;
  dateReceived: string;
  dateScreened: string;
  screenedBy: string;
  status: string;
  planCategory: PdLifePlanCategory;
  details: PdLifeApplicationDetails;
}
