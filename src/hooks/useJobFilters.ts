/**
 * Server-driven job filters hook.
 *
 * All filtering and sorting happens on the backend via MongoDB queries.
 * The hook manages:
 *   - filter state (UI updates instantly, search is debounced 400 ms)
 *   - fetching page 1 whenever committed filters change
 *   - appending subsequent pages via `loadMore()`
 *   - company dropdown options fetched once from /api/jobs/company-names
 *   - an `updateJob()` helper so callers can patch individual jobs in-memory
 *     (e.g. after an apply-click count update) without refetching
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { IJob } from '../types';

// ── Constants ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 400;

export const SORT_DROPDOWN_OPTIONS = [
  { value: 'newest',  label: 'Newest first' },
  { value: 'company', label: 'Company A-Z'  },
];

export const DATE_DROPDOWN_OPTIONS = [
  { value: 'All',        label: 'All time'   },
  { value: 'Today',      label: 'Today'      },
  { value: 'This Week',  label: 'This week'  },
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

// ── Types ────────────────────────────────────────────────────────────────────

export type SortOption = 'newest' | 'company';
export type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';

export type FilterState = {
  company: string[];
  date:    DateFilter;
  sort:    SortOption;
  search:  string;
};

export const DEFAULT_FILTERS: FilterState = {
  company: [],
  date:    'All',
  sort:    'newest',
  search:  '',
};

export interface FilterDropdownOption {
  value: string;
  label: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSearchParams(filters: FilterState, page: number): URLSearchParams {
  const p = new URLSearchParams();
  p.set('page',  String(page));
  p.set('limit', String(PAGE_SIZE));

  // Multi-value company param: ?company=Stripe&company=Shopify
  filters.company.forEach(c => p.append('company', c));

  if (filters.search.trim())     p.set('search', filters.search.trim());
  if (filters.date !== 'All')    p.set('date',   filters.date);
  if (filters.sort !== 'newest') p.set('sort',   filters.sort);

  return p;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useJobFilters(initialCompany?: string) {
  // ── UI filter state (updates immediately on every keystroke / click) ──────
  const [filters, setFiltersInternal] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    company: initialCompany ? [initialCompany] : [],
  }));

  // ── "Committed" filters — what actually drives API calls ──────────────────
  // Identical to `filters` except the search field is debounced 400 ms so we
  // don't fire a request on every keystroke.
  const [committedFilters, setCommittedFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    company: initialCompany ? [initialCompany] : [],
  }));

  // ── Server results ────────────────────────────────────────────────────────
  const [jobs,        setJobs]        = useState<IJob[]>([]);
  const [totalJobs,   setTotalJobs]   = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Company dropdown (fetched once) ───────────────────────────────────────
  const [companyOptions, setCompanyOptions] = useState<FilterDropdownOption[]>([
    { value: 'All', label: 'All' },
  ]);

  // ── Internal refs ─────────────────────────────────────────────────────────
  const abortRef       = useRef<AbortController | null>(null);
  const pageRef        = useRef(2);        // next page index for loadMore
  const loadingMoreRef = useRef(false);    // sync guard — prevents double-fires
  const committedRef   = useRef(committedFilters); // stable snapshot for loadMore closure
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep committedRef always current so loadMore never uses a stale filter set
  useEffect(() => {
    committedRef.current = committedFilters;
  }, [committedFilters]);

  // ── Fetch company names once on mount ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/jobs/company-names')
      .then(r => r.json())
      .then((names: unknown) => {
        if (!Array.isArray(names)) return;
        setCompanyOptions([
          { value: 'All', label: 'All' },
          ...(names as string[]).map(n => ({ value: n, label: n })),
        ]);
      })
      .catch(() => {}); // non-critical — filter still works without options
  }, []);

  // ── Fetch page 1 on every committedFilters change ─────────────────────────
  useEffect(() => {
    // Abort any in-flight request from the previous filter state so we never
    // mix results from two different filter configurations.
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setJobs([]);       // clear stale results immediately
    pageRef.current = 2;

    const params = buildSearchParams(committedFilters, 1);

    fetch(`/api/jobs?${params}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (ctrl.signal.aborted) return;
        const batch: IJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
        const total: number = Number(data?.totalJobs) || 0;
        setJobs(batch);
        setTotalJobs(total);
        // Has more if the server still has jobs we haven't loaded yet
        setHasMore(batch.length === PAGE_SIZE && batch.length < total);
      })
      .catch(err => {
        if (err?.name !== 'AbortError') console.error('[useJobFilters] fetch error:', err);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [committedFilters]);

  // ── Load next page and append ─────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    // loadingMoreRef is a synchronous guard — prevents duplicate calls that
    // can fire when the IntersectionObserver triggers twice in rapid succession.
    if (loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const page   = pageRef.current;
    const params = buildSearchParams(committedRef.current, page);

    try {
      const res  = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      const batch: IJob[] = Array.isArray(data?.jobs) ? data.jobs : [];
      const total: number = Number(data?.totalJobs) || 0;

      setJobs(prev => {
        const next = [...prev, ...batch];
        // Recalculate hasMore inside the state updater so we always use the
        // latest jobs count rather than the stale closure value.
        setHasMore(next.length < total);
        return next;
      });
      setTotalJobs(total);
      pageRef.current = page + 1;
    } catch (err) {
      console.error('[useJobFilters] loadMore error:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore]); // intentionally minimal — everything else goes through refs

  // ── Public setFilters ─────────────────────────────────────────────────────
  // Search changes are debounced so we don't hammer the API while typing.
  // All other changes (dropdown, sort) commit immediately.
  const setFilters = useCallback(
    (updater: FilterState | ((prev: FilterState) => FilterState)) => {
      setFiltersInternal(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;

        const searchChanged = next.search !== prev.search;

        // Always cancel any pending timer first — ensures the latest full
        // filter state is what gets committed, not a snapshot from mid-typing.
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        if (searchChanged) {
          searchTimerRef.current = setTimeout(
            () => setCommittedFilters(next),
            SEARCH_DEBOUNCE_MS,
          );
        } else {
          setCommittedFilters(next);
        }

        return next;
      });
    },
    [],
  );

  // ── Clear active filters (keeps sort preference) ──────────────────────────
  const clearFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, company: [], date: 'All', search: '' }));
  }, [setFilters]);

  // ── Patch a single job in-memory ─────────────────────────────────────────
  // Used after apply-click tracking so the count updates without a full refetch.
  const updateJob = useCallback((jobId: string, updates: Partial<IJob>) => {
    setJobs(prev =>
      prev.map(job => (job._id === jobId ? { ...job, ...updates } : job)),
    );
  }, []);

  // ── Derived booleans ──────────────────────────────────────────────────────
  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== '' ||
      filters.company.length > 0    ||
      filters.date !== 'All',
    [filters],
  );

  const activeFilterCount = useMemo(
    () =>
      (filters.search.trim()      ? 1 : 0) +
      (filters.company.length > 0 ? 1 : 0) +
      (filters.date !== 'All'     ? 1 : 0),
    [filters],
  );

  return {
    // Filter state (drives the UI immediately)
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    // Server results
    jobs,
    totalJobs,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    // Helpers
    updateJob,
    companyOptions,
  };
}