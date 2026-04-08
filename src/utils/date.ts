/**
 * Shared date utilities used across multiple pages and components.
 */

/**
 * Safely parse a date string into a Date object.
 * Returns null if the value is falsy or the resulting Date is invalid.
 */
export function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date string into a human-readable relative label.
 * Examples: "Today", "1d ago", "3w ago", "2mo ago".
 */
export function relativeDate(value?: string | null): string {
  const date = toDate(value);
  if (!date) return 'Unknown';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

/**
 * Format a date string into a localized short date.
 * Example: "Jan 15, 2026". Returns "N/A" if the value is falsy or invalid.
 */
export function formatPostedDate(value?: string | null): string {
  const date = toDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
