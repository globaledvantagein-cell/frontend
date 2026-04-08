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
import { parseAllLocations, getPrimaryLocation, normalizeWorkplace, compactSalary } from '../utils/job';
import { useJobFilters } from '../hooks/useJobFilters';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
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

  const {
    filters,
    setFilters,
    filteredJobs,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
  } = useJobFilters(jobs);

  useEffect(() => {
    document.title = `${BRAND.appName} Jobs`;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch ALL jobs by paginating through the backend (200 per page)
        const PAGE_SIZE = 200;
        let page = 1;
        let allJobs: IJob[] = [];
        let backendTotal = 0;

        while (true) {
          const response = await fetch(`/api/jobs?limit=${PAGE_SIZE}&page=${page}`);
          const payload = await response.json();
          const batch = Array.isArray(payload?.jobs) ? payload.jobs : [];
          backendTotal = payload?.totalJobs ?? backendTotal;

          allJobs = [...allJobs, ...batch];

          // Stop when we've received all jobs or got an empty batch
          if (batch.length < PAGE_SIZE || allJobs.length >= backendTotal) break;
          page++;
        }

        setJobs(allJobs);
        setTotalJobs(backendTotal);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
              {filteredJobs.length} of {totalJobs} roles available
            </p>
        </Container>
      </div>


      <Container style={{ padding: '20px 24px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={filtersRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 14, flexShrink: 0 }}>
          <DashboardFilterBar
            filters={filters}
            setFilters={setFilters}
            filteredCount={filteredJobs.length}
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
            filteredCount={filteredJobs.length}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            onClose={() => setFilterSheetOpen(false)}
          />
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
                      body={`Try adjusting your filters. ${totalJobs} total jobs available.`}
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
                  body={`Try adjusting your filters. ${totalJobs} total jobs available.`}
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
          </>
        )}
      </Container>
    </div>
  );
}
