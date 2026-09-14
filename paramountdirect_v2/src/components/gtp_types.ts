// Shared GTP (Global Travel Protect Premium) application data model, based
// on the real form at yourtravelinsurance.ph/online-applications.

export interface GtpApplication {
  id: string;
  travelType: 'International' | 'Domestic';
  destinations: string[];
  departureDate: string;
  returnDate: string;
  daysOfTravel: number;
  applicationType: 'Individual' | 'Family';

  travelerFirstName: string;
  travelerSurname: string;
  birthdate: string;
  email: string;
  mobileNumber: string;

  planVariant: 'Single Trip' | 'Multi-Trip 90' | 'Multi-Trip 180';
  cruiseCoverage: boolean;
  hazardousSportsCoverage: boolean;
  isSchengenDestination: boolean;

  premium: string; // formatted, e.g. "₱850.00"
  dateReceived: string;
  status: GtpStatus;
  screenedBy: string;
}

export const GTP_PLAN_VARIANTS = ['Single Trip', 'Multi-Trip 90', 'Multi-Trip 180'] as const;

export type GtpStatus = 'Received' | 'Cancelled' | 'Duplicate';

export const GTP_STATUSES: GtpStatus[] = ['Received', 'Cancelled', 'Duplicate'];

export const GTP_STATUS_DESCRIPTIONS: Record<GtpStatus, string> = {
  'Received': 'Initial upon submission from website',
  'Cancelled': 'Cancelled by client',
  'Duplicate': "There's an existing application already",
};

// Schengen Area member states, since the real site specifically calls out a
// €30,000 / ₱2.5M medical coverage compliance requirement for these.
export const SCHENGEN_COUNTRIES = [
  'Austria', 'Belgium', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway', 'Poland',
  'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
];

// Destinations the site flags as highest cost-of-living, requiring extra
// care that coverage amounts are correctly indicated.
export const HIGH_COST_DESTINATIONS = ['Hong Kong', 'United States', 'Canada'];

export const POPULAR_DESTINATIONS = [
  'Japan', 'United States', 'Hong Kong', 'South Korea', 'Thailand',
  'Singapore', 'Australia', 'France', 'Italy', 'United Kingdom',
];
