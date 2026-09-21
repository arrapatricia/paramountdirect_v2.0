import { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import Login from './components/login';
import Sidebar, { type ProductLine } from './components/sidebar';
import Dashboard from './components/dashboard';
import OfwDashboard from './components/ofw_dashboard';
import OfwApplicationList from './components/ofw_application_list';
import OfwCreateApplication from './components/ofw_create_application';
import { OFW_STATUSES, type OfwApplication } from './components/ofw_types';
import CtplDashboard from './components/ctpl_dashboard';
import CtplApplicationList from './components/ctpl_application_list';
import CtplCreateApplication from './components/ctpl_create_application';
import { CTPL_STATUSES, type CtplApplication } from './components/ctpl_types';
import GtpDashboard from './components/gtp_dashboard';
import GtpApplicationList from './components/gtp_application_list';
import GtpCreateApplication from './components/gtp_create_application';
import { GTP_STATUSES, type GtpApplication } from './components/gtp_types';
import LifeApplicationsOverview from './components/life_applications_overview';
import LifeFollowupCalls from './components/life_followup_calls';
import LifeSignedApplications from './components/life_signed_applications';
import LifeScreenedApplications from './components/life_screened_applications';
import LifeFollowupSignature from './components/life_followup_signature';
import LifeApplicationStatuses from './components/life_application_statuses';
import ApplicationInquiry from './components/application_inquiry';
import ApplicationScreening from './components/application_screening';
import PdLifeApplicationsHub from './components/pdlife_applications_hub';
import PdLifeCreateApplication from './components/pdlife_create_application';
import type { PdLifeApplication } from './components/pdlife_types';
import ApplicationDetailHealth from './components/application_detail_health';
import ApplicationDetailLifeAccident from './components/application_detail_lifeaccident';
import ApplicationDetailComprehensive from './components/application_detail_comprehensive';
import PaymentTransactions from './components/payment_transactions';
import Billing from './components/billing';
import OfwPaymentTransactions from './components/ofw_payment_transactions';
import CtplPaymentTransactions from './components/ctpl_payment_transactions';
import GtpPaymentTransactions from './components/gtp_payment_transactions';
import Maintenance from './components/maintenance';
import UserRoleManagement, { INITIAL_USERS, type UserAccount } from './components/user_role_management';
import AuditLogs from './components/audit_logs';
// Premium Maintenance removed from nav per request - see the commented-out
// render branch below and sidebar.tsx's commented-out 'premiums' nav entry.
// import PremiumMaintenance from './components/premium_maintenance';
import { INITIAL_PREMIUM_RATES, type PremiumRate } from './components/premium_rates';
import {
  pdLifeApi,
  ofwApi,
  ctplApi,
  gtpApi,
  clearAuthToken,
  getAuthToken,
  fromApiPdLifeStatus,
  toApiPdLifeStatus,
  toApiPlanCategory,
  formatApplicationId,
  toApiOfwNature,
  fromApiOfwNature,
  toApiOfwCoverage,
  fromApiOfwCoverage,
  toApiCtplPolicyType,
  fromApiCtplPolicyType,
  toApiCtplRenewalType,
  fromApiCtplRenewalType,
  toApiCtplClientType,
  fromApiCtplClientType,
  toApiGtpPlanVariant,
  fromApiGtpPlanVariant,
  usersApi,
  rolesApi,
  paymentsApi,
  type PdLifeApplicationApi,
  type OfwApplicationApi,
  type CtplApplicationApi,
  type GtpApplicationApi,
  type UserApi,
  type RoleApi,
  type LifePaymentTransactionApi,
} from './lib/api';
import logoImg from './assets/PD Logo_full color.png';
import logoImgWhite from './assets/PD Logo_white.png';
import { buildPath, parsePath } from './lib/routes';

export interface ScreeningItem {
  id: string;
  // Sequential, human-readable reference (e.g. "0000001"), assigned at
  // creation - always present once an application comes from the real
  // backend. Falls back to `id` only for entirely local/mock rows.
  applicationId?: string;
  // Real iPeak-format policy number (e.g. "GLP-000001-1"), assigned once
  // the application is first transmitted to iPeak - null/absent for
  // applications still at "Received". `id` (the internal database id) is
  // never meant for display - see renderApplicationDetail in App.tsx.
  policyNumber?: string | null;
  payor: string;
  planCode: string;
  planDesc: string;
  premium: string;
  source: string;
  dateReceived: string;
  dateScreened: string;
  screenedBy: string;
  status: string;
  // Category-specific structured data the application was actually
  // submitted with (policyOwner/contact/payor/category) - see
  // pdlife_types.ts's PdLifeApplicationDetails. Loosely typed here since it
  // comes straight from the backend's Json column.
  details?: Record<string, unknown>;
}

// Maps a real backend PdLifeApplication (dates as ISO strings, status/
// planCategory as Prisma enum identifiers) into the display shape every PD
// Life screen already expects (dates as short display strings, status/
// planCategory with the spaces the UI has always used).
function mapApiToScreeningItem(api: PdLifeApplicationApi): ScreeningItem {
  // Applications ingested from paramountdirect.com already have a real
  // application id assigned on that site (see PdRevampSyncService's
  // build_payload -> details.sourceApplicationId) - screeners need that id,
  // not our own unrelated internal sequence, to look the submission up on
  // the source site. Only ingested rows carry it; everything else (staff-
  // created applications) keeps the internal sequential reference.
  const sourceApplicationId =
    api.details && typeof api.details === 'object' && 'sourceApplicationId' in api.details
      ? String((api.details as Record<string, unknown>).sourceApplicationId)
      : undefined;
  return {
    id: api.id,
    applicationId: sourceApplicationId ?? formatApplicationId(api.applicationSeq),
    policyNumber: api.policyNumber,
    payor: api.payor,
    planCode: api.planCode,
    planDesc: api.planDesc,
    premium: api.premium,
    source: api.source,
    dateReceived: toDisplayDate(api.dateReceived),
    dateScreened: toDisplayDate(api.dateScreened),
    screenedBy: api.screenedBy ?? '-',
    status: fromApiPdLifeStatus(api.status),
    details: api.details,
  };
}

// Shared by the OFW/CTPL/GTP mappers below - same short display-date
// convention as PD Life's mapApiToScreeningItem.
function toDisplayDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US');
}
// For fields the UI edits as a plain <input type="date">, e.g. birthdate.
function toDisplayDateOnly(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function mapApiToOfwApplication(api: OfwApplicationApi): OfwApplication {
  return {
    id: api.id,
    lastName: api.lastName,
    firstName: api.firstName,
    middleName: api.middleName,
    gender: api.gender as OfwApplication['gender'],
    civilStatus: api.civilStatus as OfwApplication['civilStatus'],
    birthdate: toDisplayDateOnly(api.birthdate),
    placeOfBirth: api.placeOfBirth,
    phAddress: api.phAddress,
    phRegion: api.phRegion,
    phCity: api.phCity,
    phBarangay: api.phBarangay,
    phone: api.phone,
    email: api.email,
    referralSource: api.referralSource,
    natureOfEmployment: fromApiOfwNature(api.natureOfEmployment) as OfwApplication['natureOfEmployment'],
    coverageType: fromApiOfwCoverage(api.coverageType) as OfwApplication['coverageType'],
    occupation: api.occupation,
    passportNumber: api.passportNumber,
    salaryAmount: api.salaryAmount,
    salaryCurrency: api.salaryCurrency as OfwApplication['salaryCurrency'],
    employerName: api.employerName,
    employerCountry: api.employerCountry,
    contractStart: toDisplayDateOnly(api.contractStart),
    contractEnd: toDisplayDateOnly(api.contractEnd),
    insuranceStart: toDisplayDateOnly(api.insuranceStart),
    beneficiaries: api.beneficiaries.map((b) => ({ fullName: b.fullName, relationship: b.relationship, birthdate: toDisplayDateOnly(b.birthdate) })),
    isConflictZone: api.isConflictZone,
    documents: {
      passport: api.passportDoc as OfwApplication['documents']['passport'],
      visa: api.visaDoc as OfwApplication['documents']['visa'],
      employmentContract: api.employmentContractDoc as OfwApplication['documents']['employmentContract'],
      medicalCertificate: api.medicalCertificateDoc as OfwApplication['documents']['medicalCertificate'],
    },
    premium: api.premium,
    dateReceived: toDisplayDate(api.dateReceived),
    status: api.status as OfwApplication['status'],
    screenedBy: api.screenedBy ?? '-',
    employmentVerified: api.employmentVerified as OfwApplication['employmentVerified'],
    paymentInstructionSent: api.paymentInstructionSent,
    isPaid: api.isPaid,
    policyNumber: api.policyNumber ?? undefined,
    referenceNo: api.referenceNo ?? undefined,
  };
}

function mapApiToCtplApplication(api: CtplApplicationApi): CtplApplication {
  return {
    id: api.id,
    policyType: fromApiCtplPolicyType(api.policyType) as CtplApplication['policyType'],
    mvType: api.mvType,
    renewalType: fromApiCtplRenewalType(api.renewalType) as CtplApplication['renewalType'],
    clientType: fromApiCtplClientType(api.clientType) as CtplApplication['clientType'],
    ownerFirstName: api.ownerFirstName,
    ownerMiddleName: api.ownerMiddleName,
    ownerSurname: api.ownerSurname,
    ownerAddress: api.ownerAddress,
    ownerRegion: api.ownerRegion,
    ownerCity: api.ownerCity,
    ownerBarangay: api.ownerBarangay,
    sameAsOwner: api.sameAsOwner,
    applicantFirstName: api.applicantFirstName,
    applicantSurname: api.applicantSurname,
    email: api.email,
    mobileNumber: api.mobileNumber,
    plateNumber: api.plateNumber,
    mvFileNumber: api.mvFileNumber,
    chassisNumber: api.chassisNumber,
    requiresCOV: api.requiresCOV,
    premium: api.premium,
    dateReceived: toDisplayDate(api.dateReceived),
    status: api.status as CtplApplication['status'],
    screenedBy: api.screenedBy ?? '-',
    isPaid: api.isPaid,
    policyNumber: api.policyNumber ?? undefined,
    referenceNo: api.referenceNo ?? undefined,
  };
}

function mapApiToGtpApplication(api: GtpApplicationApi): GtpApplication {
  return {
    id: api.id,
    travelType: api.travelType as GtpApplication['travelType'],
    destinations: api.destinations,
    departureDate: toDisplayDateOnly(api.departureDate),
    returnDate: toDisplayDateOnly(api.returnDate),
    daysOfTravel: api.daysOfTravel,
    applicationType: api.applicationType as GtpApplication['applicationType'],
    travelerFirstName: api.travelerFirstName,
    travelerSurname: api.travelerSurname,
    birthdate: toDisplayDateOnly(api.birthdate),
    email: api.email,
    mobileNumber: api.mobileNumber,
    planVariant: fromApiGtpPlanVariant(api.planVariant) as GtpApplication['planVariant'],
    cruiseCoverage: api.cruiseCoverage,
    hazardousSportsCoverage: api.hazardousSportsCoverage,
    isSchengenDestination: api.isSchengenDestination,
    premium: api.premium,
    dateReceived: toDisplayDate(api.dateReceived),
    status: api.status as GtpApplication['status'],
    screenedBy: api.screenedBy ?? '-',
    isPaid: api.isPaid,
    policyNumber: api.policyNumber ?? undefined,
    referenceNo: api.referenceNo ?? undefined,
  };
}

// Real backend user -> the display shape User & Role Management already
// expects. `role` falls back to the first Direct Marketing role for the rare
// case of a user with no roleId set - matches how the rest of this file
// treats "no real data yet" as distinct from a deliberately-blank field.
function mapApiToUserAccount(api: UserApi): UserAccount {
  return {
    id: api.id,
    firstName: api.firstName,
    lastName: api.lastName,
    email: api.email,
    role: api.role?.name ?? 'DM Operations',
    assignedProducts: api.assignedProducts as UserAccount['assignedProducts'],
    status: api.status,
    lastLogin: api.lastLoginAt ? toDisplayDate(api.lastLoginAt) : 'Never',
  };
}

// Fresh-environment reset: no seed applications, only the two retained
// accounts (see INITIAL_USERS in user_role_management.tsx). Set the length back
// above 0 to bring the demo dataset back.
const initialMockData: ScreeningItem[] = Array.from({ length: 0 }).map((_, i) => {
  const plans = [
    { code: 'HIP', desc: 'Plan 500 - Family', premium: '₱500.00' },
    { code: 'GLA', desc: '1 Unit', premium: '₱413.00' },
    { code: 'SSP', desc: 'Plan 100 - 10 years to pay', premium: '₱892.00' },
    { code: 'PHC', desc: 'Plan 1000 - Individual', premium: '₱1,000.00' },
    { code: 'GPR', desc: 'Plan 200', premium: '₱350.00' },
    { code: 'MPR', desc: 'Plan 300', premium: '₱600.00' }
  ];
  const plan = plans[i % plans.length];
  const day = 27 - (i % 5);
  const screeners = ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'];
  // Offset by the plan cycle count so screeners rotate across every plan type
  // instead of each plan permanently pinning to one screener (plans.length is
  // a multiple of screeners.length, so `i % screeners.length` alone would be
  // fully determined by `i % plans.length`).
  const screenerIndex = (i + Math.floor(i / plans.length)) % screeners.length;

  return {
    id: `3920${(i + 1).toString().padStart(2, '0')}`,
    payor: ['Christian Bukid', 'Eleonora Sunga', 'Karlo Bautista', 'Lorena Tanguan', 'Juan Dela Cruz'][i % 5],
    planCode: plan.code,
    planDesc: plan.desc,
    premium: plan.premium,
    source: ['Google', 'Email Newsletter', 'Pd Site', 'Facebook'][i % 4],
    dateReceived: `08/${day.toString().padStart(2, '0')}/2026 at 12:${i.toString().padStart(2, '0')} PM`,
    dateScreened: i % 2 === 0 ? '08/28/2026' : '-',
    screenedBy: screeners[screenerIndex],
    status: i < 25 ? 'Received' : (i < 35 ? 'For Verification' : 'Issued')
  };
});

// Paramount Direct only sells the land-based OFW package - every mock
// applicant is Land-based, regardless of occupation.
const OFW_MOCK_APPLICANTS = [
  { firstName: 'Rosalinda', lastName: 'Gomez', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Saudi Arabia' },
  { firstName: 'Marlon', lastName: 'Reyes', occupation: 'Construction Worker', coverage: 'Land-based' as const, country: 'United Arab Emirates' },
  { firstName: 'Cristina', lastName: 'Villanueva', occupation: 'Service Worker', coverage: 'Land-based' as const, country: 'Qatar' },
  { firstName: 'Bayani', lastName: 'Ramos', occupation: 'Seafarers', coverage: 'Land-based' as const, country: 'Hong Kong' },
  { firstName: 'Precious', lastName: 'Manalo', occupation: 'Medical Professional', coverage: 'Land-based' as const, country: 'Singapore' },
  { firstName: 'Domingo', lastName: 'Cruz', occupation: 'Maritime Professional', coverage: 'Land-based' as const, country: 'Kuwait' },
  { firstName: 'Jocelyn', lastName: 'Ferrer', occupation: 'Household/Domestic Worker', coverage: 'Land-based' as const, country: 'Ukraine' },
  { firstName: 'Ramil', lastName: 'Torres', occupation: 'Factory Worker', coverage: 'Land-based' as const, country: 'Israel' },
];

const initialOfwMockData: OfwApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const applicant = OFW_MOCK_APPLICANTS[i % OFW_MOCK_APPLICANTS.length];
  // Weighted so most applications sit in 'Received' (the common case), with
  // the terminal outcomes appearing occasionally.
  const statusCycle: typeof OFW_STATUSES[number][] = [
    'Received', 'Received', 'Received', 'Cancelled', 'Received', 'Duplicate', 'Received', 'Reversed',
  ];
  const status = statusCycle[i % statusCycle.length];
  const isConflictZone = ['Ukraine', 'Israel', 'Yemen', 'Syria'].includes(applicant.country);
  const day = 27 - (i % 5);

  return {
    id: `800${(10000 + i).toString()}`,
    lastName: applicant.lastName,
    firstName: applicant.firstName,
    middleName: 'Santos',
    gender: (i % 2 === 0 ? 'Male' : 'Female') as 'Male' | 'Female',
    civilStatus: 'Single' as const,
    birthdate: '1990-05-15',
    placeOfBirth: 'Manila',
    phAddress: '123 Rizal Street',
    phRegion: 'NCR - National Capital Region',
    phCity: 'Manila City',
    phBarangay: 'N/A',
    phone: '09171234567',
    email: `${applicant.firstName.toLowerCase()}.${applicant.lastName.toLowerCase()}@example.com`,
    referralSource: ['Facebook', 'Google', 'Paramount Website', 'POEA/POLO', 'Referral'][i % 5],
    natureOfEmployment: (i % 3 === 0 ? 'Balik-Manggagawa' : 'Direct-hired') as 'Direct-hired' | 'Balik-Manggagawa',
    coverageType: applicant.coverage,
    occupation: applicant.occupation,
    passportNumber: `P${1000000 + i}`,
    salaryAmount: 500 + i * 25,
    salaryCurrency: 'USD' as const,
    employerName: `${applicant.country} Manpower Services`,
    employerCountry: applicant.country,
    contractStart: '2026-01-01',
    contractEnd: '2028-01-01',
    insuranceStart: '2026-01-01',
    beneficiaries: [{ fullName: `${applicant.lastName} Beneficiary`, relationship: 'Spouse', birthdate: '1992-03-10' }],
    isConflictZone,
    documents: {
      passport: i % 4 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      visa: i % 5 !== 0 ? 'Uploaded' as const : 'Missing' as const,
      employmentContract: 'Uploaded' as const,
      medicalCertificate: i % 3 !== 0 ? 'Uploaded' as const : 'Missing' as const,
    },
    premium: '$42.00',
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // A few rows carry the full verify -> instruction -> paid flow through to
    // completion so the Documents section has something to demo unlocked.
    employmentVerified: (i % 4 === 0 ? 'Yes' : i % 7 === 0 ? 'No' : 'Pending') as 'Pending' | 'Yes' | 'No',
    paymentInstructionSent: i % 4 === 0,
    isPaid: i % 8 === 0,
  };
});

const CTPL_MOCK_OWNERS = [
  { firstName: 'Ricardo', surname: 'Santos', policyType: 'Private Car' as const, mvType: 'Car', premium: 606 },
  { firstName: 'Ligaya', surname: 'Fernandez', policyType: 'Private Car' as const, mvType: 'Sports Utility Vehicle', premium: 730 },
  { firstName: 'Bayani', surname: 'Cruz', policyType: 'Motorcycle' as const, mvType: 'Motorcycle', premium: 260 },
  { firstName: 'Corazon', surname: 'Aquino', policyType: 'Commercial Vehicle' as const, mvType: 'Utility Vehicle', premium: 850 },
  { firstName: 'Emmanuel', surname: 'Bautista', policyType: 'Private Car' as const, mvType: 'Car', premium: 606 },
  { firstName: 'Divina', surname: 'Ramos', policyType: 'Commercial Vehicle' as const, mvType: 'Truck', premium: 1200 },
];

const initialCtplMockData: CtplApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const owner = CTPL_MOCK_OWNERS[i % CTPL_MOCK_OWNERS.length];
  const statusCycle: typeof CTPL_STATUSES[number][] = [
    'Completed', 'Completed', 'Completed', 'Cancelled', 'Completed', 'Spoiled', 'Completed', 'Duplicate', 'Completed', 'Reversed',
  ];
  const status = statusCycle[i % statusCycle.length];
  const day = 27 - (i % 5);

  return {
    id: `MCOC${(1000000 + i).toString()}`,
    policyType: owner.policyType,
    mvType: owner.mvType,
    renewalType: (i % 4 === 0 ? 'Renewal' : 'New (1 Year)') as 'New (1 Year)' | 'Renewal',
    clientType: 'Individual' as const,
    ownerFirstName: owner.firstName,
    ownerMiddleName: 'M',
    ownerSurname: owner.surname,
    ownerAddress: '123 Rizal Street',
    ownerRegion: 'NCR - National Capital Region',
    ownerCity: 'Manila City',
    ownerBarangay: 'N/A',
    sameAsOwner: true,
    applicantFirstName: owner.firstName,
    applicantSurname: owner.surname,
    email: `${owner.firstName.toLowerCase()}.${owner.surname.toLowerCase()}@example.com`,
    mobileNumber: '09171234567',
    plateNumber: `ABC${1000 + i}`.slice(0, 7),
    mvFileNumber: `1301-0000${(1000000 + i).toString().slice(-7)}`,
    chassisNumber: `JT4BR38J2R${(100000 + i).toString().padStart(6, '0')}`,
    requiresCOV: i % 5 === 0,
    premium: `₱${owner.premium.toFixed(2)}`,
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // Straight-through website payment - some mock rows are left unpaid so
    // the Documents section has both locked and unlocked rows to demo.
    isPaid: i % 3 !== 0,
  };
});

const GTP_MOCK_TRAVELERS = [
  { firstName: 'Camille', surname: 'Reyes', destinations: ['Japan'], type: 'Individual' as const, plan: 'Single Trip' as const },
  { firstName: 'Miguel', surname: 'Torres', destinations: ['United States'], type: 'Family' as const, plan: 'Multi-Trip 90' as const },
  { firstName: 'Angelica', surname: 'Santos', destinations: ['Hong Kong'], type: 'Individual' as const, plan: 'Single Trip' as const },
  { firstName: 'Paolo', surname: 'Villanueva', destinations: ['South Korea'], type: 'Individual' as const, plan: 'Multi-Trip 180' as const },
  { firstName: 'Bianca', surname: 'Gomez', destinations: ['France', 'Italy'], type: 'Family' as const, plan: 'Single Trip' as const },
  { firstName: 'Diego', surname: 'Ramos', destinations: ['Thailand'], type: 'Individual' as const, plan: 'Single Trip' as const },
];

const initialGtpMockData: GtpApplication[] = Array.from({ length: 0 }).map((_, i) => {
  const traveler = GTP_MOCK_TRAVELERS[i % GTP_MOCK_TRAVELERS.length];
  const statusCycle: typeof GTP_STATUSES[number][] = ['Received', 'Received', 'Received', 'Cancelled', 'Received', 'Duplicate'];
  const status = statusCycle[i % statusCycle.length];
  const isSchengenDestination = traveler.destinations.some((d) => ['France', 'Italy'].includes(d));
  const day = 27 - (i % 5);
  const days = 7 + (i % 3) * 3;

  return {
    id: `GTPH-${(100000 + i).toString()}`,
    travelType: 'International' as const,
    destinations: traveler.destinations,
    departureDate: '10/01/2026',
    returnDate: `10/${(1 + days).toString().padStart(2, '0')}/2026`,
    daysOfTravel: days,
    applicationType: traveler.type,
    travelerFirstName: traveler.firstName,
    travelerSurname: traveler.surname,
    birthdate: '1992-06-15',
    email: `${traveler.firstName.toLowerCase()}.${traveler.surname.toLowerCase()}@example.com`,
    mobileNumber: '09171234567',
    planVariant: traveler.plan,
    cruiseCoverage: i % 6 === 0,
    hazardousSportsCoverage: i % 7 === 0,
    isSchengenDestination,
    premium: `₱${(days * 55).toFixed(2)}`,
    dateReceived: `09/${day.toString().padStart(2, '0')}/2026`,
    status,
    screenedBy: ['Juan Dela Cruz', 'Pedro Rodrigo', 'Oliver Rodrigo'][i % 3],
    // Straight-through website payment - some mock rows are left unpaid so
    // the Documents section has both locked and unlocked rows to demo.
    isPaid: i % 3 !== 0,
  };
});

// Auth is otherwise pure in-memory React state, which a page refresh always
// wipes - persisting a flag here is what makes "Remember me" (localStorage,
// survives closing the browser) vs. a plain login (sessionStorage, survives
// a refresh but not closing the tab) actually do something.
const AUTH_STORAGE_KEY = 'pd_authenticated';
// Persisted the same way as AUTH_STORAGE_KEY - the logged-in user's role
// drives role-gated UI (e.g. the product-admin-only Create button on Payment
// Transactions, and the System Admin-only Users & Roles nav entry), so it
// needs to survive a refresh the same way the auth flag does.
const ROLE_STORAGE_KEY = 'pd_current_user_role';
// Persisted the same way as ROLE_STORAGE_KEY - who's actually logged in
// drives the sidebar's name/email display (and the "screened/created by"
// field on every create-application wizard), so it needs to survive a
// refresh too instead of always showing a hardcoded placeholder.
const NAME_STORAGE_KEY = 'pd_current_user_name';
const EMAIL_STORAGE_KEY = 'pd_current_user_email';

function readStoredAuth(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === '1' || sessionStorage.getItem(AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function readStoredRole(): string | null {
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) || sessionStorage.getItem(ROLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStoredName(): string | null {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) || sessionStorage.getItem(NAME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function readStoredEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_STORAGE_KEY) || sessionStorage.getItem(EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Which product/tab/sub-tab is showing - kept in sessionStorage (not
// localStorage) so a reload lands back on the same page instead of resetting
// to the dashboard, but a fresh browser session still starts there.
const NAV_STORAGE_KEY = 'pd_active_nav';

interface StoredNav {
  product: ProductLine;
  tab: string;
  subTab: string;
}

function readStoredNav(): StoredNav | null {
  try {
    const raw = sessionStorage.getItem(NAV_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNav) : null;
  } catch {
    return null;
  }
}

// The URL wins over sessionStorage on load - it's what makes a direct link
// or a page refresh on e.g. /application-inquiry land on that page instead
// of always falling back to the dashboard. sessionStorage only fills in
// when the current URL isn't one of ours (bare '/' on first login, etc.).
function resolveInitialNav(): StoredNav {
  const stored = readStoredNav();
  const parsed = parsePath(window.location.pathname);
  if (parsed) {
    return { product: parsed.product, tab: parsed.tab, subTab: parsed.subTab ?? stored?.subTab ?? 'branch' };
  }
  return stored ?? { product: 'PD Life', tab: 'dashboard', subTab: 'branch' };
}

// Annual sales/premium targets shown on each product's dashboard, editable
// from the Marketing Dashboard. Persisted to localStorage (unlike nav state
// above) since these are business figures someone sets once and expects to
// stick across sessions, not per-tab UI state.
const ANNUAL_TARGETS_STORAGE_KEY = 'pd_annual_targets';

export interface AnnualTargets {
  pdLife: number;
  ofw: number;
  ctpl: number;
  gtp: number;
}

const DEFAULT_ANNUAL_TARGETS: AnnualTargets = {
  pdLife: 2_200_000,
  ofw: 125_000,
  ctpl: 6_200_000,
  gtp: 2_950_000,
};

function readStoredAnnualTargets(): AnnualTargets {
  try {
    const raw = localStorage.getItem(ANNUAL_TARGETS_STORAGE_KEY);
    if (!raw) return DEFAULT_ANNUAL_TARGETS;
    return { ...DEFAULT_ANNUAL_TARGETS, ...(JSON.parse(raw) as Partial<AnnualTargets>) };
  } catch {
    return DEFAULT_ANNUAL_TARGETS;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredAuth);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(readStoredRole);
  const [currentUserName, setCurrentUserName] = useState<string>(() => readStoredName() ?? 'Juan Dela Cruz');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => readStoredEmail() ?? 'juan.delacruz@paramount.com.ph');
  const initialNav = resolveInitialNav();
  const [activeProduct, setActiveProduct] = useState<ProductLine>(initialNav.product);
  const [activeTab, setActiveTab] = useState(initialNav.tab);
  const [activeSubTab, setActiveSubTab] = useState(initialNav.subTab);
  const [selectedApp, setSelectedApp] = useState<{ id: string; planCode: string } | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [screeningData, setScreeningData] = useState<ScreeningItem[]>(initialMockData);
  // Set once the real backend confirms who's logged in (see the effect
  // below) - PD Life screens use this to tell "no real data yet" apart from
  // "there really are zero applications."
  const [pdLifeConnected, setPdLifeConnected] = useState(false);
  const [pdLifeLoadError, setPdLifeLoadError] = useState<string | null>(null);
  // Shared between Follow-up Signature and Signed Applications - both pages
  // show/act on the same "has the client's signed form been received back"
  // state for a given issued policy, so marking it signed from either page
  // needs to be visible on the other.
  const [signedFollowUpIds, setSignedFollowUpIds] = useState<string[]>([]);
  const handleMarkSigned = (id: string) => {
    setSignedFollowUpIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };
  const [ofwApplications, setOfwApplications] = useState<OfwApplication[]>(initialOfwMockData);
  const [isCreatingOfwApp, setIsCreatingOfwApp] = useState(false);
  const [ofwConnected, setOfwConnected] = useState(false);
  const [ofwLoadError, setOfwLoadError] = useState<string | null>(null);
  const [ctplApplications, setCtplApplications] = useState<CtplApplication[]>(initialCtplMockData);
  const [isCreatingCtplApp, setIsCreatingCtplApp] = useState(false);
  const [ctplConnected, setCtplConnected] = useState(false);
  const [ctplLoadError, setCtplLoadError] = useState<string | null>(null);
  const [gtpApplications, setGtpApplications] = useState<GtpApplication[]>(initialGtpMockData);
  const [isCreatingGtpApp, setIsCreatingGtpApp] = useState(false);
  const [gtpConnected, setGtpConnected] = useState(false);
  const [gtpLoadError, setGtpLoadError] = useState<string | null>(null);
  // PD Life's payment/billing snapshot per policy (policyStatus, dueDate,
  // etc.) - a different real data source than screeningData (applications),
  // used for the Lapsed / For Lapse dashboard stats. One row per policy, not
  // per installment - see LifePaymentTransactionApi's comment in lib/api.ts.
  const [lifePaymentTransactions, setLifePaymentTransactions] = useState<LifePaymentTransactionApi[]>([]);
  const [lifePaymentsLoadError, setLifePaymentsLoadError] = useState<string | null>(null);
  const [isCreatingPdLifeApp, setIsCreatingPdLifeApp] = useState(false);
  const [premiumRates] = useState<PremiumRate[]>(INITIAL_PREMIUM_RATES);
  const [annualTargets, setAnnualTargets] = useState<AnnualTargets>(readStoredAnnualTargets);
  const handleUpdateAnnualTargets = (targets: AnnualTargets) => {
    setAnnualTargets(targets);
    try {
      localStorage.setItem(ANNUAL_TARGETS_STORAGE_KEY, JSON.stringify(targets));
    } catch {
      // Private-browsing/storage-disabled contexts can throw - the in-memory
      // state still updates for the rest of this session either way.
    }
  };
  // Lifted out of UserRoleManagement so Login can validate against real
  // provisioned accounts, not just the hardcoded admin/noaccess demo logins.
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  // Same "connected vs mock" pattern as pdLifeConnected/ofwConnected/etc
  // above - Users & Role Management starts on the local INITIAL_USERS mock
  // and switches over once the real /api/users + /api/roles come back.
  const [usersConnected, setUsersConnected] = useState(false);
  const [backendRoles, setBackendRoles] = useState<RoleApi[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify({ product: activeProduct, tab: activeTab, subTab: activeSubTab }));
    } catch {
      // ignore - worst case a reload just falls back to the dashboard
    }
  }, [activeProduct, activeTab, activeSubTab]);

  // Keeps the browser URL in sync with nav state, so every page (sidebar
  // clicks included) has a real, bookmarkable/shareable address - e.g.
  // /application-inquiry - instead of everything living at '/'.
  const isPoppingRef = useRef(false);
  const hasSyncedUrlRef = useRef(false);
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      hasSyncedUrlRef.current = true;
      return;
    }
    const path = buildPath(activeTab, activeSubTab);
    if (window.location.pathname !== path) {
      if (hasSyncedUrlRef.current) {
        window.history.pushState(null, '', path);
      } else {
        window.history.replaceState(null, '', path);
      }
    }
    hasSyncedUrlRef.current = true;
  }, [activeTab, activeSubTab]);

  // Supports the browser's Back/Forward buttons for the URLs above.
  useEffect(() => {
    const onPopState = () => {
      isPoppingRef.current = true;
      setSelectedApp(null);
      setIsCreatingOfwApp(false);
      setIsCreatingCtplApp(false);
      setIsCreatingGtpApp(false);
      setIsCreatingPdLifeApp(false);
      const parsed = parsePath(window.location.pathname);
      if (parsed) {
        setActiveProduct(parsed.product);
        setActiveTab(parsed.tab);
        if (parsed.tab === 'maintenance') setActiveSubTab(parsed.subTab ?? 'branch');
      } else {
        setActiveProduct('PD Life');
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Loads real PD Life applications once there's a real backend session
  // (i.e. login actually went through the backend, not the mock fallback -
  // see login.tsx). Every other product line still runs on mock data.
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    pdLifeApi
      .list()
      .then((apps) => {
        if (cancelled) return;
        setScreeningData(apps.map(mapApiToScreeningItem));
        setPdLifeConnected(true);
        setPdLifeLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPdLifeLoadError(err instanceof Error ? err.message : 'Failed to load PD Life applications.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Same real-backend-session gate as PD Life above - loads real accounts
  // (and the roles catalog, needed to resolve a role name back to a roleId
  // on create/edit) for the System Admin-only Users & Role Management page.
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    Promise.all([usersApi.list(), rolesApi.list()])
      .then(([apiUsers, apiRoles]) => {
        if (cancelled) return;
        setBackendRoles(apiRoles);
        setUsers(apiUsers.map(mapApiToUserAccount));
        setUsersConnected(true);
      })
      .catch(() => {
        // Stay on the local INITIAL_USERS mock if the backend/users API
        // isn't reachable - same fallback behavior as every other product.
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Same real-backend-session gate as PD Life above, one effect per product
  // line since each lives in its own table/route.
  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    ofwApi
      .list()
      .then((apps) => {
        if (cancelled) return;
        setOfwApplications(apps.map(mapApiToOfwApplication));
        setOfwConnected(true);
        setOfwLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setOfwLoadError(err instanceof Error ? err.message : 'Failed to load OFW applications.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    ctplApi
      .list()
      .then((apps) => {
        if (cancelled) return;
        setCtplApplications(apps.map(mapApiToCtplApplication));
        setCtplConnected(true);
        setCtplLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setCtplLoadError(err instanceof Error ? err.message : 'Failed to load CTPL applications.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    gtpApi
      .list()
      .then((apps) => {
        if (cancelled) return;
        setGtpApplications(apps.map(mapApiToGtpApplication));
        setGtpConnected(true);
        setGtpLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setGtpLoadError(err instanceof Error ? err.message : 'Failed to load GTP applications.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) return;
    let cancelled = false;
    paymentsApi
      .list()
      .then((payments) => {
        if (cancelled) return;
        setLifePaymentTransactions(payments);
        setLifePaymentsLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLifePaymentsLoadError(err instanceof Error ? err.message : 'Failed to load payment transactions.');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLoginSuccess = (rememberMe: boolean, role: string, name: string, email: string) => {
    try {
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem(AUTH_STORAGE_KEY, '1');
      store.setItem(ROLE_STORAGE_KEY, role);
      store.setItem(NAME_STORAGE_KEY, name);
      store.setItem(EMAIL_STORAGE_KEY, email);
    } catch {
      // Private-browsing/storage-disabled contexts can throw - login still
      // works for the current in-memory session, it just won't survive a refresh.
    }
    setCurrentUserRole(role);
    setCurrentUserName(name);
    setCurrentUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(NAME_STORAGE_KEY);
      sessionStorage.removeItem(NAME_STORAGE_KEY);
      localStorage.removeItem(EMAIL_STORAGE_KEY);
      sessionStorage.removeItem(EMAIL_STORAGE_KEY);
      sessionStorage.removeItem(NAV_STORAGE_KEY);
    } catch {
      // See handleLoginSuccess.
    }
    clearAuthToken();
    setPdLifeConnected(false);
    setCurrentUserRole(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} setDarkMode={toggleDarkMode} users={users} />;
  }

  // Fire-and-forget from the detail pages' point of view (they just call
  // onUpdateStatus(status) synchronously, same as always) - the real PATCH
  // happens here, and this is also where a PD Life application actually
  // transmits to iPeak server-side once it leaves "Received".
  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedApp) return;
    if (!pdLifeConnected) {
      setScreeningData(prev => prev.map(app =>
        app.id === selectedApp.id ? { ...app, status: newStatus } : app
      ));
      return;
    }
    pdLifeApi
      .updateStatus(selectedApp.id, toApiPdLifeStatus(newStatus))
      .then((updated) => {
        setScreeningData(prev => prev.map(app => (app.id === updated.id ? mapApiToScreeningItem(updated) : app)));
      })
      .catch((err) => {
        setPdLifeLoadError(err instanceof Error ? err.message : 'Failed to update status.');
      });
  };

  // Shared by both PdLifeCreateApplication call sites (Inquiry tab and
  // Screening tab) - posts to the real backend when a real session exists,
  // otherwise keeps the old local-only behavior so mock-only logins are
  // unaffected. Returns the application with its real id/dates/status once
  // the backend confirms it, so the wizard's confirmation screen shows the
  // real record rather than the locally-invented placeholder one.
  const handleCreatePdLifeApp = async (app: PdLifeApplication): Promise<PdLifeApplication> => {
    if (!pdLifeConnected) {
      setScreeningData(prev => [{ ...app, details: app.details as unknown as Record<string, unknown> }, ...prev]);
      return app;
    }
    const created = await pdLifeApi.create({
      payor: app.payor,
      planCategory: toApiPlanCategory(app.planCategory),
      planCode: app.planCode,
      planDesc: app.planDesc,
      premium: app.premium,
      source: app.source,
      dateReceived: new Date().toISOString(),
      screenedBy: app.screenedBy,
      status: toApiPdLifeStatus(app.status),
      details: app.details as unknown as Record<string, unknown>,
    });
    const mapped = mapApiToScreeningItem(created);
    setScreeningData(prev => [mapped, ...prev]);
    return { ...app, id: created.id, dateReceived: mapped.dateReceived, dateScreened: mapped.dateScreened, status: mapped.status };
  };

  // Same pattern as handleCreatePdLifeApp above, one per product line - the
  // create-application wizard already builds a fully-formed local record
  // with a placeholder id; when connected, that placeholder is discarded in
  // favor of the real server record (real id/dateReceived/etc).
  const handleCreateOfwApp = async (app: OfwApplication) => {
    if (!ofwConnected) {
      setOfwApplications(prev => [app, ...prev]);
      return;
    }
    const created = await ofwApi.create({
      lastName: app.lastName,
      firstName: app.firstName,
      middleName: app.middleName,
      gender: app.gender,
      civilStatus: app.civilStatus,
      birthdate: new Date(app.birthdate).toISOString(),
      placeOfBirth: app.placeOfBirth,
      phAddress: app.phAddress,
      phRegion: app.phRegion,
      phCity: app.phCity,
      phBarangay: app.phBarangay,
      phone: app.phone,
      email: app.email,
      referralSource: app.referralSource,
      natureOfEmployment: toApiOfwNature(app.natureOfEmployment),
      coverageType: toApiOfwCoverage(app.coverageType),
      occupation: app.occupation,
      passportNumber: app.passportNumber,
      salaryAmount: app.salaryAmount,
      salaryCurrency: app.salaryCurrency,
      employerName: app.employerName,
      employerCountry: app.employerCountry,
      contractStart: new Date(app.contractStart).toISOString(),
      contractEnd: new Date(app.contractEnd).toISOString(),
      insuranceStart: new Date(app.insuranceStart).toISOString(),
      isConflictZone: app.isConflictZone,
      passportDoc: app.documents.passport,
      visaDoc: app.documents.visa,
      employmentContractDoc: app.documents.employmentContract,
      medicalCertificateDoc: app.documents.medicalCertificate,
      premium: app.premium,
      dateReceived: new Date().toISOString(),
      status: app.status,
      screenedBy: app.screenedBy,
      employmentVerified: app.employmentVerified,
      paymentInstructionSent: app.paymentInstructionSent,
      isPaid: app.isPaid,
      beneficiaries: app.beneficiaries.map((b) => ({ fullName: b.fullName, relationship: b.relationship, birthdate: new Date(b.birthdate).toISOString() })),
    });
    setOfwApplications(prev => [mapApiToOfwApplication(created), ...prev]);
  };

  const handleUpdateOfwApp = (id: string, patch: Partial<OfwApplication>) => {
    setOfwApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app));
    if (!ofwConnected) return;
    ofwApi.update(id, patch).catch((err) => {
      setOfwLoadError(err instanceof Error ? err.message : 'Failed to update OFW application.');
    });
  };

  const handleCreateCtplApp = async (app: CtplApplication) => {
    if (!ctplConnected) {
      setCtplApplications(prev => [app, ...prev]);
      return;
    }
    const created = await ctplApi.create({
      policyType: toApiCtplPolicyType(app.policyType),
      mvType: app.mvType,
      renewalType: toApiCtplRenewalType(app.renewalType),
      clientType: toApiCtplClientType(app.clientType),
      ownerFirstName: app.ownerFirstName,
      ownerMiddleName: app.ownerMiddleName,
      ownerSurname: app.ownerSurname,
      ownerAddress: app.ownerAddress,
      ownerRegion: app.ownerRegion,
      ownerCity: app.ownerCity,
      ownerBarangay: app.ownerBarangay,
      sameAsOwner: app.sameAsOwner,
      applicantFirstName: app.applicantFirstName,
      applicantSurname: app.applicantSurname,
      email: app.email,
      mobileNumber: app.mobileNumber,
      plateNumber: app.plateNumber,
      mvFileNumber: app.mvFileNumber,
      chassisNumber: app.chassisNumber,
      requiresCOV: app.requiresCOV,
      premium: app.premium,
      dateReceived: new Date().toISOString(),
      status: app.status,
      screenedBy: app.screenedBy,
      isPaid: app.isPaid,
    });
    setCtplApplications(prev => [mapApiToCtplApplication(created), ...prev]);
  };

  const handleUpdateCtplApp = (id: string, patch: Partial<CtplApplication>) => {
    setCtplApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app));
    if (!ctplConnected) return;
    ctplApi.update(id, patch).catch((err) => {
      setCtplLoadError(err instanceof Error ? err.message : 'Failed to update CTPL application.');
    });
  };

  const handleCreateGtpApp = async (app: GtpApplication) => {
    if (!gtpConnected) {
      setGtpApplications(prev => [app, ...prev]);
      return;
    }
    const created = await gtpApi.create({
      travelType: app.travelType,
      destinations: app.destinations,
      departureDate: new Date(app.departureDate).toISOString(),
      returnDate: new Date(app.returnDate).toISOString(),
      daysOfTravel: app.daysOfTravel,
      applicationType: app.applicationType,
      travelerFirstName: app.travelerFirstName,
      travelerSurname: app.travelerSurname,
      birthdate: new Date(app.birthdate).toISOString(),
      email: app.email,
      mobileNumber: app.mobileNumber,
      planVariant: toApiGtpPlanVariant(app.planVariant),
      cruiseCoverage: app.cruiseCoverage,
      hazardousSportsCoverage: app.hazardousSportsCoverage,
      isSchengenDestination: app.isSchengenDestination,
      premium: app.premium,
      dateReceived: new Date().toISOString(),
      status: app.status,
      screenedBy: app.screenedBy,
      isPaid: app.isPaid,
    });
    setGtpApplications(prev => [mapApiToGtpApplication(created), ...prev]);
  };

  const handleUpdateGtpApp = (id: string, patch: Partial<GtpApplication>) => {
    setGtpApplications(prev => prev.map(app => app.id === id ? { ...app, ...patch } : app));
    if (!gtpConnected) return;
    gtpApi.update(id, patch).catch((err) => {
      setGtpLoadError(err instanceof Error ? err.message : 'Failed to update GTP application.');
    });
  };

  const renderApplicationDetail = (readOnly: boolean = false) => {
    if (!selectedApp) return null;

    const healthPlans = ['HCP', 'HIP', 'PCP', 'PHC'];
    const lifeAccidentPlans = ['GLP', 'GLA', 'GPR'];
    const comprehensivePlans = ['MPR', 'SSP', 'PHP', 'DRE'];

    const currentApp = screeningData.find(a => a.id === selectedApp.id);
    const initialStatus = currentApp ? currentApp.status : 'Received';

    const props = {
      // Show the real iPeak policy number once assigned, not the internal
      // database id - the id is only meaningful for API calls (see
      // handleUpdateStatus, which keys off selectedApp.id, unaffected by this).
      applicationId: currentApp?.policyNumber || currentApp?.applicationId || selectedApp.id,
      planCode: selectedApp.planCode,
      initialStatus,
      onUpdateStatus: handleUpdateStatus,
      // Only the "Signed" branch needs to do anything - signedFollowUpIds
      // already treats absence as unsigned, which is the default for a
      // freshly issued application.
      onIssueDecision: (signed: boolean) => {
        if (signed) handleMarkSigned(selectedApp.id);
      },
      onBack: () => setSelectedApp(null),
      readOnly,
      // The actual submitted data - everything these pages used to hardcode
      // (name, birthdate, address, employment, beneficiaries, etc.) now
      // comes from here instead. `key` forces a remount per application so
      // each page's internal edit-mode state doesn't leak between records.
      payor: currentApp?.payor ?? '',
      premium: currentApp?.premium ?? '',
      source: currentApp?.source ?? '',
      planDesc: currentApp?.planDesc ?? '',
      details: currentApp?.details ?? {},
      key: selectedApp.id,
    };

    if (healthPlans.includes(selectedApp.planCode)) return <ApplicationDetailHealth {...props} />;
    if (lifeAccidentPlans.includes(selectedApp.planCode)) return <ApplicationDetailLifeAccident {...props} />;
    if (comprehensivePlans.includes(selectedApp.planCode)) return <ApplicationDetailComprehensive {...props} />;

    return <ApplicationDetailHealth {...props} />;
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
      
      {/* Mobile Top Header */}
      <div className={`lg:hidden flex items-center justify-between px-4 py-3 border-b z-30 ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 cursor-pointer">
            <Menu className="h-5 w-5" />
          </button>
          <img src={darkMode ? logoImgWhite : logoImg} alt="Paramount Direct" className="h-8 w-auto" />
        </div>
        <button onClick={toggleDarkMode} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-yellow-400 cursor-pointer">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedApp(null); // Resets detail view on menu navigation
          setIsCreatingOfwApp(false);
          setIsCreatingCtplApp(false);
          setIsCreatingGtpApp(false);
          setIsCreatingPdLifeApp(false);
        }}
        activeSubTab={activeSubTab} 
        setActiveSubTab={setActiveSubTab} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUserName={currentUserName}
        currentUserEmail={currentUserEmail}
        currentUserRole={currentUserRole}
        activeProduct={activeProduct}
        setActiveProduct={setActiveProduct}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Primary Main Content View */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <>
            {lifePaymentsLoadError && (
              <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-4 md:pt-8">
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                  {lifePaymentsLoadError}
                </div>
              </div>
            )}
            <Dashboard data={screeningData} annualTarget={annualTargets.pdLife} paymentTransactions={lifePaymentTransactions} />
          </>
        )}

        {/* Life Statistics */}
        {activeTab === 'life-monthly' && <LifeApplicationsOverview period="Monthly" data={screeningData} />}
        {activeTab === 'life-daily' && <LifeApplicationsOverview period="Daily" data={screeningData} />}
        {activeTab === 'life-followup-calls' && <LifeFollowupCalls />}
        {activeTab === 'life-signed' && <LifeSignedApplications data={screeningData} signedIds={signedFollowUpIds} onMarkSigned={handleMarkSigned} />}
        {activeTab === 'life-screened' && <LifeScreenedApplications data={screeningData} />}
        {activeTab === 'life-followup-signature' && <LifeFollowupSignature data={screeningData} signedIds={signedFollowUpIds} onMarkSigned={handleMarkSigned} />}
        {activeTab === 'life-application-statuses' && <LifeApplicationStatuses data={screeningData} />}

        {/* OFW Dashboard */}
        {activeTab === 'ofw-dashboard' && <OfwDashboard data={ofwApplications} annualTarget={annualTargets.ofw} />}

        {/* OFW Applications */}
        {activeTab === 'ofw-applications' && (
          isCreatingOfwApp ? (
            <OfwCreateApplication
              currentUser={currentUserName}
              onBack={() => setIsCreatingOfwApp(false)}
              onCreate={handleCreateOfwApp}
              rates={premiumRates}
            />
          ) : (
            <OfwApplicationList
              data={ofwApplications}
              onCreateNew={() => setIsCreatingOfwApp(true)}
              onUpdate={handleUpdateOfwApp}
            />
          )
        )}

        {/* OFW Payment Transactions */}
        {activeTab === 'ofw-payments' && <OfwPaymentTransactions data={ofwApplications} currentUserRole={currentUserRole} />}

        {/* CTPL Dashboard */}
        {activeTab === 'ctpl-dashboard' && <CtplDashboard data={ctplApplications} annualTarget={annualTargets.ctpl} />}

        {/* CTPL Applications */}
        {activeTab === 'ctpl-applications' && (
          isCreatingCtplApp ? (
            <CtplCreateApplication
              currentUser={currentUserName}
              onBack={() => setIsCreatingCtplApp(false)}
              onCreate={handleCreateCtplApp}
              rates={premiumRates}
            />
          ) : (
            <CtplApplicationList
              data={ctplApplications}
              onCreateNew={() => setIsCreatingCtplApp(true)}
              onUpdate={handleUpdateCtplApp}
            />
          )
        )}

        {/* CTPL Payment Transactions */}
        {activeTab === 'ctpl-payments' && <CtplPaymentTransactions data={ctplApplications} currentUserRole={currentUserRole} />}

        {/* GTP Dashboard */}
        {activeTab === 'gtp-dashboard' && <GtpDashboard data={gtpApplications} annualTarget={annualTargets.gtp} />}

        {/* GTP Applications */}
        {activeTab === 'gtp-applications' && (
          isCreatingGtpApp ? (
            <GtpCreateApplication
              currentUser={currentUserName}
              onBack={() => setIsCreatingGtpApp(false)}
              onCreate={handleCreateGtpApp}
              rates={premiumRates}
            />
          ) : (
            <GtpApplicationList
              data={gtpApplications}
              onCreateNew={() => setIsCreatingGtpApp(true)}
              onUpdate={handleUpdateGtpApp}
            />
          )
        )}

        {/* GTP Payment Transactions */}
        {activeTab === 'gtp-payments' && <GtpPaymentTransactions data={gtpApplications} currentUserRole={currentUserRole} />}

        {pdLifeLoadError && ['applications', 'inquiry', 'screening'].includes(activeTab) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            {pdLifeLoadError}
          </div>
        )}
        {ofwLoadError && activeTab === 'ofw-applications' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            {ofwLoadError}
          </div>
        )}
        {ctplLoadError && activeTab === 'ctpl-applications' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            {ctplLoadError}
          </div>
        )}
        {gtpLoadError && activeTab === 'gtp-applications' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            {gtpLoadError}
          </div>
        )}

        {/* Applications hub */}
        {activeTab === 'applications' && (
          <PdLifeApplicationsHub data={screeningData} onNavigate={setActiveTab} />
        )}

        {/* Application Inquiry */}
        {activeTab === 'inquiry' && (
          selectedApp ? renderApplicationDetail(true) : isCreatingPdLifeApp ? (
            <PdLifeCreateApplication
              currentUser={currentUserName}
              onBack={() => setIsCreatingPdLifeApp(false)}
              onCreate={handleCreatePdLifeApp}
              rates={premiumRates}
            />
          ) : (
            <ApplicationInquiry
              data={screeningData}
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })}
              onCreateNew={() => setIsCreatingPdLifeApp(true)}
            />
          )
        )}

        {/* Payment Transactions & Ledger */}
        {activeTab === 'payments' && (
          <PaymentTransactions
            ctplApplications={ctplApplications}
            ofwApplications={ofwApplications}
            gtpApplications={gtpApplications}
            currentUserRole={currentUserRole}
          />
        )}
        {activeTab === 'billing' && <Billing />}
        {activeTab === 'audit' && <AuditLogs />}

        {/* Users & Role Management - System Admin only; the sidebar entry is
            hidden for everyone else, but a direct link still needs guarding. */}
        {activeTab === 'users-roles' && (
          currentUserRole === 'System Admin' ? (
            <UserRoleManagement
              users={users}
              setUsers={setUsers}
              usersConnected={usersConnected}
              backendRoles={backendRoles.map((r) => ({ id: r.id, name: r.name }))}
            />
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold max-w-[1600px] mx-auto dark:text-slate-500">
              <p>Access restricted to System Admin.</p>
            </div>
          )
        )}

        {/* Maintenance Sub-module Views */}
        {activeTab === 'maintenance' && (
          // Premium Maintenance removed from nav per request - see
          // sidebar.tsx's commented-out 'premiums' entry. Left here
          // commented rather than deleted in case it's needed again.
          // activeSubTab === 'premiums' ? (
          //   <PremiumMaintenance rates={premiumRates} onSave={setPremiumRates} />
          // ) : (
          <Maintenance
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
            annualTargets={annualTargets}
            onUpdateAnnualTargets={handleUpdateAnnualTargets}
          />
        )}

        {/* Application Screening */}
        {activeTab === 'screening' && (
          selectedApp ? renderApplicationDetail() : isCreatingPdLifeApp ? (
            <PdLifeCreateApplication
              currentUser={currentUserName}
              onBack={() => setIsCreatingPdLifeApp(false)}
              onCreate={handleCreatePdLifeApp}
              rates={premiumRates}
            />
          ) : (
            <ApplicationScreening
              data={screeningData}
              onSelectApplication={(id, planCode) => setSelectedApp({ id, planCode })}
              currentUser={currentUserName}
              onCreateNew={() => setIsCreatingPdLifeApp(true)}
            />
          )
        )}
      </main>
    </div>
  );
}