/**
 * Custom hook that encapsulates all job filtering, sorting, and search logic
 * used by the Dashboard page. Extracted to keep Dashboard focused on rendering.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import type { IJob } from '../types';
import { toDate } from '../utils/date';

// ── Option constants ────────────────────────────────────────────



export const SORT_DROPDOWN_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'company', label: 'Company A-Z' },
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
  company:string,
  date: DateFilter;
  sort: SortOption;
  search: string;
};

export const DEFAULT_FILTERS: FilterState = {
  company:"All",
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
      if(filters.company!=="All" && job.Company != filters.company  ) return false;
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

  const companyOptions = useMemo(()=>{
    const names=[...new Set(jobs.map(j=>j.Company).filter(Boolean))].sort();
    return [
      {value:"All",label:"All"},
      ...names.map(name=>({value:name,label:name})),
    ];
  },[jobs])

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search.trim()
      || filters.company !="All"
      || filters.date !== 'All'
    );
  }, [filters]);

  const activeFilterCount = [ filters.date]
    .filter(v => v !== 'All').length + (filters.search.trim() ? 1 : 0);

  const clearFilters = () => {
    setFilters(previous => ({
      ...previous,
      company:"All",
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
    companyOptions,
  };
}
