// Centralized fetch wrapper for ALL API calls.
//
// Why this exists:
//   - Every job-related request must carry the visitor fingerprint so the
//     backend can compute the composite anti-bypass identity.
//   - Authenticated requests need the Authorization header.
//   - The vid cookie is sent automatically by the browser, but we also
//     mirror it in a header for environments where credentialed CORS
//     doesn't deliver cookies cleanly.
//
// Use this for ANY call to the backend — never raw fetch().

import { getFingerprint } from './fingerprint';
import { getVisitorId } from './visitorId';

// Single source of truth — must match the key used by AuthContext.
export const STORAGE_KEY_TOKEN = 'ejg_token';
export const STORAGE_KEY_USER = 'ejg_user';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const headers: Record<string, string> = {
    'x-fingerprint': getFingerprint(),
    'x-vid': getVisitorId(),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

interface RequestOpts {
  signal?: AbortSignal;
  /** Skip auth/fingerprint headers entirely (for truly public endpoints) */
  noAuth?: boolean;
}

export async function apiGet<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = opts.noAuth ? {} : authHeaders();
  const res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
    headers,
    signal: opts.signal,
  });
  // 200 with `gated: true` is valid — caller decides what to do
  if (!res.ok && res.status !== 200) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body?: unknown, opts: RequestOpts = {}): Promise<T> {
  const headers = opts.noAuth
    ? { 'Content-Type': 'application/json' }
    : { ...authHeaders(), 'Content-Type': 'application/json' };
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

export async function apiPatch<T = any>(path: string, body?: unknown, opts: RequestOpts = {}): Promise<T> {
  const headers = opts.noAuth
    ? { 'Content-Type': 'application/json' }
    : { ...authHeaders(), 'Content-Type': 'application/json' };
  const res = await fetch(path, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

export async function apiDelete<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = opts.noAuth ? {} : authHeaders();
  const res = await fetch(path, {
    method: 'DELETE',
    credentials: 'include',
    headers,
    signal: opts.signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
  }
  return res.json();
}

/** Custom error type so callers can branch on status (e.g. 401 → redirect to /login). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Job-detail-specific shape — backend returns one of these two responses.
export type JobDetailResponse =
  | { gated: false; job: any }
  | { gated: true; teaser: any };

export async function fetchJobDetail(jobId: string, opts?: RequestOpts): Promise<JobDetailResponse> {
  return apiGet<JobDetailResponse>(`/api/jobs/${encodeURIComponent(jobId)}/full`, opts);
}
