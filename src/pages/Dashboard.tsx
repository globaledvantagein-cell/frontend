import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ExternalLink, MapPin, Search, SlidersHorizontal, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import type { IJob } from '../types';
import FormattedDescription from '../components/FormattedDescription';
import { getVisitorId } from '../components/JobCard';
import { Badge, Button, Container, EmptyState, Input } from '../components/ui';
import FilterDropdown from '../components/FilterDropdown';
import { BRAND } from '../theme/brand';
import { useMediaQuery } from '../hooks/useMediaQuery';

const EXPERIENCE_OPTIONS = ['Entry', 'Mid', 'Senior', 'Lead', 'Staff'];
const WORKPLACE_OPTIONS = ['Remote', 'Onsite', 'Hybrid'];
const BOARD_OPTIONS = [
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'ashby', label: 'Ashby' },
  { value: 'lever', label: 'Lever' },
];

const SORT_DROPDOWN_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'company', label: 'Company A-Z' },
];

const DOMAIN_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Non-Technical', label: 'Non-Technical' },
];

const EXPERIENCE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  ...EXPERIENCE_OPTIONS.map(o => ({ value: o, label: o })),
];

const WORKPLACE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  ...WORKPLACE_OPTIONS.map(o => ({ value: o, label: o })),
];

const DATE_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All time' },
  { value: 'Today', label: 'Today' },
  { value: 'This Week', label: 'This week' },
  { value: 'This Month', label: 'This month' },
];

const BOARD_DROPDOWN_OPTIONS = [
  { value: 'All', label: 'All' },
  ...BOARD_OPTIONS.map(o => ({ value: o.value, label: o.label })),
];

type SortOption = 'newest' | 'company';
type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';

type FilterState = {
  domain: string;
  experience: string;
  workplace: string;
  date: DateFilter;
  board: string;
  company: string;
  sort: SortOption;
  search: string;
};

function toDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPostedDate(value?: string | null) {
  const date = toDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeDate(value?: string | null) {
  const date = toDate(value);
  if (!date) return 'Unknown';
  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function compactSalary(job: IJob) {
  if (job.SalaryMin == null && job.SalaryMax == null) return null;
  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : '';
  const min = job.SalaryMin != null ? `${Math.round(job.SalaryMin / 1000)}K` : null;
  const max = job.SalaryMax != null ? `${Math.round(job.SalaryMax / 1000)}K` : null;
  if (min && max) return `${symbol}${min}-${max}`;
  if (min) return `${symbol}${min}+`;
  if (max) return `${symbol}${max}`;
  return null;
}

function detailedSalary(job: IJob) {
  if (job.SalaryMin == null && job.SalaryMax == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? `${job.SalaryCurrency} ` : '');
  const interval = job.SalaryInterval === 'per-year-salary'
    ? '/ year'
    : job.SalaryInterval === 'per-month-salary'
      ? '/ month'
      : job.SalaryInterval === 'per-hour-wage'
        ? '/ hour'
        : '';

  const formatter = new Intl.NumberFormat('en-US');
  const min = job.SalaryMin != null ? formatter.format(job.SalaryMin) : null;
  const max = job.SalaryMax != null ? formatter.format(job.SalaryMax) : null;

  if (min && max) return `${symbol}${min} - ${symbol}${max}${interval}`;
  if (min) return `${symbol}${min}+${interval}`;
  if (max) return `${symbol}${max}${interval}`;
  return null;
}

function isMeaningful(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim();
  return Boolean(normalized) && normalized.toLowerCase() !== 'n/a';
}

function isCleanDepartment(value?: string | null) {
  if (!isMeaningful(value)) return false;
  const normalized = String(value).trim();
  if (normalized.length > 30) return false;
  if (/\d/.test(normalized)) return false;
  return true;
}

function parseAllLocations(job: IJob) {
  const fromLocationField = String(job.Location || '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean);

  const fromAllLocations = (job.AllLocations || [])
    .map(value => String(value).trim())
    .filter(Boolean);

  return [...new Set([...fromLocationField, ...fromAllLocations])];
}

function getPrimaryLocation(job: IJob, locations: string[]) {
  if (locations.length > 0) return locations[0];
  return job.Location || 'N/A';
}

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

function normalizeBoard(value?: string | null) {
  return String(value || '').trim().toLowerCase();
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

const FILTER_CONTROL_STYLE: CSSProperties = {
  height: 36,
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 10px',
  outline: 'none',
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight, setSplitHeight] = useState<number | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const heroRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const splitViewRef = useRef<HTMLDivElement | null>(null);
  const savedScrollRef = useRef(0);
  const [filters, setFilters] = useState<FilterState>({
    domain: 'All',
    experience: 'All',
    workplace: 'All',
    date: 'All',
    board: 'All',
    company: 'All',
    sort: 'newest',
    search: '',
  });

  useEffect(() => {
    document.title = `${BRAND.appName} Jobs`;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/jobs?limit=500');
        const payload = await response.json();
        setJobs(Array.isArray(payload?.jobs) ? payload.jobs : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const companyOptions = useMemo(() => {
    return [...new Set(jobs.map(job => job.Company).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const companyDropdownOptions = useMemo(() => [
    { value: 'All', label: 'All companies' },
    ...companyOptions.map(c => ({ value: c, label: c })),
  ], [companyOptions]);

  const filteredJobs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    const filtered = jobs.filter(job => {
      if (filters.domain !== 'All' && (job.Domain || 'Unclear') !== filters.domain) return false;
      if (filters.experience !== 'All' && (job.ExperienceLevel || 'N/A') !== filters.experience) return false;
      if (filters.workplace !== 'All' && (job.WorkplaceType || 'Unspecified') !== filters.workplace) return false;
      if (!matchesDateFilter(job, filters.date)) return false;
      if (filters.board !== 'All' && normalizeBoard(job.ATSPlatform) !== filters.board) return false;
      if (filters.company !== 'All' && job.Company !== filters.company) return false;

      if (!search) return true;
      return job.JobTitle.toLowerCase().includes(search) || job.Company.toLowerCase().includes(search);
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
      || filters.board !== 'All'
      || filters.company !== 'All'
      || filters.sort !== 'newest'
    );
  }, [filters]);

  const activeFilterCount = [filters.domain, filters.experience, filters.workplace, filters.date, filters.board, filters.company]
    .filter(v => v !== 'All').length + (filters.search.trim() ? 1 : 0);

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
      return;
    }

    const exists = filteredJobs.some(job => job._id === selectedJobId);
    if (!exists && selectedJobId) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
      return;
    }

    if (!hasInitializedSelection && !selectedJobId && filteredJobs.length > 0) {
      setSelectedJobId(filteredJobs[0]._id);
      setHasInitializedSelection(true);
    }
  }, [filteredJobs, selectedJobId, hasInitializedSelection]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return filteredJobs.find(job => job._id === selectedJobId) || null;
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    const updateSplitHeight = () => {
      if (window.innerWidth < 768 || !splitViewRef.current) {
        setSplitHeight(null);
        return;
      }

      const top = splitViewRef.current.getBoundingClientRect().top;
      const nextHeight = Math.max(window.innerHeight - top - 16, 320);
      setSplitHeight(nextHeight);
    };

    const observer = new ResizeObserver(() => updateSplitHeight());
    const observedNodes = [heroRef.current, filtersRef.current, splitViewRef.current].filter(Boolean) as Element[];

    observedNodes.forEach(node => observer.observe(node));
    window.addEventListener('resize', updateSplitHeight);
    updateSplitHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSplitHeight);
    };
  }, [loading, filteredJobs.length]);

  // Close filter sheet when viewport grows past mobile
  useEffect(() => {
    if (!isMobile) setFilterSheetOpen(false);
  }, [isMobile]);

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  const clearFilters = () => {
    setFilters({
      domain: 'All',
      experience: 'All',
      workplace: 'All',
      date: 'All',
      board: 'All',
      company: 'All',
      sort: 'newest',
      search: '',
    });
  };

  const vote = async (jobId: string, status: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, visitorId: getVisitorId() })
      });

      const payload = await response.json();
      if (!response.ok) return;

      setJobs(previous => previous.map(job => {
        if (job._id !== jobId) return job;
        return {
          ...job,
          thumbsUp: payload.thumbsUp ?? job.thumbsUp,
          thumbsDown: payload.thumbsDown ?? job.thumbsDown,
          userVote: payload.userVote ?? null,
        };
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const renderSortSelect = (width: number | string) => (
    <FilterDropdown
      id="sort"
      label="Sort"
      value={filters.sort}
      options={SORT_DROPDOWN_OPTIONS}
      onChange={val => setFilters(previous => ({ ...previous, sort: val as SortOption }))}
      openId={openDropdown}
      onOpenChange={setOpenDropdown}
      active={filters.sort !== 'newest'}
      width={width}
    />
  );

  const renderFilterSelects = (widthOverride?: number | string) => (
    <>
      <FilterDropdown
        id="domain"
        label="Domain"
        value={filters.domain}
        options={DOMAIN_DROPDOWN_OPTIONS}
        onChange={val => setFilters(previous => ({ ...previous, domain: val }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.domain !== 'All'}
        width={widthOverride ?? 120}
      />
      <FilterDropdown
        id="experience"
        label="Experience"
        value={filters.experience}
        options={EXPERIENCE_DROPDOWN_OPTIONS}
        onChange={val => setFilters(previous => ({ ...previous, experience: val }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.experience !== 'All'}
        width={widthOverride ?? 110}
      />
      <FilterDropdown
        id="workplace"
        label="Workplace"
        value={filters.workplace}
        options={WORKPLACE_DROPDOWN_OPTIONS}
        onChange={val => setFilters(previous => ({ ...previous, workplace: val }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.workplace !== 'All'}
        width={widthOverride ?? 120}
      />
      <FilterDropdown
        id="date"
        label="Date"
        value={filters.date}
        options={DATE_DROPDOWN_OPTIONS}
        onChange={val => setFilters(previous => ({ ...previous, date: val as DateFilter }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.date !== 'All'}
        width={widthOverride ?? 110}
      />
      <FilterDropdown
        id="board"
        label="Board"
        value={filters.board}
        options={BOARD_DROPDOWN_OPTIONS}
        onChange={val => setFilters(previous => ({ ...previous, board: val }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.board !== 'All'}
        width={widthOverride ?? 110}
      />
      <FilterDropdown
        id="company"
        label="Companies"
        value={filters.company}
        options={companyDropdownOptions}
        onChange={val => setFilters(previous => ({ ...previous, company: val }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.company !== 'All'}
        width={widthOverride ?? 150}
        searchable
      />
    </>
  );

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={heroRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0', flexShrink: 0 }}>
        <Container>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            {BRAND.appName}
          </p>
          <h1 style={{ fontSize: 'clamp(1.45rem, 3.8vw, 2rem)', fontFamily: "'Playfair Display',serif", color: 'var(--text-primary)' }}>
            Browse English-Speaking Roles
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {filteredJobs.length} of {jobs.length} roles available
          </p>
        </Container>
      </div>

      <Container style={{ padding: '20px 24px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div ref={filtersRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 14, flexShrink: 0 }}>
          {/* Mobile filter bar: search + filter pill button */}
          <div className="filter-bar-mobile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="relative" style={{ flex: 1, minWidth: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <Input
                  value={filters.search}
                  onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                  placeholder="Search jobs..."
                  style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
                />
              </div>
              <button
                onClick={() => setFilterSheetOpen(true)}
                style={{
                  height: 36, paddingInline: 14, borderRadius: 8, border: '1px solid',
                  borderColor: activeFilterCount > 0 ? 'var(--acid)' : 'var(--border)',
                  background: activeFilterCount > 0 ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                  color: activeFilterCount > 0 ? 'var(--acid)' : 'var(--text-secondary)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                }}
              >
                <SlidersHorizontal size={13} />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
          </div>

          {/* Tablet filter bar: two rows */}
          <div className="filter-bar-tablet">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="relative" style={{ flex: 1, minWidth: 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <Input
                    value={filters.search}
                    onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                    placeholder="Search jobs..."
                    style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
                  />
                </div>
                {renderSortSelect(150)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {renderFilterSelects()}
                {hasActiveFilters && (
                  <button onClick={clearFilters} style={{ marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop filter bar: one row */}
          <div className="filter-bar-full">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="relative" style={{ width: 200, minWidth: 180, flexShrink: 0 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <Input
                  value={filters.search}
                  onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                  placeholder="Search jobs..."
                  style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
                />
              </div>
              {renderSortSelect(150)}
              {renderFilterSelects()}
              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile filter bottom sheet */}
        {filterSheetOpen && isMobile && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
            <div
              onClick={() => setFilterSheetOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0',
              padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
              maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Filters</span>
                <button onClick={() => setFilterSheetOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Sort by</div>
                {renderSortSelect('100%')}
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, marginBottom: 2 }}>Filter by</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {renderFilterSelects('100%')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {hasActiveFilters && (
                  <button
                    onClick={() => { clearFilters(); setFilterSheetOpen(false); }}
                    style={{ flex: 1, height: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setFilterSheetOpen(false)}
                  style={{ flex: 2, height: 46, borderRadius: 10, border: 'none', background: 'var(--acid)', color: '#000', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Show {filteredJobs.length} results
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(index => <div key={index} className="skeleton" style={{ height: 132 }} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState title="No jobs found" body="Try adjusting your filters or search query." />
        ) : (
          <>
            {/* Desktop/Tablet split view — controlled via .split-grid CSS class */}
            <div
              ref={splitViewRef}
              className="split-grid"
              style={{
                gap: 14,
                flex: 1,
                minHeight: 0,
                height: desktopSplitHeight,
              }}
            >
              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                <div className="flex flex-col" style={{ gap: 8, padding: 12 }}>
                  {filteredJobs.map(job => {
                    const selected = selectedJobId === job._id;
                    const salary = compactSalary(job);

                    return (
                      <button
                        key={job._id}
                        onClick={() => setSelectedJobId(job._id)}
                        style={{
                          border: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
                          background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                          borderRadius: 10,
                          padding: 12,
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {job.JobTitle}
                        </p>
                        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.Company} | {getPrimaryLocation(job, parseAllLocations(job))}
                        </p>
                        <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 4 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>

                        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
                          {isCleanDepartment(job.Department) && <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{job.Department}</Badge>}
                          {isMeaningful(job.WorkplaceType) && job.WorkplaceType !== 'Unspecified' && <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{job.WorkplaceType}</Badge>}
                          {isMeaningful(job.EmploymentType) && <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{job.EmploymentType}</Badge>}
                          {salary && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{salary}</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 16, minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                {!selectedJob
                  ? <EmptyState title="Select a job from the list to view details" body="Pick any role on the left panel." />
                  : <PublicJobDetail job={selectedJob} onVote={vote} />}
              </section>
            </div>

            {/* Mobile-only job list */}
            <div className="mobile-list-only flex flex-col gap-2">
              {filteredJobs.map(job => (
                <button
                  key={job._id}
                  onClick={() => {
                    setSelectedJobId(job._id);
                    savedScrollRef.current = window.scrollY;
                    setMobileDetailOpen(true);
                  }}
                  style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-surface)', padding: '14px 12px', textAlign: 'left', width: '100%' }}
                >
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{job.JobTitle}</p>
                  <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{job.Company} · {getPrimaryLocation(job, parseAllLocations(job))}</p>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 3 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>
                </button>
              ))}
            </div>

            {/* Mobile detail overlay */}
            {mobileDetailOpen && selectedJob && (
              <div className="mobile-detail-overlay">
                <div className="mobile-detail-header">
                  <button
                    onClick={() => {
                      setMobileDetailOpen(false);
                      requestAnimationFrame(() => window.scrollTo(0, savedScrollRef.current));
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', padding: '4px 0' }}
                  >
                    <ArrowLeft size={16} /> Back to results
                  </button>
                </div>
                <div className="mobile-detail-body">
                  <PublicJobDetail job={selectedJob} onVote={vote} />
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

function PublicJobDetail({ job, onVote }: { job: IJob; onVote: (jobId: string, status: 'up' | 'down') => void }) {
  const [showAllLocations, setShowAllLocations] = useState(false);

  const allLocations = parseAllLocations(job);
  const primaryLocation = getPrimaryLocation(job, allLocations);
  const extraLocations = allLocations.slice(1);
  const salary = detailedSalary(job);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 16 }}>
        <span style={{ position: 'absolute', right: 14, top: 14, fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {job.ATSPlatform || 'unknown'}
        </span>

        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.2rem,2.6vw,1.55rem)', color: 'var(--text-primary)', marginBottom: 10, paddingRight: 80 }}>
          {job.JobTitle}
        </h2>

        <div className="flex items-center flex-wrap gap-2" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{job.Company}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {primaryLocation}
          </span>
          {isMeaningful(job.WorkplaceType) && job.WorkplaceType !== 'Unspecified' && <Badge variant="blue" style={{ fontSize: '0.7rem' }}>{job.WorkplaceType}</Badge>}
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Posted: {formatPostedDate(job.PostedDate)}</span>
        </div>

        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          {isCleanDepartment(job.Department) && <Badge variant="neutral">{job.Department}</Badge>}
          {(job.Domain === 'Technical' || job.Domain === 'Non-Technical') && <Badge variant={job.Domain === 'Technical' ? 'green' : 'neutral'}>{job.Domain}</Badge>}
          {isMeaningful(job.ExperienceLevel) && job.ExperienceLevel !== 'N/A' && <Badge variant="neutral">{job.ExperienceLevel}</Badge>}
          {isMeaningful(job.EmploymentType) && <Badge variant="neutral">{job.EmploymentType}</Badge>}
        </div>

        {salary && (
          <p style={{ marginBottom: 8, fontSize: '0.96rem', fontWeight: 700, color: 'var(--success)' }}>
            {salary}
          </p>
        )}

        {extraLocations.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowAllLocations(previous => !previous)}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {showAllLocations ? 'Hide locations' : `${extraLocations.length + 1} locations`}
            </button>
            {showAllLocations && (
              <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
                {allLocations.map(location => (
                  <Badge key={location} variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{location}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginTop: 10 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <a href={job.ApplicationURL} target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                Apply Now <ExternalLink size={12} />
              </Button>
            </a>
            {job.GermanRequired === false && <Badge variant="acid">🇬🇧 English Only</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(job._id, 'up')}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: job.userVote === 'up' ? 'var(--success-dim)' : 'transparent',
                color: job.userVote === 'up' ? 'var(--success)' : 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ThumbsUp size={14} />
            </button>

            <button
              onClick={() => onVote(job._id, 'down')}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: job.userVote === 'down' ? 'var(--danger-dim)' : 'transparent',
                color: job.userVote === 'down' ? 'var(--danger)' : 'var(--text-muted)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ThumbsDown size={14} />
            </button>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              👍 {job.thumbsUp || 0} · 👎 {job.thumbsDown || 0}
            </span>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 14 }}>
        <FormattedDescription description={job.Description || ''} />
      </div>

      <div className="flex justify-start">
        <a href={job.ApplicationURL} target="_blank" rel="noopener noreferrer">
          <Button>
            Apply Now <ExternalLink size={13} />
          </Button>
        </a>
      </div>
    </div>
  );
}
