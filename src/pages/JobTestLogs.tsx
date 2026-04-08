import { useState, useEffect, useMemo } from 'react';
import { FileText, RefreshCw, Search, AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Input, Badge, EmptyState, Alert } from '../components/ui';
import { CONTENT } from '../theme/content';
import { useSplitView } from '../hooks/useSplitView';
import AdminLogDetail from '../components/AdminLogDetail';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import type { JobLog } from '../components/AdminLogDetail';

export default function JobTestLogs() {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [reanalyzingById, setReanalyzingById] = useState<Record<string, boolean>>({});
  const [reanalyzeMessageById, setReanalyzeMessageById] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState<'all' | 'accepted' | 'rejected'>('all');

  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.JobTitle?.toLowerCase().includes(search.toLowerCase()) ||
                           log.Company?.toLowerCase().includes(search.toLowerCase()) ||
                           log.JobID?.includes(search);
      const matchesDecision = filterDecision === 'all' || log.FinalDecision === filterDecision;
      return matchesSearch && matchesDecision;
    });
  }, [logs, search, filterDecision]);

  const {
    selectedItem: selectedLog,
    setSelectedId: setSelectedLogId,
    selectedId: selectedLogId,
    mobileDetailOpen,
    openMobileDetail,
    closeMobileDetail,
    splitViewRef,
    itemRefs: desktopLogRefs,
    desktopSplitHeight,
    isMobile,
  } = useSplitView(filtered, {
    recalcDeps: [loading, search, filterDecision],
    bottomPadding: 32,
  });

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
    } catch (e) { 
      console.error('Error fetching logs:', e);
      setError(CONTENT.admin.jobTestLogs.states.failedLoad);
    }
    finally { setLoading(false); }
  };

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

  const renderLogDetail = (log: JobLog) => (
    <AdminLogDetail
      log={log}
      onReanalyze={() => reanalyzeSingle(log)}
      isReanalyzing={Boolean(reanalyzingById[log._id])}
      reanalyzeMsg={reanalyzeMessageById[log._id]}
    />
  );

  const renderLogListItem = (log: JobLog, onClick: () => void) => (
    <button
      key={log._id}
      ref={node => { desktopLogRefs.current[log._id] = node; }}
      onClick={onClick}
      style={{
        border: selectedLogId === log._id ? '1px solid var(--acid)' : '1px solid var(--border)',
        background: selectedLogId === log._id ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
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
            {/* Desktop split view */}
            <div
              ref={splitViewRef}
              style={{
                gap: 14, flex: 1, minHeight: 0,
                height: desktopSplitHeight,
                display: isMobile ? 'none' : 'grid',
                gridTemplateColumns: 'minmax(320px, 350px) minmax(400px, 1fr)'
              }}
            >
              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                <div className="flex flex-col" style={{ gap: 8, padding: 12 }}>
                  {filtered.map(log => renderLogListItem(log, () => setSelectedLogId(log._id)))}
                </div>
              </section>

              <section style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 16, minHeight: 0, height: desktopSplitHeight, overflowY: 'auto' }}>
                {!selectedLog
                  ? <EmptyState title="Select a log" body="Pick any log on the left panel to view its details." />
                  : renderLogDetail(selectedLog)}
              </section>
            </div>

            {/* Mobile list */}
            <div style={{ display: isMobile ? 'flex' : 'none', flexDirection: 'column', gap: 8 }}>
              {filtered.map(log => renderLogListItem(log, () => openMobileDetail(log._id)))}
            </div>

            {/* Mobile overlay */}
            {mobileDetailOpen && selectedLog && (
              <MobileDetailOverlay onBack={closeMobileDetail}>
                {renderLogDetail(selectedLog)}
              </MobileDetailOverlay>
            )}
          </>
        )}
      </Container>
    </div>
  );
}