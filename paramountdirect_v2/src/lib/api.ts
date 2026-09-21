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
