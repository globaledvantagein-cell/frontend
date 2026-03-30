import { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, RefreshCw, Search, CheckCircle, AlertCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Input, Badge, EmptyState, Alert } from '../components/ui';
import { CONTENT } from '../theme/content';
import { useMediaQuery } from '../hooks/useMediaQuery';
import FormattedDescription from '../components/FormattedDescription';

interface Evidence {
  german_reason: string;
}

interface JobLog {
  _id: string;
  JobID: string;
  JobTitle: string;
  Company: string;
  GermanRequired: boolean;
  ConfidenceScore: number;
  Status: string;
  FinalDecision: string;
  scrapedAt: string;
  PostedDate: string | null;
  Description: string;
  Evidence?: Evidence;
}

export default function JobTestLogs() {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [reanalyzingById, setReanalyzingById] = useState<Record<string, boolean>>({});
  const [reanalyzeMessageById, setReanalyzeMessageById] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState<'all' | 'accepted' | 'rejected'>('all');

  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight, setSplitHeight] = useState<number | null>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const splitViewRef = useRef<HTMLDivElement | null>(null);
  const desktopLogRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const savedScrollRef = useRef(0);

  const navigate = useNavigate();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError(CONTENT.admin.jobTestLogs.states.noToken);
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/jobs/test-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 400) {
        const data = await res.json();
        if (data.error === 'Invalid Token' || data.error?.includes('Token')) {
          setError(CONTENT.admin.jobTestLogs.states.expired);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
      }
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      const fetchedLogs = Array.isArray(data) ? data : [];
      setLogs(fetchedLogs);
      if (fetchedLogs.length > 0 && !selectedLogId) {
        setSelectedLogId(fetchedLogs[0]._id);
      }
    } catch (e) { 
      console.error('Error fetching logs:', e);
      setError(CONTENT.admin.jobTestLogs.states.failedLoad);
    }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.JobTitle?.toLowerCase().includes(search.toLowerCase()) ||
                           log.Company?.toLowerCase().includes(search.toLowerCase()) ||
                           log.JobID?.includes(search);
      const matchesDecision = filterDecision === 'all' || log.FinalDecision === filterDecision;
      return matchesSearch && matchesDecision;
    });
  }, [logs, search, filterDecision]);

  const selectedLog = useMemo(() => {
    if (!selectedLogId) return null;
    return filtered.find(log => log._id === selectedLogId) || null;
  }, [filtered, selectedLogId]);

  useEffect(() => {
    if (filtered.length > 0 && (!selectedLogId || !filtered.find(l => l._id === selectedLogId))) {
      setSelectedLogId(filtered[0]._id);
      if (isMobile) setMobileDetailOpen(false);
    }
  }, [filtered, selectedLogId, isMobile]);

  useEffect(() => {
    if (!selectedLogId || isMobile) return;
    const node = desktopLogRefs.current[selectedLogId];
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, [selectedLogId, isMobile, filtered.length, filterDecision]);

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
  }, [loading, filtered.length, search, filterDecision]);

  const reanalyzeSingle = async (log: JobLog) => {
    setReanalyzingById(prev => ({ ...prev, [log._id]: true }));
    setReanalyzeMessageById(prev => ({ ...prev, [log._id]: '' }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReanalyzeMessageById(prev => ({ ...prev, [log._id]: 'Missing auth token. Please log in again.' }));
        return;
      }

      const identifier = encodeURIComponent(log.JobID || log._id);
      const response = await fetch(`/api/jobs/admin/reanalyze/${identifier}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to re-analyze this job');
      }

      if (payload?.skipped) {
        setReanalyzeMessageById(prev => ({ ...prev, [log._id]: payload.reason || 'Skipped due to manual review.' }));
        return;
      }

      const updatedJob = payload?.job;
      if (updatedJob) {
        setLogs(previous => previous.map(item => {
          if (item._id !== log._id) return item;
          return {
            ...item,
            GermanRequired: Boolean(updatedJob.GermanRequired),
            ConfidenceScore: typeof updatedJob.ConfidenceScore === 'number'
              ? updatedJob.ConfidenceScore
              : item.ConfidenceScore,
            Status: updatedJob.Status || item.Status,
          };
        }));
      }

      setReanalyzeMessageById(prev => ({ ...prev, [log._id]: 'Re-analysis complete.' }));
    } catch (e) {
      console.error(e);
      setReanalyzeMessageById(prev => ({ ...prev, [log._id]: 'Failed to re-analyze this job.' }));
    } finally {
      setReanalyzingById(prev => ({ ...prev, [log._id]: false }));
    }
  };

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0', flexShrink: 0 }}>
        <Container size="lg">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {CONTENT.admin.jobTestLogs.subtitle}
                </p>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: "'Playfair Display',serif", color: 'var(--text-primary)', margin: 0 }}>
                  <FileText size={24} color="var(--acid)" />
                  {CONTENT.admin.jobTestLogs.title}
                </h1>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchLogs} loading={loading}>
                <RefreshCw size={13} />{CONTENT.admin.jobTestLogs.refreshCta}
              </Button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {CONTENT.admin.jobTestLogs.summary(filtered.length)}
            </p>
          </div>
        </Container>
      </div>

      <Container size="lg" style={{ padding: '24px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {error && (
          <div style={{ marginBottom: 24, flexShrink: 0 }}>
            <Alert type="error">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{error}</span>
                {error.includes('log in') && (
                  <Button size="sm" variant="danger" onClick={() => navigate('/login')}>
                    <LogOut size={12} />{CONTENT.admin.jobTestLogs.states.loginCta}
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        )}

        {!error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <Input
                  placeholder={CONTENT.admin.jobTestLogs.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {CONTENT.admin.jobTestLogs.decisions.map(decision => (
                  <button
                    key={decision}
                    onClick={() => setFilterDecision(decision as any)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: filterDecision === decision ? 'var(--acid-dim)' : 'transparent',
                      color: filterDecision === decision ? 'var(--acid)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {decision}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 148, borderRadius: 12 }} />)}
          </div>
        ) : error ? (
           <EmptyState 
             icon={<AlertCircle size={32} />} 
             title={CONTENT.admin.jobTestLogs.states.unableTitle} 
             body={CONTENT.admin.jobTestLogs.states.unableBody}
           />
         ) : filtered.length === 0 ? (
          <EmptyState 
            icon={<FileText size={32} />} 
            title={CONTENT.admin.jobTestLogs.states.noLogsTitle} 
            body={logs.length === 0 ? CONTENT.admin.jobTestLogs.states.noLogsBody : CONTENT.admin.jobTestLogs.states.adjustFiltersBody} 
          />
        ) : (
          <>
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
                  {filtered.map(log => {
                    const selected = selectedLogId === log._id;

                    return (
                      <button
                        key={log._id}
                        ref={node => { desktopLogRefs.current[log._id] = node; }}
                        onClick={() => setSelectedLogId(log._id)}
                        style={{
                          border: selected ? '1px solid var(--acid)' : '1px solid var(--border)',
                          background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                          borderRadius: 10,
                          padding: 12,
                          textAlign: 'left',
                          cursor: 'pointer',
                          width: '100%',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {log.JobTitle}
                        </p>
                        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {log.Company} · {log.JobID}
                        </p>

                        <div className="flex flex-wrap gap-1.5 items-center" style={{ marginTop: 8 }}>
                          <Badge variant={log.FinalDecision === 'accepted' ? 'green' : 'red'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {log.FinalDecision === 'accepted' ? CONTENT.admin.jobTestLogs.labels.accepted : CONTENT.admin.jobTestLogs.labels.rejected}
                          </Badge>
                          <Badge variant={log.ConfidenceScore >= 0.9 ? 'green' : log.ConfidenceScore >= 0.7 ? 'neutral' : 'red'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            {Math.round(log.ConfidenceScore * 100)}%
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 16, minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                {!selectedLog
                  ? <EmptyState title="Select a log" body="Pick any log on the left panel to view its details." />
                  : <AdminLogDetail 
                      log={selectedLog} 
                      onReanalyze={() => reanalyzeSingle(selectedLog)}
                      isReanalyzing={Boolean(reanalyzingById[selectedLog._id])}
                      reanalyzeMsg={reanalyzeMessageById[selectedLog._id]}
                    />
                }
              </section>
            </div>

            <div className="flex flex-col gap-2 md:hidden" style={{ display: isMobile ? 'flex' : 'none' }}>
              {filtered.map(log => (
                <button
                  key={log._id}
                  onClick={() => {
                    setSelectedLogId(log._id);
                    savedScrollRef.current = window.scrollY;
                    setMobileDetailOpen(true);
                  }}
                  style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-surface)', padding: '14px 12px', textAlign: 'left', width: '100%' }}
                >
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{log.JobTitle}</p>
                  <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{log.Company}</p>
                  <div className="flex flex-wrap gap-1.5 items-center" style={{ marginTop: 8 }}>
                    <Badge variant={log.FinalDecision === 'accepted' ? 'green' : 'red'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {log.FinalDecision === 'accepted' ? CONTENT.admin.jobTestLogs.labels.accepted : CONTENT.admin.jobTestLogs.labels.rejected}
                    </Badge>
                    <Badge variant={log.ConfidenceScore >= 0.9 ? 'green' : log.ConfidenceScore >= 0.7 ? 'neutral' : 'red'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {Math.round(log.ConfidenceScore * 100)}%
                    </Badge>
                  </div>
                </button>
              ))}
            </div>

            {mobileDetailOpen && selectedLog && (
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
                  <AdminLogDetail 
                      log={selectedLog} 
                      onReanalyze={() => reanalyzeSingle(selectedLog)}
                      isReanalyzing={Boolean(reanalyzingById[selectedLog._id])}
                      reanalyzeMsg={reanalyzeMessageById[selectedLog._id]}
                    />
                </div>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

function AdminLogDetail({ log, onReanalyze, isReanalyzing, reanalyzeMsg }: { log: JobLog; onReanalyze: () => void; isReanalyzing: boolean; reanalyzeMsg?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', right: 14, top: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        {(log.PostedDate || log.scrapedAt)
            ? `${CONTENT.admin.jobTestLogs.labels.postedPrefix} ${new Date((log.PostedDate || log.scrapedAt)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : `${CONTENT.admin.jobTestLogs.labels.postedPrefix} ${CONTENT.admin.jobTestLogs.labels.postedFallback}`}
        </span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.2rem,2.6vw,1.55rem)', color: 'var(--text-primary)', marginBottom: 10, paddingRight: 80 }}>
          {log.JobTitle}
        </h2>

        <div className="flex items-center flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{log.Company}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            ID: <code style={{ background: 'var(--border)', padding: '2px 4px', borderRadius: 4 }}>{log.JobID}</code>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center" style={{ marginBottom: 10 }}>
          <Badge variant={log.FinalDecision === 'accepted' ? 'green' : 'red'}>
            {log.FinalDecision === 'accepted' ? CONTENT.admin.jobTestLogs.labels.accepted : CONTENT.admin.jobTestLogs.labels.rejected}
          </Badge>
          <Badge variant={log.ConfidenceScore >= 0.9 ? 'green' : log.ConfidenceScore >= 0.7 ? 'neutral' : 'red'}>
            Confidence: {Math.round(log.ConfidenceScore * 100)}%
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 16 }}>
          <Button size="sm" onClick={onReanalyze} variant="outline" loading={isReanalyzing}>
             Re-analyze
          </Button>
          {reanalyzeMsg && (
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {reanalyzeMsg}
            </span>
          )}
        </div>
      </div>

       <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 12, 
          padding: 'clamp(10px, 2vw, 14px)', 
          background: 'var(--bg-surface-2)', 
          border: '1px solid var(--border)',
          borderRadius: 10 
        }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
              {CONTENT.admin.jobTestLogs.labels.germanRequired}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {log.GermanRequired ? <AlertCircle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
              <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.88rem)', fontWeight: 600, color: log.GermanRequired ? 'var(--danger)' : 'var(--success)' }}>
                {log.GermanRequired ? CONTENT.admin.jobTestLogs.labels.yes : CONTENT.admin.jobTestLogs.labels.no}
              </span>
            </div>
          </div>
        </div>

      {log.Evidence && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 14 }}>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            {CONTENT.admin.jobTestLogs.labels.aiEvidence}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ 
                padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)', 
                background: 'var(--bg-base)', 
                borderLeft: '3px solid var(--acid)', 
                borderRadius: '0 8px 8px 0' 
            }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {CONTENT.admin.jobTestLogs.labels.germanEvidence}
                </p>
                <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.82rem)', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', wordBreak: 'break-word' }}>
                {log.Evidence.german_reason || CONTENT.admin.jobTestLogs.labels.noEvidence}
                </p>
            </div>
            </div>
        </div>
      )}

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 14 }}>
        <FormattedDescription description={log.Description || ''} />
      </div>
    </div>
  );
}