import { useState, useEffect, useRef, useMemo } from 'react';
import type { IJob } from '../types';
import { Trash2, RefreshCw, Download, ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { Container, PageHeader, Button, EmptyState, Badge } from '../components/ui';
import { CONTENT } from '../theme/content';
import FormattedDescription from '../components/FormattedDescription';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatPostedDate, relativeDate } from '../utils/date';
import { parseAllLocations, getPrimaryLocation, isMeaningful, normalizeWorkplace } from '../utils/job';

export default function RejectedJobs() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight, setSplitHeight] = useState<number | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const splitViewRef = useRef<HTMLDivElement | null>(null);
  const desktopJobRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const savedScrollRef = useRef(0);

  useEffect(() => { fetchRejected(); }, []);

  const fetchRejected = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/jobs/rejected', { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await r.json(); 
      const fetchedJobs = Array.isArray(d) ? d : [];
      setJobs(fetchedJobs);
      if (fetchedJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(fetchedJobs[0]._id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;
    return jobs.find(job => job._id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (jobs.length > 0 && (!selectedJobId || !jobs.find(j => j._id === selectedJobId))) {
      setSelectedJobId(jobs[0]._id);
      if (isMobile) setMobileDetailOpen(false);
    }
  }, [jobs, selectedJobId, isMobile]);

  useEffect(() => {
    if (!selectedJobId || isMobile) return;
    const node = desktopJobRefs.current[selectedJobId];
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [selectedJobId, isMobile, jobs.length]);

  useEffect(() => {
    const updateSplitHeight = () => {
      if (window.innerWidth < 768 || !splitViewRef.current) {
        setSplitHeight(null);
        return;
      }
      const top = splitViewRef.current.getBoundingClientRect().top;
      const nextHeight = Math.max(window.innerHeight - top - 32, 320); 
      setSplitHeight(nextHeight);
    };

    const observer = new ResizeObserver(() => updateSplitHeight());
    if (splitViewRef.current) observer.observe(splitViewRef.current);
    window.addEventListener('resize', updateSplitHeight);
    updateSplitHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSplitHeight);
    };
  }, [loading, jobs.length]);

  const handleRestore = async (id: string) => {
    setJobs(p => p.filter(j => j._id !== id));
    if (selectedJobId === id) setSelectedJobId(null);
    if (isMobile && mobileDetailOpen) setMobileDetailOpen(false);
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/admin/restore/${id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) return;
    
    // Create CSV header
    const headers = ['JobID', 'JobTitle', , 'Company','Description'];
    
    // Create CSV rows
    const rows = jobs.map(job => {
      return [
        `"${job.JobID || job._id}"`,
        `"${(job.JobTitle || '').replace(/"/g, '""')}"`,
        `"${(job.Company || '').replace(/"/g, '""')}"`,
        `"${(job.Description || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rejected_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '32px 0', flexShrink: 0 }}>
        <Container size="lg">
          <PageHeader 
            label={CONTENT.admin.label} 
            title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={22} color="var(--danger)" />{CONTENT.admin.rejectedJobs.title}</span>}
            subtitle={CONTENT.admin.rejectedJobs.subtitle(jobs.length)}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={fetchRejected} loading={loading}>
                  <RefreshCw size={13} /> Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={jobs.length === 0}>
                  <Download size={13} /> Export to CSV
                </Button>
              </div>
            }
          />
        </Container>
      </div>

      <Container size="lg" style={{ padding: '24px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 148, borderRadius: 12 }} />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState icon={<Trash2 size={32} />} title={CONTENT.admin.rejectedJobs.empty.title} body={CONTENT.admin.rejectedJobs.empty.body} />
        ) : (
          <>
            {/* Desktop/Tablet split view */}
            <div
              ref={splitViewRef}
              className="split-grid hidden md:grid"
              style={{
                gap: 14,
                flex: 1,
                minHeight: 0,
                height: desktopSplitHeight,
                display: isMobile ? 'none' : 'grid',
                gridTemplateColumns: 'minmax(320px, 350px) minmax(400px, 1fr)'
              }}
            >
              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                <div className="flex flex-col" style={{ gap: 8, padding: 12 }}>
                  {jobs.map(job => {
                    const selected = selectedJobId === job._id;
                    const normalizedWorkplace = normalizeWorkplace(job.WorkplaceType);
                    const showWorkplaceBadge = normalizedWorkplace === 'Remote' || normalizedWorkplace === 'Hybrid';

                    return (
                      <button
                        key={job._id}
                        ref={node => { desktopJobRefs.current[job._id] = node; }}
                        onClick={() => setSelectedJobId(job._id)}
                        style={{
                          border: selected ? '1px solid var(--danger)' : '1px solid var(--border)',
                          background: selected ? 'var(--danger-soft, rgba(239, 68, 68, 0.05))' : 'var(--bg-surface-2)',
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

                        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
                          {showWorkplaceBadge && <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{normalizedWorkplace}</Badge>}
                          {job.RejectionReason && <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>{job.RejectionReason}</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 16, minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                {!selectedJob
                  ? <EmptyState title="Select a job" body="Pick any rejected role on the left panel to view details." />
                  : <AdminJobDetail job={selectedJob} onRestore={handleRestore} />}
              </section>
            </div>

            {/* Mobile-only job list */}
            <div className="flex flex-col gap-2 md:hidden" style={{ display: isMobile ? 'flex' : 'none' }}>
              {jobs.map(job => (
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
                  {job.RejectionReason && <p style={{ fontSize: '0.73rem', color: 'var(--danger)', marginTop: 6, fontWeight: 500 }}>{job.RejectionReason}</p>}
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
                    <ArrowLeft size={16} /> Back to list
                  </button>
                </div>
                <div className="mobile-detail-body">
                  <AdminJobDetail job={selectedJob} onRestore={handleRestore} />
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

function AdminJobDetail({ job, onRestore }: { job: IJob; onRestore: (id: string) => void }) {
  const allLocations = parseAllLocations(job);
  const primaryLocation = getPrimaryLocation(job, allLocations);
  const normalizedWorkplace = normalizeWorkplace(job.WorkplaceType);
  const showWorkplaceBadge = normalizedWorkplace === 'Remote' || normalizedWorkplace === 'Hybrid';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', right: 14, top: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Posted: {formatPostedDate(job.PostedDate)}
        </span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.2rem,2.6vw,1.55rem)', color: 'var(--text-primary)', marginBottom: 10, paddingRight: 80 }}>
          {job.JobTitle}
        </h2>

        <div className="flex items-center flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{job.Company}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {primaryLocation}
          </span>
          {showWorkplaceBadge && <Badge variant="blue" style={{ fontSize: '0.7rem' }}>{normalizedWorkplace}</Badge>}
        </div>

        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          {isMeaningful(job.ExperienceLevel) && job.ExperienceLevel !== 'N/A' && <Badge variant="neutral">{job.ExperienceLevel}</Badge>}
          {isMeaningful(job.EmploymentType) && <Badge variant="neutral">{job.EmploymentType}</Badge>}
        </div>
        
        {job.RejectionReason && (
           <div style={{ marginTop: 12, padding: 10, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Rejection Reason:
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: 4 }}>{job.RejectionReason}</p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 16 }}>
          <Button size="sm" onClick={() => onRestore(job._id)} variant="outline">
             Restore to Queue
          </Button>
          <a href={job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Button size="sm" variant="ghost">
                View Source <ExternalLink size={12} />
            </Button>
          </a>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 14 }}>
        <FormattedDescription description={job.Description || ''} />
      </div>
    </div>
  );
}
