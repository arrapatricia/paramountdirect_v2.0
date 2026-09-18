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

  // GTP is straight-through payment on the client's website (unlike OFW,
  // there's no employment-verification-style gate) - documents unlock as
  // soon as isPaid is true.
  isPaid: boolean;

  // Assigned once the policy is issued; the identifying field the Non-Life
  // Payment Transactions page (in Pay Tran) correlates this application by.
  policyNumber?: string;
  // OR/reference number generated at the moment payment is confirmed.
  referenceNo?: string;
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

// Full country list for the destination picker, sorted alphabetically.
export const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (Republic of the)', 'Congo (DR)', 'Costa Rica', "Cote d'Ivoire", 'Croatia',
  'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macau', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
  'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
];
