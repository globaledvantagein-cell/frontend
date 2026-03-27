import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { AlertCircle, CheckCircle2, ExternalLink, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import type { IJob } from '../types';
import FormattedDescription from '../components/FormattedDescription';
import { Badge, Button, Container, EmptyState, PageHeader } from '../components/ui';

function toDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPostedDate(value?: string | null) {
  const date = toDate(value);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function detailedSalary(job: IJob) {
  if (job.SalaryMin == null && job.SalaryMax == null) return null;

  const symbol = job.SalaryCurrency === 'EUR' ? 'EUR ' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? `${job.SalaryCurrency} ` : '');
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

function normalizeConfidence(score?: number) {
  if (score == null) return 0;
  if (score > 1) return score / 100;
  return score;
}

function confidenceVariant(score?: number) {
  const normalized = normalizeConfidence(score);
  if (normalized >= 0.9) return 'green' as const;
  if (normalized >= 0.7) return 'yellow' as const;
  return 'red' as const;
}

function confidenceLabel(score?: number) {
  const normalized = normalizeConfidence(score);
  return `${Math.round(normalized * 100)}%`;
}

function compactDomain(value?: string) {
  if (value === 'Technical' || value === 'Non-Technical') return value;
  return 'Unclear';
}

export default function ReviewQueue() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight, setSplitHeight] = useState<number | null>(null);
  const [reanalyzingAll, setReanalyzingAll] = useState(false);
  const [reanalyzeSummary, setReanalyzeSummary] = useState<{
    total: number;
    reanalyzed: number;
    changedToRejected: number;
    changedToPending: number;
    skippedManualReview: number;
  } | null>(null);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const splitViewRef = useRef<HTMLDivElement | null>(null);
  const savedScrollRef = useRef(0);
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => { fetchQueue(); }, []);


  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/jobs/admin/review', { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      const nextJobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
      setJobs(nextJobs);
      setTotalJobs(payload?.totalJobs || nextJobs.length);
    } catch (error) {
      console.error('Failed to load queue', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, decision: 'accept' | 'reject') => {
    setJobs(previous => previous.filter(job => job._id !== id));
    setTotalJobs(prev => Math.max(0, prev - 1));
    if (selectedJobId === id) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
    }

    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/admin/decision/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ decision })
    });
  };

  const handleReanalyzeAll = async () => {
    if (!window.confirm('Re-analyze all non-manually-reviewed jobs now? This may take several minutes.')) return;

    setReanalyzeSummary(null);
    setReanalyzingAll(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/jobs/admin/reanalyze-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to re-analyze jobs');
      }

      setReanalyzeSummary(payload);
      await fetchQueue();
    } catch (error) {
      console.error(error);
    } finally {
      setReanalyzingAll(false);
    }
  };

  useEffect(() => {
    if (!jobs.length) {
      setSelectedJobId(null);
      return;
    }

    const exists = jobs.some(job => job._id === selectedJobId);
    if (!selectedJobId || !exists) {
      setSelectedJobId(jobs[0]._id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find(job => job._id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

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
    const observedNodes = [heroRef.current, summaryRef.current, splitViewRef.current].filter(Boolean) as Element[];

    observedNodes.forEach(node => observer.observe(node));
    window.addEventListener('resize', updateSplitHeight);
    updateSplitHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSplitHeight);
    };
  }, [jobs.length, loading, reanalyzingAll, isMobile]);

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div ref={heroRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0', flexShrink: 0 }}>
        <Container size="lg">
          <PageHeader
            label="Admin"
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={22} color="var(--primary)" />Review Queue</span>}
            subtitle={reanalyzingAll ? 'Re-analyzing all eligible jobs... this can take a while.' : `${totalJobs} jobs pending review (showing ${jobs.length})`}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={fetchQueue} loading={loading || reanalyzingAll}><RefreshCw size={13} />Refresh</Button>
                <Button size="sm" onClick={handleReanalyzeAll} loading={reanalyzingAll}>Re-analyze All</Button>
              </div>
            }
          />
        </Container>
      </div>

      <Container size="lg" style={{ padding: '20px 24px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div ref={summaryRef} style={{ flexShrink: 0 }}>
          {reanalyzeSummary && (
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Re-analysis complete | Total: {reanalyzeSummary.total} | Re-analyzed: {reanalyzeSummary.reanalyzed} | Changed to rejected: {reanalyzeSummary.changedToRejected} | Changed to pending: {reanalyzeSummary.changedToPending} | Skipped (manual): {reanalyzeSummary.skippedManualReview}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(index => <div key={index} className="skeleton" style={{ height: 132 }} />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState title="Queue is empty" body="No pending jobs for review." />
        ) : (
          <>
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
                  {jobs.map(job => {
                    const selected = job._id === selectedJobId;
                    const confidence = normalizeConfidence(job.ConfidenceScore);
                    const allLocations = parseAllLocations(job);
                    const primaryLocation = getPrimaryLocation(job, allLocations);

                    return (
                      <button
                        key={job._id}
                        onClick={() => setSelectedJobId(job._id)}
                        style={{
                          borderTop: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
                          borderRight: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
                          borderBottom: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
                          borderLeft: selected ? '4px solid var(--acid)' : '1px solid var(--border)',
                          background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                          borderRadius: 10,
                          padding: 12,
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {job.JobTitle}
                        </p>
                        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.Company} | {primaryLocation}
                        </p>

                        <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
                          <Badge variant={confidenceVariant(confidence)} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{confidenceLabel(confidence)}</Badge>
                          <Badge variant={compactDomain(job.Domain) === 'Technical' ? 'green' : 'neutral'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{compactDomain(job.Domain)}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto', padding: 16 }}>
                {!selectedJob
                  ? <EmptyState title="Select a job to review" body="Pick a pending role from the left panel." />
                  : <ReviewDetail job={selectedJob} onDecision={handleDecision} />}
              </section>
            </div>

            {/* Mobile-only job list */}
            <div className="mobile-list-only flex flex-col gap-2">
              {jobs.map(job => {
                const confidence = normalizeConfidence(job.ConfidenceScore);
                const allLocations = parseAllLocations(job);
                const primaryLocation = getPrimaryLocation(job, allLocations);

                return (
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
                    <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{job.Company} · {primaryLocation}</p>
                    <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
                      <Badge variant={confidenceVariant(confidence)} style={{ fontSize: '0.68rem' }}>{confidenceLabel(confidence)}</Badge>
                      <Badge variant={compactDomain(job.Domain) === 'Technical' ? 'green' : 'neutral'} style={{ fontSize: '0.68rem' }}>{compactDomain(job.Domain)}</Badge>
                    </div>
                  </button>
                );
              })}
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
                    <ArrowLeft size={16} /> Back to queue
                  </button>
                </div>
                <div className="mobile-detail-body">
                  <ReviewDetail job={selectedJob} onDecision={handleDecision} />
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

function ReviewDetail({ job, onDecision }: { job: IJob; onDecision: (id: string, decision: 'accept' | 'reject') => void }) {
  const evidence = (job as any)?.Evidence?.german_reason as string | undefined;

  const allLocations = parseAllLocations(job);
  const primaryLocation = getPrimaryLocation(job, allLocations);
  const salary = detailedSalary(job);
  const confidence = normalizeConfidence(job.ConfidenceScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 16 }}>
        <span style={{ position: 'absolute', right: 14, top: 14, fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {job.ATSPlatform || 'unknown'}
        </span>

        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.2rem,2.6vw,1.55rem)', color: 'var(--text-primary)', marginBottom: 10, paddingRight: 80 }}>
          {job.JobTitle}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{job.Company}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <MapPin size={12} /> {primaryLocation}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Posted: {formatPostedDate(job.PostedDate || job.scrapedAt)}</span>
        </div>

        <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
          {isCleanDepartment(job.Department) && <Badge variant="neutral">{job.Department}</Badge>}
          {(job.Domain === 'Technical' || job.Domain === 'Non-Technical') && <Badge variant={job.Domain === 'Technical' ? 'green' : 'neutral'}>{job.Domain}</Badge>}
          {isMeaningful(job.ExperienceLevel) && job.ExperienceLevel !== 'N/A' && <Badge variant="neutral">{job.ExperienceLevel}</Badge>}
          {isMeaningful(job.WorkplaceType) && job.WorkplaceType !== 'Unspecified' && <Badge variant="blue">{job.WorkplaceType}</Badge>}
          {isMeaningful(job.EmploymentType) && <Badge variant="neutral">{job.EmploymentType}</Badge>}
        </div>

        {salary && (
          <p style={{ marginBottom: 8, fontSize: '0.96rem', fontWeight: 700, color: 'var(--success)' }}>
            {salary}
          </p>
        )}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 14 }}>
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
          <Badge variant={job.GermanRequired ? 'red' : 'green'}>
            {job.GermanRequired
              ? <><AlertCircle size={12} /> German Required: Yes {'\u274C'}</>
              : <><CheckCircle2 size={12} /> German Required: No {'\u2705'}</>}
          </Badge>
          <Badge variant={confidenceVariant(confidence)}>
            Confidence: {confidenceLabel(confidence)}
          </Badge>
        </div>

        {evidence && (
          <div style={{ border: '1px solid var(--border)', borderLeft: '3px solid var(--acid)', borderRadius: 10, background: 'var(--bg-surface-2)', padding: '12px 14px' }}>
            <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>AI Evidence</p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>{evidence}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" onClick={() => onDecision(job._id, 'reject')}>
          Reject
        </Button>
        <Button variant="success" onClick={() => onDecision(job._id, 'accept')}>
          Approve
        </Button>
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
