/**
 * Shared job-data utilities used across multiple pages and components.
 */
import type { IJob } from '../types';

/**
 * Check if a string value is non-empty and not "N/A".
 */
export function isMeaningful(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return Boolean(normalized) && normalized.toLowerCase() !== 'n/a';
}

/**
 * Merge Location field (semicolon-separated) and AllLocations array
 * into a single de-duplicated array of location strings.
 */
export function parseAllLocations(job: IJob): string[] {
  const fromLocationField = String(job.Location || '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean);

  const fromAllLocations = (job.AllLocations || [])
    .map(value => String(value).trim())
    .filter(Boolean);

  return [...new Set([...fromLocationField, ...fromAllLocations])];
}

/**
 * Pick the first available location from a parsed locations array,
 * falling back to the raw Location field or a default.
 */
export function getPrimaryLocation(job: IJob, locations: string[]): string {
  if (locations.length > 0) return locations[0];
  return job.Location || 'N/A';
}

/**
 * Normalize a workplace-type string into one of: Remote, Hybrid, Onsite, Unspecified.
 */
export function normalizeWorkplace(value?: string | null): string {
  if (!value) return 'Unspecified';
  const lower = value.trim().toLowerCase();
  if (lower === 'remote' || lower === 'fully remote' || lower === 'work from home' || lower === 'telecommute') return 'Remote';
  if (lower === 'onsite' || lower === 'on-site' || lower === 'in-office' || lower === 'office') return 'Onsite';
  if (lower === 'hybrid' || lower === 'flex' || lower === 'flexible') return 'Hybrid';
  return 'Unspecified';
}

/**
 * Normalize a salary value that may need scaling.
 * E.g., 125 on a yearly interval becomes 125000.
 */
export function normalizeSalary(value: number | null, interval: string | null): number | null {
  if (value == null || value <= 0) return null;

  const normalizedInterval = String(interval || '').toLowerCase();
  const isAnnual = !normalizedInterval || normalizedInterval === 'per-year-salary' || normalizedInterval === 'yearly';
  if (isAnnual && value > 0 && value < 1000) return value * 1000;

  const isMonthly = normalizedInterval === 'per-month-salary' || normalizedInterval === 'monthly';
  if (isMonthly && value > 0 && value < 100) return value * 1000;

  return value;
}

/**
 * Format a salary range into a compact label like "€50K-80K".
 * Uses normalizeSalary internally when SalaryInterval is available.
 */
export function compactSalary(job: IJob): string | null {
  const min = normalizeSalary(job.SalaryMin ?? null, job.SalaryInterval ?? null);
  const max = normalizeSalary(job.SalaryMax ?? null, job.SalaryInterval ?? null);
  if (min == null && max == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : '';
  const formattedMin = min != null && min > 0 ? `${Math.round(min / 1000)}K` : null;
  const formattedMax = max != null && max > 0 ? `${Math.round(max / 1000)}K` : null;

  if (formattedMin && formattedMax) return `${symbol}${formattedMin}-${formattedMax}`;
  if (formattedMin) return `${symbol}${formattedMin}+`;
  if (formattedMax) return `${symbol}${formattedMax}`;
  return null;
}

/**
 * Format a salary range into a detailed label like "€50,000 - €80,000 / year".
 * Uses normalizeSalary internally when SalaryInterval is available.
 */
export function detailedSalary(job: IJob): string | null {
  const min = normalizeSalary(job.SalaryMin ?? null, job.SalaryInterval ?? null);
  const max = normalizeSalary(job.SalaryMax ?? null, job.SalaryInterval ?? null);
  if (min == null && max == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? `${job.SalaryCurrency} ` : '');
  const interval = job.SalaryInterval === 'per-year-salary'
    ? '/ year'
    : job.SalaryInterval === 'per-month-salary'
      ? '/ month'
      : job.SalaryInterval === 'per-hour-wage'
        ? '/ hour'
        : '/ year';

  const formatter = new Intl.NumberFormat('en-US');
  const formattedMin = min != null && min > 0 ? formatter.format(min) : null;
  const formattedMax = max != null && max > 0 ? formatter.format(max) : null;

  if (formattedMin && formattedMax) return `${symbol}${formattedMin} - ${symbol}${formattedMax} ${interval}`;
  if (formattedMin) return `${symbol}${formattedMin}+ ${interval}`;
  if (formattedMax) return `${symbol}${formattedMax} ${interval}`;
  return null;
}
