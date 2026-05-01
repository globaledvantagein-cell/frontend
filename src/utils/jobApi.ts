// Centralized fetch wrapper for the jobs API.
//
// Why this exists:
//   - Every job-related request must carry the visitor fingerprint so the
//     backend can compute the composite anti-bypass identity.
//   - Authenticated requests need the Authorization header.
//   - The vid cookie is sent automatically by the browser, but we also
//     mirror it in a header for environments where credentialed CORS
//     doesn't deliver cookies cleanly.
//
// Use this for ANY call to /api/jobs/* — never raw fetch().

import { getFingerprint } from './fingerprint';
import { getVisitorId } from './visitorId';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'x-fingerprint': getFingerprint(),
    'x-vid': getVisitorId(),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
    headers: authHeaders(),
  });
  // Don't throw on 200 with a `gated: true` body — the caller decides.
  if (!res.ok && res.status !== 200) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Job-detail-specific shape — backend returns one of these two responses.
export type JobDetailResponse =
  | { gated: false; job: any }
  | { gated: true; teaser: any };

export async function fetchJobDetail(jobId: string): Promise<JobDetailResponse> {
  return apiGet<JobDetailResponse>(`/api/jobs/${encodeURIComponent(jobId)}/full`);
}
