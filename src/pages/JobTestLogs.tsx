import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Search, CheckCircle, AlertCircle, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Input, Badge, Card, EmptyState, Alert } from '../components/ui';

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
  const [search, setSearch] = useState('');
  const [filterDecision, setFilterDecision] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/jobs/test-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 400) {
        const data = await res.json();
        if (data.error === 'Invalid Token' || data.error?.includes('Token')) {
          setError('Your session has expired. Please log in again.');
          // Clear invalid token
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
      console.log('Fetched logs:', data);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.error('Error fetching logs:', e);
      setError('Failed to load test logs. Please try again.');
    }
    finally { setLoading(false); }
  };

  const filtered = logs.filter(log => {
    const matchesSearch = log.JobTitle?.toLowerCase().includes(search.toLowerCase()) ||
                         log.Company?.toLowerCase().includes(search.toLowerCase()) ||
                         log.JobID?.includes(search);
    const matchesDecision = filterDecision === 'all' || log.FinalDecision === filterDecision;
    return matchesSearch && matchesDecision;
  });

  const toggleDesc = (id: string) => {
    setExpandedDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const StatusBadge = ({ decision }: { decision: string }) => {
    return <Badge variant={decision === 'accepted' ? 'green' : 'red'}>
      {decision === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
    </Badge>;
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <Container>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Admin Diagnostics
                </p>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontFamily: "'Playfair Display',serif", color: 'var(--text-primary)', margin: 0 }}>
                  <FileText size={24} color="var(--acid)" />
                  AI Test Logs
                </h1>
              </div>
              <Button variant="ghost" size="sm" onClick={fetchLogs} loading={loading}>
                <RefreshCw size={13} />Refresh
              </Button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filtered.length} jobs analyzed (accepted + rejected with AI evidence)
            </p>
          </div>
        </Container>
      </div>

      <Container style={{ padding: 'clamp(16px, 3vw, 28px) clamp(12px, 2vw, 24px)' }}>
        {/* Error Alert */}
        {error && (
          <div style={{ marginBottom: 24 }}>
            <Alert type="error">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{error}</span>
                {error.includes('log in') && (
                  <Button size="sm" variant="danger" onClick={() => navigate('/login')}>
                    <LogOut size={12} />Login
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        )}

        {/* Filters - Responsive */}
        {!error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <Input
                placeholder="Search by title, company, JobID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
            
            {/* Filter Buttons - Horizontal scroll on mobile */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {(['all', 'accepted', 'rejected'] as const).map(decision => (
                <button
                  key={decision}
                  onClick={() => setFilterDecision(decision)}
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
        )}

        {/* Logs List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
          </div>
        ) : error ? (
          <EmptyState 
            icon={<AlertCircle size={32} />} 
            title="Unable to load logs" 
            body="Please check your authentication and try again."
            action={
              <Button onClick={() => navigate('/login')}>
                <LogOut size={13} />Go to Login
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState 
            icon={<FileText size={32} />} 
            title="No logs found" 
            body={logs.length === 0 ? "No test logs in database yet. Run the scraper first." : "Try adjusting your filters."} 
          />
        ) : (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(log => (
              <Card key={log._id} style={{ padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)' }}>
                {/* Header - Responsive */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ 
                        fontFamily: "'Playfair Display',serif", 
                        fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)', 
                        color: 'var(--text-primary)', 
                        marginBottom: 6,
                        wordBreak: 'break-word'
                      }}>
                        {log.JobTitle}
                      </h3>
                      <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.82rem)', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
                        {log.Company} · JobID: <code style={{ background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem' }}>{log.JobID}</code>
                        {' · '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {(log.PostedDate || log.scrapedAt)
                            ? `Posted: ${new Date((log.PostedDate || log.scrapedAt)!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Posted: N/A'}
                        </span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge decision={log.FinalDecision} />
                      <Badge variant={log.ConfidenceScore >= 0.9 ? 'green' : log.ConfidenceScore >= 0.7 ? 'neutral' : 'red'}>
                        {Math.round(log.ConfidenceScore * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Classification Grid - Responsive */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                  gap: 12, 
                  marginBottom: 16, 
                  padding: 'clamp(10px, 2vw, 14px)', 
                  background: 'var(--bg-surface-2)', 
                  borderRadius: 10 
                }}>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                      German Required
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {log.GermanRequired ? <AlertCircle size={16} color="var(--danger)" /> : <CheckCircle size={16} color="var(--success)" />}
                      <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.88rem)', fontWeight: 600, color: log.GermanRequired ? 'var(--danger)' : 'var(--success)' }}>
                        {log.GermanRequired ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence - Responsive */}
                {log.Evidence && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                      AI Evidence & Reasoning
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ 
                        padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)', 
                        background: 'var(--bg-surface-2)', 
                        borderLeft: '3px solid var(--acid)', 
                        borderRadius: '0 8px 8px 0' 
                      }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          🇩🇪 German
                        </p>
                        <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.82rem)', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', wordBreak: 'break-word' }}>
                          {log.Evidence.german_reason || 'No evidence provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable Description - Responsive */}
                {log.Description && (
                  <div>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.82rem)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      maxHeight: expandedDesc[log._id] ? 'none' : '100px',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'max-height 0.3s ease',
                      background: 'var(--bg-surface-2)',
                      padding: 'clamp(10px, 2vw, 12px)',
                      borderRadius: 8,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {log.Description}
                      {!expandedDesc[log._id] && log.Description.length > 400 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 40,
                          background: 'linear-gradient(to bottom, transparent, var(--bg-surface-2))'
                        }} />
                      )}
                    </div>
                    {log.Description.length > 400 && (
                      <button
                        onClick={() => toggleDesc(log._id)}
                        style={{
                          marginTop: 8,
                          background: 'none',
                          border: 'none',
                          color: 'var(--acid)',
                          fontSize: 'clamp(0.7rem, 1.8vw, 0.78rem)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: 0,
                          fontFamily: 'inherit',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => ((e.currentTarget.style.opacity = '0.7'))}
                        onMouseLeave={e => ((e.currentTarget.style.opacity = '1'))}
                      >
                        {expandedDesc[log._id] ? (
                          <>Show less <ChevronUp size={14} /></>
                        ) : (
                          <>View full description <ChevronDown size={14} /></>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}