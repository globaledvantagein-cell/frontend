import { useEffect, useMemo, useRef, useState } from 'react';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import type { IJob } from '../types';
import PublicJobDetail from '../components/PublicJobDetail';
import { getVisitorId } from '../utils/visitorId';
import { Badge, Button, Container, EmptyState } from '../components/ui';
import { DashboardFilterBar, MobileFilterSheet } from '../components/DashboardFilterBar';
import { BRAND } from '../theme/brand';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSearchParams } from 'react-router-dom';
import { relativeDate } from '../utils/date';
import { normalizeWorkplace, compactSalary, getDisplayLocation } from '../utils/job';
import { useJobFilters } from '../hooks/useJobFilters';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const companyParam  = searchParams.get('company');
  const deepLinkedJobId = searchParams.get('id');

  // ── Server-driven hook — owns all jobs state ───────────────────────────────
  const {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    companyOptions,
    jobs,
    totalJobs,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    updateJob,
  } = useJobFilters(companyParam || undefined);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedJobId,    setSelectedJobId]    = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight,      setSplitHeight]      = useState<number | null>(null);
  const [filterSheetOpen,  setFilterSheetOpen]  = useState(false);
  const [openDropdown,     setOpenDropdown]      = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 767px)');

  // ── Refs ───────────────────────────────────────────────────────────────────
  const heroRef            = useRef<HTMLDivElement | null>(null);
  const filtersRef         = useRef<HTMLDivElement | null>(null);
  const splitViewRef       = useRef<HTMLDivElement | null>(null);
  const listPanelRef       = useRef<HTMLDivElement | null>(null);   // scrollable left panel
  const sentinelRef        = useRef<HTMLDivElement | null>(null);   // scroll trigger target
  const desktopJobRefs     = useRef<Record<string, HTMLButtonElement | null>>({});
  const handledDeepLinkRef = useRef<string | null>(null);
  const savedScrollRef     = useRef(0);

  // ── Page title ─────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = `${BRAND.appName} Jobs`;
  }, []);

  // ── Auto-select first job when the list changes ────────────────────────────
  // When filters change, jobs is cleared → selectedJobId is cleared.
  // When the first batch arrives, auto-select the first result.
  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
      return;
    }
    const exists = jobs.some(job => job._id === selectedJobId);
    if (!exists) {
      setSelectedJobId(jobs[0]._id);
      if (isMobile) setMobileDetailOpen(false);
    }
  }, [jobs, selectedJobId, isMobile]);

  // ── Deep link: auto-open a specific job from ?id= ─────────────────────────
  useEffect(() => {
    if (!deepLinkedJobId || handledDeepLinkRef.current === deepLinkedJobId) return;
    const target = jobs.find(job => job._id === deepLinkedJobId);
    if (!target) return;

    setSelectedJobId(target._id);
    handledDeepLinkRef.current = deepLinkedJobId;

    if (isMobile) {
      savedScrollRef.current = window.scrollY;
      setMobileDetailOpen(true);
    }
  }, [jobs, deepLinkedJobId, isMobile]);

  // ── Auto-scroll to selected job card on desktop ────────────────────────────
  useEffect(() => {
    if (!selectedJobId || isMobile) return;
    const node = desktopJobRefs.current[selectedJobId];
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [selectedJobId, isMobile]); // intentionally excludes jobs.length — appending more jobs must NOT re-trigger scroll

  // ── Split-view height calculation ──────────────────────────────────────────
  useEffect(() => {
    const updateSplitHeight = () => {
      if (window.innerWidth < 768 || !splitViewRef.current) {
        setSplitHeight(null);
        return;
      }
      const top = splitViewRef.current.getBoundingClientRect().top;
      setSplitHeight(Math.max(window.innerHeight - top - 16, 320));
    };

    const observer = new ResizeObserver(() => updateSplitHeight());
    const nodes = [heroRef.current, filtersRef.current, splitViewRef.current]
      .filter(Boolean) as Element[];
    nodes.forEach(n => observer.observe(n));
    window.addEventListener('resize', updateSplitHeight);
    updateSplitHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSplitHeight);
    };
  }, [loading]);

  // ── Close filter sheet when viewport grows past mobile ────────────────────
  useEffect(() => {
    if (!isMobile) setFilterSheetOpen(false);
  }, [isMobile]);

  // ── Infinite scroll — IntersectionObserver on sentinel div ────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      {
        // Desktop: trigger relative to the scrollable list panel.
        // Mobile:  trigger relative to the viewport (root: null).
        root:       isMobile ? null : listPanelRef.current,
        rootMargin: '200px', // start loading 200px before the sentinel enters view
        threshold:  0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, loadMore, isMobile]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedJob = useMemo(
    () => (selectedJobId ? jobs.find(job => job._id === selectedJobId) ?? null : null),
    [jobs, selectedJobId],
  );

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  // ── Apply-click tracking ───────────────────────────────────────────────────
  const trackApplyClick = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      const payload = await res.json();
      if (!res.ok) return;
      // Patch only the affected job in-memory — no refetch needed
      updateJob(jobId, { applyClicks: payload.applyClicks ?? 0 });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Job card renderer (shared between desktop and mobile lists) ────────────
  const renderJobCard = (job: IJob, forMobile: boolean) => {
    const selected      = selectedJobId === job._id;
    const salary        = compactSalary(job);
    const normalizedWp  = normalizeWorkplace(job.WorkplaceType);
    const showWpBadge   = normalizedWp === 'Remote' || normalizedWp === 'Hybrid';

    if (forMobile) {
      return (
        <button
          key={job._id}
          onClick={() => {
            setSelectedJobId(job._id);
            savedScrollRef.current = window.scrollY;
            setMobileDetailOpen(true);
          }}
          style={{
            border: '1px solid var(--border)', borderRadius: 10,
            background: 'var(--bg-surface)', padding: '14px 12px',
            textAlign: 'left', width: '100%',
          }}
        >
          <p style={{ fontSize: '0.9rem',  color: 'var(--text-primary)',   fontWeight: 700, lineHeight: 1.3 }}>{job.JobTitle}</p>
          <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)',     marginTop: 4 }}>{job.Company} · {getDisplayLocation(job)}</p>
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)',     marginTop: 3 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>
        </button>
      );
    }

    return (
      <button
        key={job._id}
        ref={node => { desktopJobRefs.current[job._id] = node; }}
        onClick={() => setSelectedJobId(job._id)}
        style={{
          border:     selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          background: selected ? 'var(--acid-soft)'       : 'var(--bg-surface-2)',
          borderRadius: 10, padding: 12,
          textAlign: 'left', cursor: 'pointer', width: '100%',
        }}
      >
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {job.JobTitle}
        </p>
        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Company} | {getDisplayLocation(job)}
        </p>
        {(showWpBadge || salary) && (
          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
            {showWpBadge && <Badge variant="blue"  style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{normalizedWp}</Badge>}
            {salary       && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{salary}</Badge>}
          </div>
        )}
      </button>
    );
  };

  // ── Load-more indicator rendered at the bottom of both list variants ───────
  const loadMoreIndicator = (
    <>
      {/* Invisible sentinel — triggers IntersectionObserver as a bonus auto-load */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              height: 36,
              padding: '0 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface-2)',
              color: loadingMore ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'inherit',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              if (!loadingMore) {
                e.currentTarget.style.borderColor = 'var(--acid)';
                e.currentTarget.style.color = 'var(--acid)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = loadingMore ? 'var(--text-muted)' : 'var(--text-secondary)';
            }}
          >
            {loadingMore ? (
              <>
                <div
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid var(--border)',
                    borderTopColor: 'var(--acid)',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }}
                />
                Loading…
              </>
            ) : (
              `Load more jobs`
            )}
          </button>
        </div>
      )}

      {!hasMore && jobs.length > 0 && !loading && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 0' }}>
          All {totalJobs} roles loaded
        </p>
      )}
    </>
  );

  // ── Skeleton cards (shown while page 1 is loading) ─────────────────────────
  const skeletons = (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Hero header */}
      <div
        ref={heroRef}
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0', flexShrink: 0 }}
      >
        <Container>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>
            {BRAND.appName}
          </p>
          <h1 style={{ fontSize: 'clamp(1.45rem, 3.8vw, 2rem)', fontFamily: "'Playfair Display',serif", color: 'var(--text-primary)', textAlign: 'center' }}>
            Browse English-Speaking Roles
          </h1>
          <p
            key={`${jobs.length}-${loading}`}
            style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 6, animation: 'fadeIn 0.3s ease both', textAlign: 'center' }}
          >
            {loading
              ? 'Loading…'
              : `${jobs.length} of ${totalJobs} roles available`}
          </p>
        </Container>
      </div>

      <Container style={{ padding: '20px 24px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Filter bar */}
        <div
          ref={filtersRef}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 14, flexShrink: 0 }}
        >
          <DashboardFilterBar
            filters={filters}
            setFilters={setFilters}
            companyOptions={companyOptions}
            filteredCount={jobs.length}
            totalCount={totalJobs}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onOpenFilterSheet={() => setFilterSheetOpen(true)}
          />
        </div>

        {/* Mobile filter bottom sheet */}
        {filterSheetOpen && isMobile && (
          <MobileFilterSheet
            filters={filters}
            setFilters={setFilters}
            companyOptions={companyOptions}
            filteredCount={jobs.length}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onClose={() => setFilterSheetOpen(false)}
          />
        )}

        {/* ── Desktop / tablet split view ── */}
        <div
          ref={splitViewRef}
          className="split-grid"
          style={{ gap: 14, flex: 1, minHeight: 0, height: desktopSplitHeight }}
        >
          {/* Left panel — scrollable job list */}
          <section
            ref={listPanelRef}
            style={{
              border: '1px solid var(--border)', borderRadius: 12,
              background: 'var(--bg-surface)', minHeight: 0,
              height: desktopSplitHeight, overflowY: 'auto',
            }}
          >
            {loading ? skeletons : (
              <div className="flex flex-col" style={{ gap: 8, padding: 12 }}>
                {jobs.length === 0 ? (
                  <EmptyState
                    title="No jobs match your filters"
                    body={hasActiveFilters ? 'Try adjusting your search or filters.' : 'No roles are currently available.'}
                    action={
                      hasActiveFilters
                        ? <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all filters</Button>
                        : undefined
                    }
                  />
                ) : (
                  <>
                    {jobs.map(job => renderJobCard(job, false))}
                    {loadMoreIndicator}
                  </>
                )}
              </div>
            )}
          </section>

          {/* Right panel — job detail */}
          <section
            style={{
              border: '1px solid var(--border)', borderRadius: 12,
              background: 'var(--bg-surface)', padding: 16,
              minHeight: 0, height: desktopSplitHeight, overflowY: 'auto',
            }}
          >
            {!selectedJob
              ? <EmptyState title="Select a job from the list to view details" body="Pick any role on the left panel." />
              : <PublicJobDetail job={selectedJob} onTrackApplyClick={trackApplyClick} />
            }
          </section>
        </div>

        {/* ── Mobile-only job list ── */}
        <div className="mobile-list-only flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No jobs match your filters"
              body={hasActiveFilters ? 'Try adjusting your search or filters.' : 'No roles are currently available.'}
              action={
                hasActiveFilters
                  ? <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all filters</Button>
                  : undefined
              }
            />
          ) : (
            <>
              {jobs.map(job => renderJobCard(job, true))}
              {loadMoreIndicator}
            </>
          )}
        </div>

        {/* Mobile detail overlay */}
        {mobileDetailOpen && selectedJob && (
          <MobileDetailOverlay
            onBack={() => {
              setMobileDetailOpen(false);
              requestAnimationFrame(() => window.scrollTo(0, savedScrollRef.current));
            }}
            backLabel="Back to results"
          >
            <PublicJobDetail job={selectedJob} onTrackApplyClick={trackApplyClick} />
          </MobileDetailOverlay>
        )}
      </Container>
    </div>
  );
}