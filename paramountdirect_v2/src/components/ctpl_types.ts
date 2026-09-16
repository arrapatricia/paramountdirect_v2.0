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

  requiresCOV: boolean; // Certificate of Validation - additional PHP 60 fee via DBP-DCI

  premium: string; // formatted, e.g. "₱606.00"
  dateReceived: string;
  status: CtplStatus;
  screenedBy: string;

  // CTPL is straight-through payment on the client's website (unlike OFW,
  // there's no employment-verification-style gate) - documents unlock as
  // soon as isPaid is true.
  isPaid: boolean;
}

export const CTPL_POLICY_TYPES = ['Private Car', 'Commercial Vehicle', 'Motorcycle'] as const;

export type CtplStatus = 'Completed' | 'Spoiled' | 'Duplicate' | 'Reversed' | 'Cancelled';

export const CTPL_STATUSES: CtplStatus[] = ['Completed', 'Spoiled', 'Duplicate', 'Reversed', 'Cancelled'];

export const CTPL_STATUS_DESCRIPTIONS: Record<CtplStatus, string> = {
  'Completed': 'Initial upon submission from website',
  'Spoiled': 'The application was not paid and only expired',
  'Duplicate': "There's an existing application already",
  'Reversed': 'The application was cancelled and the payment was refunded',
  'Cancelled': 'Cancelled by client',
};

export const CTPL_MV_TYPES = [
  'Car', 'Non-Conventional MV', 'Sports Utility Vehicle', 'Truck', 'Trailer',
  'Motorcycle', 'Motorcycle with Side Car', 'Tourist Bus', 'School Bus',
  'Utility Vehicle', 'Tricycle', 'Shuttle Bus',
];

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
