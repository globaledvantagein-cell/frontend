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

export const PUBLIC_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/jobs',          'Browse Jobs'],
  ['/directory',     'Companies'],
  ['/career-guide',  'Career Guide'],
  ['/smart-match',   'Smart Match'],
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
 * catch-all, silently bouncing the user back to the homepage.
 */
const SSR_PATHS = new Set<string>(['/career-guide']);

export function isSsrPath(path: string): boolean {
  return SSR_PATHS.has(path);
}
