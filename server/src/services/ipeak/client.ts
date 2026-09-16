// Low-level HTTP client for Paramount's "LEAP Services" API (iPeak / AS400).
// See the LEAP Services System Documentation, section I (Accessing the
// Service) for the URL format.
//
// Note on auth: the doc describes an Authentication-Hash computed as
// hex(SHA256(privateKey + lowercased request path/query)), but that does
// NOT match the real UAT server as of this writing - verified directly
// against http://ws.paramount.com.ph/test/workflowservice.svc/afpp, which
// returns 401 for the computed hash but authenticates fine when the raw
// private key is sent as-is. This matches what the legacy PD system's own
// LifeMbNewBusinessService actually does. Sending the raw key is what's
// implemented below; revisit if a future environment enforces the documented
// hash instead.
import type { ServiceResponse } from './types';

// IPEAK_SERVICE_URL is expected to already include the Service URL + Public
// Application Key prefix (both are constant per registered application per
// the doc) - only the web-method path (e.g. "/lifemb/newbusiness") varies
// per call and gets appended here.
const BASE_URL = process.env.IPEAK_SERVICE_URL;
const PRIVATE_KEY = process.env.IPEAK_PRIVATE_KEY;

export interface IpeakCallResult<T> {
  ok: boolean;
  httpStatus: number;
  response: ServiceResponse<T> | null;
  rawBody: string;
  error?: string;
}

export function ipeakConfigured(): boolean {
  return Boolean(BASE_URL && PRIVATE_KEY);
}

export async function callIpeak<T>(webMethodPath: string, body: unknown): Promise<IpeakCallResult<T>> {
  if (!BASE_URL || !PRIVATE_KEY) {
    return {
      ok: false,
      httpStatus: 0,
      response: null,
      rawBody: '',
      error: 'IPEAK_SERVICE_URL / IPEAK_PRIVATE_KEY is not configured',
    };
  }

  const url = new URL(BASE_URL.replace(/\/+$/, '') + webMethodPath);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Hash': PRIVATE_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

    const rawBody = await res.text();
    let response: ServiceResponse<T> | null = null;
    try {
      response = JSON.parse(rawBody) as ServiceResponse<T>;
    } catch {
      // Non-JSON reply (e.g. an upstream gateway error page) - leave
      // response null, callers fall back to rawBody/httpStatus.
    }

    return {
      ok: res.ok && (response ? response.StatusCode >= 200 && response.StatusCode < 300 : false),
      httpStatus: res.status,
      response,
      rawBody,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      response: null,
      rawBody: '',
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  }
}
