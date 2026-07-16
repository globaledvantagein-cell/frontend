export const ADMIN_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/dashboard',          'Dashboard'],
  ['/review',             'Review'],
  ['/test-logs',          'Test Logs'],
  ['/admin/companies',    'Directory'],
  ['/admin/career-guide', 'Career Guide'],
  ['/add',                'Add Job'],
  ['/rejected',           'Trash'],
  ['/feedback',           'Feedback'],
  ['/smart-match',        'Smart Match'],
  ['/today-matches',      "Today's Matches"],
];

// Smart Match is admin-only while in testing — it lives in ADMIN_LINKS only,
// and its route in App.tsx is behind the admin ProtectedRoute.
export const PUBLIC_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/jobs',          'Browse Jobs'],
  ['/directory',     'Companies'],
  ['/career-guide',  'Career Guide'],
  ['/today-matches', "Today's Matches"],
];

// Links shown only inside the signed-in user menu (not the main nav).
export const USER_MENU_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/profile', 'Profile'],
  ['/applied', 'Applied'],
];

/**
 * Paths served as server-rendered HTML by Express, NOT React routes.
 *
 * These MUST render as a plain <a> so the browser does a full page load.
 * A react-router <Link> would match no route and hit App.tsx's `path="*"`
 * catch-all, silently bouncing the user back to the homepage — which is the
 * exact "Career Guide goes to homepage" symptom.
 *
 * Matches exact paths AND the /city/* and /category/* SEO route families, so
 * ANY server-rendered link routed through this helper renders as a full-page
 * <a>, never a client-side <Link>.
 *
 * NOTE: in local dev (Vite) and in prod without the nginx proxy rules for
 * /career-guide, /city, /category, these paths fall through to the SPA and
 * still bounce to home — that is a server-config gap, not a frontend bug.
 */
const SSR_EXACT_PATHS = new Set<string>(['/career-guide']);
const SSR_PATH_PREFIXES = ['/career-guide/', '/city/', '/category/'];

export function isSsrPath(path: string): boolean {
  if (SSR_EXACT_PATHS.has(path)) return true;
  return SSR_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}
