// Typed API client for the Paramount Direct backend.
// In dev, Vite proxies "/api" -> http://localhost:8000 (see vite.config.ts).

const TOKEN_KEY = 'pd_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail ?? detail;
    } catch {
      // non-JSON error body, keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- Auth ----

export interface Token {
  access_token: string;
  token_type: string;
}

export type UserRole = 'admin' | 'reviewer' | 'agent';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export async function login(email: string, password: string): Promise<Token> {
  // Backend uses OAuth2 password flow: form-encoded, `username` = email.
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    let detail = 'Login failed';
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  const token: Token = await res.json();
  setToken(token.access_token);
  return token;
}

export function me(): Promise<User> {
  return request<User>('/auth/me');
}

// ---- Applications ----

export type ApplicationStatus =
  | 'inquiry'
  | 'screening'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type ProductType = 'health' | 'life_accident' | 'comprehensive';

export type AcquisitionSource =
  | 'ml'
  | 'email'
  | 'non_life'
  | 'google'
  | 'facebook'
  | 'direct';

export interface Application {
  id: number;
  reference_no: string;
  applicant_name: string;
  applicant_email: string;
  product_type: ProductType;
  status: ApplicationStatus;
  source: AcquisitionSource;
  premium: number;
  created_at: string;
}

export function listApplications(params?: {
  status?: ApplicationStatus;
  limit?: number;
  offset?: number;
}): Promise<Application[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.offset != null) q.set('offset', String(params.offset));
  const qs = q.toString();
  return request<Application[]>(`/applications${qs ? `?${qs}` : ''}`);
}

export function getApplication(id: number): Promise<Application> {
  return request<Application>(`/applications/${id}`);
}

// ---- Dashboard ----

export interface AcquisitionSlice {
  source: AcquisitionSource;
  label: string;
  count: number;
}

export interface DashboardSummary {
  total_applications: number;
  total_premium: number;
  acquisition: AcquisitionSlice[];
}

export function dashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/dashboard/summary');
}
