/**
 * Custom hook that encapsulates all job filtering, sorting, and search logic
 * used by the Dashboard page. Extracted to keep Dashboard focused on rendering.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import type { IJob } from '../types';
import { toDate } from '../utils/date';
import { normalizeWorkplace } from '../utils/job';

// ── Option constants ────────────────────────────────────────────

const EXPERIENCE_OPTIONS = ['Entry', 'Mid', 'Senior', 'Lead', 'Staff'];
const WORKPLACE_OPTIONS = ['Remote', 'Onsite', 'Hybrid'];

export const SORT_DROPDOWN_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'company', label: 'Company A-Z' },
];

export const DOMAIN_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Non-Technical', label: 'Non-Technical' },
];

export const EXPERIENCE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  ...EXPERIENCE_OPTIONS.map(o => ({ value: o, label: o })),
];

export const WORKPLACE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  ...WORKPLACE_OPTIONS.map(o => ({ value: o, label: o })),
];

export const DATE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All time' },
  { value: 'Today', label: 'Today' },
  { value: 'This Week', label: 'This week' },
  { value: 'This Month', label: 'This month' },
];

export const FILTER_CONTROL_STYLE: CSSProperties = {
  height: 34,
  fontSize: '0.76rem',
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 10px',
  outline: 'none',
};

// ── Types ───────────────────────────────────────────────────────

export type SortOption = 'newest' | 'company';
export type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';

export type FilterState = {
  domain: string;
  experience: string;
  workplace: string;
  date: DateFilter;
  sort: SortOption;
  search: string;
};

export const DEFAULT_FILTERS: FilterState = {
  domain: 'All',
  experience: 'All',
  workplace: 'All',
  date: 'All',
  sort: 'newest',
  search: '',
};

// ── Filter matching functions ───────────────────────────────────

function getEffectivePostedDate(job: IJob) {
  return toDate(job.PostedDate || job.scrapedAt);
}

function matchesDateFilter(job: IJob, filter: DateFilter) {
  if (filter === 'All') return true;

  const date = getEffectivePostedDate(job);
  if (!date) return false;

  const diffInDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (filter === 'Today') return diffInDays <= 1;
  if (filter === 'This Week') return diffInDays <= 7;
  if (filter === 'This Month') return diffInDays <= 30;
  return true;
}

function normalizeExperience(value?: string | null): string {
  if (!value) return 'N/A';
  const lower = value.trim().toLowerCase();
  if (lower === 'entry' || lower === 'junior' || lower === 'intern' || lower === 'entry level' || lower === 'entry-level') return 'Entry';
  if (lower === 'mid' || lower === 'mid-level' || lower === 'intermediate' || lower === 'regular') return 'Mid';
  if (lower === 'senior' || lower === 'sr' || lower === 'sr.' || lower === 'senior level') return 'Senior';
  if (lower === 'lead' || lower === 'principal' || lower === 'tech lead') return 'Lead';
  if (lower === 'staff' || lower === 'staff+' || lower === 'distinguished') return 'Staff';
  return 'N/A';
}

function deriveExperienceFromTitle(title?: string | null): string {
  const lower = String(title || '').toLowerCase();
  if (/\b(staff|distinguished)\b/.test(lower)) return 'Staff';
  if (/\b(lead|principal|tech lead)\b/.test(lower)) return 'Lead';
  if (/\b(senior|sr\.?)\b/.test(lower)) return 'Senior';
  if (/\b(junior|jr\.?|entry|associate|graduate)\b/.test(lower)) return 'Entry';
  return 'Mid';
}

function matchesExperienceFilter(job: IJob, selectedExperience: string) {
  if (selectedExperience === 'All') return true;

  const stored = normalizeExperience(job.ExperienceLevel).toLowerCase();
  const filterValue = selectedExperience.toLowerCase();

  if (stored === filterValue) return true;

  if (stored === 'n/a' || stored === '') {
    return deriveExperienceFromTitle(job.JobTitle).toLowerCase() === filterValue;
  }

  return false;
}

function matchesWorkplaceFilter(job: IJob, selectedWorkplace: string) {
  if (selectedWorkplace === 'All') return true;

  const stored = normalizeWorkplace(job.WorkplaceType).toLowerCase();
  const filterValue = selectedWorkplace.toLowerCase();

  if (stored === filterValue) return true;

  if (stored === 'unspecified' || stored === '') {
    const location = String(job.Location || '').toLowerCase();
    if (filterValue === 'remote') return location.includes('remote');
    if (filterValue === 'hybrid') return location.includes('hybrid');
    return false;
  }

  return false;
}

function sortJobs(jobs: IJob[], sort: SortOption) {
  const items = [...jobs];
  if (sort === 'company') {
    return items.sort((a, b) => a.Company.localeCompare(b.Company));
  }
  return items.sort((a, b) => {
    const bDate = toDate(b.PostedDate || b.scrapedAt)?.getTime() ?? 0;
    const aDate = toDate(a.PostedDate || a.scrapedAt)?.getTime() ?? 0;
    return bDate - aDate;
  });
}

// ── Hook ────────────────────────────────────────────────────────

export function useJobFilters(jobs: IJob[]) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filteredJobs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const filtered = jobs.filter(job => {
      if (filters.domain !== 'All' && (job.Domain || 'Unclear').toLowerCase() !== filters.domain.toLowerCase()) return false;
      if (!matchesExperienceFilter(job, filters.experience)) return false;
      if (!matchesWorkplaceFilter(job, filters.workplace)) return false;
      if (!matchesDateFilter(job, filters.date)) return false;

      if (!search) return true;
      return (
        job.JobTitle.toLowerCase().includes(search)
        || job.Company.toLowerCase().includes(search)
        || (job.Location || '').toLowerCase().includes(search)
      );
    });

    return sortJobs(filtered, filters.sort);
  }, [jobs, filters]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search.trim()
      || filters.domain !== 'All'
      || filters.experience !== 'All'
      || filters.workplace !== 'All'
      || filters.date !== 'All'
    );
  }, [filters]);

  const activeFilterCount = [filters.domain, filters.experience, filters.workplace, filters.date]
    .filter(v => v !== 'All').length + (filters.search.trim() ? 1 : 0);

  const clearFilters = () => {
    setFilters(previous => ({
      ...previous,
      domain: 'All',
      experience: 'All',
      workplace: 'All',
      date: 'All',
      search: '',
    }));
  };

  return {
    filters,
    setFilters,
    filteredJobs,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
  };
}
