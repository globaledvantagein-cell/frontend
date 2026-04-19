import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import type { IJob } from '../types';
import FormattedDescription from '../components/FormattedDescription';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import { Badge, Button, Container, EmptyState, PageHeader } from '../components/ui';
import { formatPostedDate } from '../utils/date';
import {  isMeaningful, detailedSalary, getDisplayLocation } from '../utils/job';
import { useSplitView } from '../hooks/useSplitView';

function isCleanDepartment(value?: string | null) {
  if (!isMeaningful(value)) return false;
  const normalized = String(value).trim();
  if (normalized.length > 30) return false;
  if (/\d/.test(normalized)) return false;
  return true;
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

// ── Editable Location Component ─────────────────────────────────

function EditableLocation({ job, onSave }: { job: IJob; onSave: (updated: IJob) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(job.Location || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(job.Location || '');
  }, [job._id, job.Location]);

  const handleSave = async () => {
    if (!value.trim() || value.trim() === job.Location) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/jobs/admin/update/${job._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ Location: value.trim() })
      });

      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
        setEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        title="Click to edit location"
        style={{
          fontSize: '0.82rem', color: 'var(--text-muted)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', borderBottom: '1px dashed var(--border)',
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        <MapPin size={12} /> {job.Location || 'No location'}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') { setValue(job.Location || ''); setEditing(false); }
        }}
        autoFocus
        style={{
          fontSize: '0.82rem', color: 'var(--text-primary)',
          background: 'var(--bg-surface-2)', border: '1px solid var(--acid)',
          borderRadius: 4, padding: '2px 6px', outline: 'none',
          fontFamily: 'inherit', width: 200,
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
          background: 'var(--acid)', color: '#000', border: 'none',
          borderRadius: 4, cursor: 'pointer',
        }}
      >
        {saving ? '...' : 'Save'}
      </button>
      <button
        onClick={() => { setValue(job.Location || ''); setEditing(false); }}
        style={{
          fontSize: '0.7rem', padding: '2px 6px',
          background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function ReviewQueue() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const {
    selectedItem: selectedJob,
    selectedId: selectedJobId,
    setSelectedId: setSelectedJobId,
    mobileDetailOpen,
    openMobileDetail,
    closeMobileDetail,
    splitViewRef,
    itemRefs: desktopJobRefs,
    desktopSplitHeight,
  } = useSplitView(jobs, {
    observeRefs: [heroRef, summaryRef],
    recalcDeps: [loading, reanalyzingAll],
  });

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
      setSelectedJobId('');
    }

    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/admin/decision/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ decision })
    });
  };

  const handleUpdateJob = (updated: IJob) => {
    setJobs(prev => prev.map(j => j._id === updated._id ? updated : j));
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

  const renderJobListItem = (job: IJob, onClick: () => void) => {
    const selected = job._id === selectedJobId;
    const confidence = normalizeConfidence(job.ConfidenceScore);
    const displayLocation = getDisplayLocation(job);

    return (
      <button
        key={job._id}
        ref={node => { desktopJobRefs.current[job._id] = node; }}
        onClick={onClick}
        style={{
          borderTop: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          borderRight: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          borderBottom: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          borderLeft: selected ? '4px solid var(--acid)' : '1px solid var(--border)',
          background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
          borderRadius: 10, padding: 12, textAlign: 'left', cursor: 'pointer', width: '100%',
        }}
      >
        <p style={{
          fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {job.JobTitle}
        </p>
        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Company} | {displayLocation}
        </p>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
          <Badge variant={confidenceVariant(confidence)} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{confidenceLabel(confidence)}</Badge>
          <Badge variant={compactDomain(job.Domain) === 'Technical' ? 'green' : 'neutral'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{compactDomain(job.Domain)}</Badge>
        </div>
      </button>
    );
  };

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
            {/* Desktop split view */}
            <div
              ref={splitViewRef}
              className="split-grid"
              style={{ gap: 14, flex: 1, minHeight: 0, height: desktopSplitHeight }}
            >
              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                <div className="flex flex-col" style={{ gap: 8, padding: 12 }}>
                  {jobs.map(job => renderJobListItem(job, () => setSelectedJobId(job._id)))}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto', padding: 16 }}>
                {!selectedJob
                  ? <EmptyState title="Select a job to review" body="Pick a pending role from the left panel." />
                  : <ReviewDetail job={selectedJob} onDecision={handleDecision} onUpdateJob={handleUpdateJob} />}
              </section>
            </div>

            {/* Mobile list */}
            <div className="mobile-list-only flex flex-col gap-2">
              {jobs.map(job => renderJobListItem(job, () => openMobileDetail(job._id)))}
            </div>

            {/* Mobile overlay */}
            {mobileDetailOpen && selectedJob && (
              <MobileDetailOverlay onBack={closeMobileDetail} backLabel="Back to queue">
                <ReviewDetail job={selectedJob} onDecision={handleDecision} onUpdateJob={handleUpdateJob} />
              </MobileDetailOverlay>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

// ── Review Detail ───────────────────────────────────────────────

function ReviewDetail({ job, onDecision, onUpdateJob }: { 
  job: IJob; 
  onDecision: (id: string, decision: 'accept' | 'reject') => void;
  onUpdateJob: (updated: IJob) => void;
}) {
  const evidence = (job as any)?.Evidence?.german_reason as string | undefined;

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
          <EditableLocation job={job} onSave={onUpdateJob} />
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