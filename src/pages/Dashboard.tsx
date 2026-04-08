import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import type { IJob } from '../types';
import PublicJobDetail from '../components/PublicJobDetail';
import { getVisitorId } from '../utils/visitorId';
import { Badge, Button, Container, EmptyState, Input } from '../components/ui';
import FilterDropdown from '../components/FilterDropdown';
import { BRAND } from '../theme/brand';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSearchParams } from 'react-router-dom';
import { toDate, relativeDate } from '../utils/date';
import { parseAllLocations, getPrimaryLocation, normalizeWorkplace, compactSalary } from '../utils/job';

const EXPERIENCE_OPTIONS = ['Entry', 'Mid', 'Senior', 'Lead', 'Staff'];
const WORKPLACE_OPTIONS = ['Remote', 'Onsite', 'Hybrid'];

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

type SortOption = 'newest' | 'company';
type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';

type FilterState = {
  domain: string;
  experience: string;
  workplace: string;
  date: DateFilter;
  sort: SortOption;
  search: string;
};

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

const FILTER_CONTROL_STYLE: CSSProperties = {
  height: 34,
  fontSize: '0.76rem',
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 10px',
  outline: 'none',
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight, setSplitHeight] = useState<number | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const heroRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const splitViewRef = useRef<HTMLDivElement | null>(null);
  const desktopJobRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const handledDeepLinkRef = useRef<string | null>(null);
  const savedScrollRef = useRef(0);
  const deepLinkedJobId = searchParams.get('id');
  const [filters, setFilters] = useState<FilterState>({
    domain: 'All',
    experience: 'All',
    workplace: 'All',
    date: 'All',
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

  useEffect(() => {
    if (filteredJobs.length === 0) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
      return;
    }

    const exists = filteredJobs.some(job => job._id === selectedJobId);
    if (!exists) {
      setSelectedJobId(filteredJobs[0]._id);
      if (isMobile) setMobileDetailOpen(false);
    }
  }, [filteredJobs, selectedJobId, isMobile]);

  useEffect(() => {
    if (!deepLinkedJobId || handledDeepLinkRef.current === deepLinkedJobId) return;

    const deepLinkedJob = filteredJobs.find(job => job._id === deepLinkedJobId);
    if (!deepLinkedJob) return;

    setSelectedJobId(deepLinkedJob._id);
    handledDeepLinkRef.current = deepLinkedJobId;

    if (isMobile) {
      savedScrollRef.current = window.scrollY;
      setMobileDetailOpen(true);
    }
  }, [filteredJobs, deepLinkedJobId, isMobile]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return filteredJobs.find(job => job._id === selectedJobId) || null;
  }, [filteredJobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId || isMobile) return;

    const node = desktopJobRefs.current[selectedJobId];
    if (!node) return;

    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [selectedJobId, isMobile, filteredJobs.length]);

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
    setFilters(previous => ({
      ...previous,
      domain: 'All',
      experience: 'All',
      workplace: 'All',
      date: 'All',
      search: '',
    }));
  };

  const renderClearAllButton = () => {
    if (!hasActiveFilters) return null;

    return (
      <button
        onClick={clearFilters}
        style={{
          height: 34, paddingInline: 12, borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-surface-2)',
          color: 'var(--text-muted)',
          fontSize: '0.74rem', fontWeight: 500,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <X size={11} /> Clear all
      </button>
    );
  };

  const trackApplyClick = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/apply-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId() })
      });

      const payload = await response.json();
      if (!response.ok) return;

      setJobs(previous => previous.map(job => {
        if (job._id !== jobId) return job;
        return {
          ...job,
          applyClicks: payload.applyClicks ?? job.applyClicks ?? 0,
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
        width={widthOverride ?? 130}
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
        width={widthOverride ?? 130}
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
        width={widthOverride ?? 130}
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
        width={widthOverride ?? 120}
      />
    </>
  );

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={heroRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0', flexShrink: 0 }}>
        <Container>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
            {BRAND.appName}
            </p>
            <h1 style={{ fontSize: 'clamp(1.45rem, 3.8vw, 2rem)', fontFamily: "'Playfair Display',serif", color: 'var(--text-primary)', textAlign: 'center' }}>
            Browse English-Speaking Roles
            </h1>
            <p
              key={filteredJobs.length}
              style={{
                fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 6,
                animation: 'fadeIn 0.3s ease both',
                textAlign: 'center',
              }}
            >
              {filteredJobs.length} of {jobs.length} roles available
            </p>
        </Container>
      </div>

      <Container style={{ padding: '20px 24px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={filtersRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 14, flexShrink: 0 }}>
          {/* Mobile filter bar: search + filter pill button */}
          <div className="filter-bar-mobile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    height: 34, paddingInline: 14, borderRadius: 999, border: '1px solid',
                    borderColor: activeFilterCount > 0 ? 'var(--acid)' : 'var(--border)',
                    background: activeFilterCount > 0 ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                    color: activeFilterCount > 0 ? 'var(--acid)' : 'var(--text-secondary)',
                    fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {filteredJobs.length} of {jobs.length} jobs
              </span>
            </div>
          </div>

          {/* Tablet filter bar: two rows */}
          <div className="filter-bar-tablet">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="relative" style={{ flex: 1, minWidth: 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <Input
                    value={filters.search}
                    onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                    placeholder="Search jobs..."
                    style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
                  />
                </div>
                {renderSortSelect(120)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {renderFilterSelects()}
                <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {filteredJobs.length} of {jobs.length} jobs
                  </span>
                  {renderClearAllButton()}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop filter bar: one row */}
          <div className="filter-bar-full">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="relative" style={{ flex: 1, minWidth: 180, maxWidth: 300 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <Input
                  value={filters.search}
                  onChange={event => setFilters(previous => ({ ...previous, search: event.target.value }))}
                  placeholder="Search jobs..."
                  style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
                />
              </div>
              {renderSortSelect(120)}
              {renderFilterSelects()}
              <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {filteredJobs.length} of {jobs.length} jobs
                </span>
                {renderClearAllButton()}
              </div>
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
                  {filteredJobs.length === 0 ? (
                    <EmptyState
                      title="No jobs match your filters"
                      body={`Try adjusting your filters. ${jobs.length} total jobs available.`}
                      action={
                        hasActiveFilters ? (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear all filters
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : filteredJobs.map(job => {
                    const selected = selectedJobId === job._id;
                    const salary = compactSalary(job);
                    const normalizedWp = normalizeWorkplace(job.WorkplaceType);
                    const showWorkplaceBadge = normalizedWp === 'Remote' || normalizedWp === 'Hybrid';

                    return (
                      <button
                        key={job._id}
                        ref={node => { desktopJobRefs.current[job._id] = node; }}
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

                        {(showWorkplaceBadge || salary) && (
                          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
                            {showWorkplaceBadge && <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{normalizedWp}</Badge>}
                            {salary && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{salary}</Badge>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 16, minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                {!selectedJob
                  ? <EmptyState title="Select a job from the list to view details" body="Pick any role on the left panel." />
                  : <PublicJobDetail job={selectedJob} onTrackApplyClick={trackApplyClick} />}
              </section>
            </div>

            {/* Mobile-only job list */}
            <div className="mobile-list-only flex flex-col gap-2">
              {filteredJobs.length === 0 ? (
                <EmptyState
                  title="No jobs match your filters"
                  body={`Try adjusting your filters. ${jobs.length} total jobs available.`}
                  action={
                    hasActiveFilters ? (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : filteredJobs.map(job => (
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
                  <PublicJobDetail job={selectedJob} onTrackApplyClick={trackApplyClick} />
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
