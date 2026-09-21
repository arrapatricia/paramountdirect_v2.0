// Thin client for the real backend (server/) - see server/README.md for the
// API surface. Nothing else in this app calls a real API yet; this is the
// first wiring, starting with PD Life only (App.tsx).

// VITE_API_URL is never set by the deploy pipeline, so the fallback has to be
// right on its own: relative (same-origin) in a built bundle, since nginx
// proxies /api on the same domain the frontend is served from, and
// localhost:4000 only under `vite dev`, where frontend and backend run on
// separate ports. Getting this wrong silently breaks every real API call on
// the live site (requests go to the visiting browser's own localhost) while
// still rendering an unauthenticated-looking-successful, empty-data UI.
const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string; DEV?: boolean } }).env?.VITE_API_URL ??
  (import.meta.env.DEV ? 'http://localhost:4000' : '');

const TOKEN_KEY = 'pd_auth_token';

export function setAuthToken(token: string, persist: boolean) {
  (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { name: string } | null;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};

// Matches server/prisma/schema.prisma's PdLifeApplication - dates come back
// as ISO strings over JSON, not Date objects.
export interface PdLifeApplicationApi {
  id: string;
  applicationSeq: number;
  policyNumber: string | null;
  payor: string;
  planCategory: string;
  planCode: string;
  planDesc: string;
  premium: string;
  source: string;
  dateReceived: string;
  dateScreened: string | null;
  screenedBy: string | null;
  status: string;
  details: Record<string, unknown>;
}

// Wire-format mismatches between the frontend's display strings and the
// backend's Prisma enums - the frontend has always used spaces/no-space
// display forms ("For Verification", "Life & Accident") while the backend
// enum is Prisma-identifier-safe ("For_Verification", "LifeAccident").
const STATUS_TO_API: Record<string, string> = {
  Received: 'Received',
  'For Verification': 'For_Verification',
  'For Evaluation': 'For_Evaluation',
  Paid: 'Paid',
  Issued: 'Issued',
};
const STATUS_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([display, api]) => [api, display])
);
export const toApiPdLifeStatus = (status: string): string => STATUS_TO_API[status] ?? status;
export const fromApiPdLifeStatus = (status: string): string => STATUS_FROM_API[status] ?? status;

const PLAN_CATEGORY_TO_API: Record<string, string> = {
  Health: 'Health',
  'Life & Accident': 'LifeAccident',
  Comprehensive: 'Comprehensive',
};
const PLAN_CATEGORY_FROM_API: Record<string, string> = Object.fromEntries(
  Object.entries(PLAN_CATEGORY_TO_API).map(([display, api]) => [api, display])
);
export const toApiPlanCategory = (category: string): string => PLAN_CATEGORY_TO_API[category] ?? category;
export const fromApiPlanCategory = (category: string): string => PLAN_CATEGORY_FROM_API[category] ?? category;

// Zero-padded 7-digit display form of the sequential applicationSeq, e.g.
// 1 -> "0000001". Used wherever a PD Life application needs a stable,
// human-readable reference before a real iPeak policy number exists.
export const formatApplicationId = (seq: number): string => String(seq).padStart(7, '0');

// Matches server/prisma/schema.prisma's AuditLog.
export interface AuditLogApi {
  id: string;
  timestamp: string;
  userId: string | null;
  userLabel: string;
  role: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export const auditLogApi = {
  list: () => apiFetch<AuditLogApi[]>('/api/audit-logs'),
};

export const pdLifeApi = {
  list: () => apiFetch<PdLifeApplicationApi[]>('/api/applications/pd-life'),
  create: (payload: Omit<PdLifeApplicationApi, 'id' | 'applicationSeq' | 'policyNumber' | 'dateScreened'> & { dateScreened?: string }) =>
    apiFetch<PdLifeApplicationApi>('/api/applications/pd-life', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<PdLifeApplicationApi>(`/api/applications/pd-life/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ---------------------------------------------------------------------------
// OFW / CTPL / GTP - matches server/prisma/schema.prisma's OfwApplication /
// CtplApplication / GtpApplication. Same wire-format mismatch as PD Life
// above: the frontend's display enums use spaces/hyphens ("Direct-hired",
// "Private Car") while the backend's Prisma enums are identifier-safe
// ("Direct_hired", "Private_Car"). Dates come back as ISO strings.
// ---------------------------------------------------------------------------

export interface OfwBeneficiaryApi {
  id?: string;
  fullName: string;
  relationship: string;
  birthdate: string;
}

export interface OfwApplicationApi {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  gender: string;
  civilStatus: string;
  birthdate: string;
  placeOfBirth: string;
  phAddress: string;
  phRegion: string;
  phCity: string;
  phBarangay: string;
  phone: string;
  email: string;
  referralSource: string;
  natureOfEmployment: string;
  coverageType: string;
  occupation: string;
  passportNumber: string;
  salaryAmount: number;
  salaryCurrency: string;
  employerName: string;
  employerCountry: string;
  contractStart: string;
  contractEnd: string;
  insuranceStart: string;
  isConflictZone: boolean;
  passportDoc: string;
  visaDoc: string;
  employmentContractDoc: string;
  medicalCertificateDoc: string;
  premium: string;
  dateReceived: string;
  status: string;
  screenedBy: string | null;
  employmentVerified: string;
  paymentInstructionSent: boolean;
  isPaid: boolean;
  beneficiaries: OfwBeneficiaryApi[];
  policyNumber: string | null;
  referenceNo: string | null;
}

const OFW_NATURE_TO_API: Record<string, string> = { 'Direct-hired': 'Direct_hired', 'Balik-Manggagawa': 'Balik_Manggagawa' };
const OFW_NATURE_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(OFW_NATURE_TO_API).map(([d, a]) => [a, d]));
const OFW_COVERAGE_TO_API: Record<string, string> = { 'Land-based': 'Land_based' };
const OFW_COVERAGE_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(OFW_COVERAGE_TO_API).map(([d, a]) => [a, d]));

export const ofwApi = {
  list: () => apiFetch<OfwApplicationApi[]>('/api/applications/ofw'),
  create: (payload: Omit<OfwApplicationApi, 'id' | 'policyNumber' | 'referenceNo'>) =>
    apiFetch<OfwApplicationApi>('/api/applications/ofw', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Omit<OfwApplicationApi, 'id'>>) =>
    apiFetch<OfwApplicationApi>(`/api/applications/ofw/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};
export const toApiOfwNature = (v: string) => OFW_NATURE_TO_API[v] ?? v;
export const fromApiOfwNature = (v: string) => OFW_NATURE_FROM_API[v] ?? v;
export const toApiOfwCoverage = (v: string) => OFW_COVERAGE_TO_API[v] ?? v;
export const fromApiOfwCoverage = (v: string) => OFW_COVERAGE_FROM_API[v] ?? v;

export interface CtplApplicationApi {
  id: string;
  policyType: string;
  mvType: string;
  renewalType: string;
  clientType: string;
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
  plateNumber: string;
  mvFileNumber: string;
  chassisNumber: string;
  requiresCOV: boolean;
  premium: string;
  dateReceived: string;
  status: string;
  screenedBy: string | null;
  isPaid: boolean;
  policyNumber: string | null;
  referenceNo: string | null;
}

const CTPL_POLICY_TYPE_TO_API: Record<string, string> = {
  'Private Car': 'Private_Car',
  'Commercial Vehicle': 'Commercial_Vehicle',
  Motorcycle: 'Motorcycle',
};
const CTPL_POLICY_TYPE_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(CTPL_POLICY_TYPE_TO_API).map(([d, a]) => [a, d]));
const CTPL_RENEWAL_TO_API: Record<string, string> = { 'New (1 Year)': 'New_1_Year', Renewal: 'Renewal' };
const CTPL_RENEWAL_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(CTPL_RENEWAL_TO_API).map(([d, a]) => [a, d]));
const CTPL_CLIENT_TYPE_TO_API: Record<string, string> = {
  Individual: 'Individual',
  'Corporate without assignee': 'Corporate_without_assignee',
  'Corporate with assignee': 'Corporate_with_assignee',
};
const CTPL_CLIENT_TYPE_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(CTPL_CLIENT_TYPE_TO_API).map(([d, a]) => [a, d]));

export const ctplApi = {
  list: () => apiFetch<CtplApplicationApi[]>('/api/applications/ctpl'),
  create: (payload: Omit<CtplApplicationApi, 'id' | 'policyNumber' | 'referenceNo'>) =>
    apiFetch<CtplApplicationApi>('/api/applications/ctpl', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Omit<CtplApplicationApi, 'id'>>) =>
    apiFetch<CtplApplicationApi>(`/api/applications/ctpl/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};
export const toApiCtplPolicyType = (v: string) => CTPL_POLICY_TYPE_TO_API[v] ?? v;
export const fromApiCtplPolicyType = (v: string) => CTPL_POLICY_TYPE_FROM_API[v] ?? v;
export const toApiCtplRenewalType = (v: string) => CTPL_RENEWAL_TO_API[v] ?? v;
export const fromApiCtplRenewalType = (v: string) => CTPL_RENEWAL_FROM_API[v] ?? v;
export const toApiCtplClientType = (v: string) => CTPL_CLIENT_TYPE_TO_API[v] ?? v;
export const fromApiCtplClientType = (v: string) => CTPL_CLIENT_TYPE_FROM_API[v] ?? v;

export interface GtpApplicationApi {
  id: string;
  travelType: string;
  destinations: string[];
  departureDate: string;
  returnDate: string;
  daysOfTravel: number;
  applicationType: string;
  travelerFirstName: string;
  travelerSurname: string;
  birthdate: string;
  email: string;
  mobileNumber: string;
  planVariant: string;
  cruiseCoverage: boolean;
  hazardousSportsCoverage: boolean;
  isSchengenDestination: boolean;
  premium: string;
  dateReceived: string;
  status: string;
  screenedBy: string | null;
  isPaid: boolean;
  policyNumber: string | null;
  referenceNo: string | null;
}

const GTP_PLAN_VARIANT_TO_API: Record<string, string> = {
  'Single Trip': 'Single_Trip',
  'Multi-Trip 90': 'Multi_Trip_90',
  'Multi-Trip 180': 'Multi_Trip_180',
};
const GTP_PLAN_VARIANT_FROM_API: Record<string, string> = Object.fromEntries(Object.entries(GTP_PLAN_VARIANT_TO_API).map(([d, a]) => [a, d]));

export const gtpApi = {
  list: () => apiFetch<GtpApplicationApi[]>('/api/applications/gtp'),
  create: (payload: Omit<GtpApplicationApi, 'id' | 'policyNumber' | 'referenceNo'>) =>
    apiFetch<GtpApplicationApi>('/api/applications/gtp', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Omit<GtpApplicationApi, 'id'>>) =>
    apiFetch<GtpApplicationApi>(`/api/applications/gtp/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
};
export const toApiGtpPlanVariant = (v: string) => GTP_PLAN_VARIANT_TO_API[v] ?? v;
export const fromApiGtpPlanVariant = (v: string) => GTP_PLAN_VARIANT_FROM_API[v] ?? v;
