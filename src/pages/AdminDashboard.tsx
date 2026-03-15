import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Server, Database, Cpu, ClipboardList, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Container, PageHeader, Button, StatCard } from '../components/ui';

interface DailyStats { connectedSources: number; jobsScraped: number; jobsSentToAI: number; jobsPendingReview: number; jobsPublished: number; }
interface CleanSummary { total: number; cleaned: number; alreadyClean: number; }
interface BackfillSummary { total: number; updated: number; logsTotal: number; logsUpdated: number; message: string; }
interface SalaryFixSummary { total: number; fixed: number; }

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSummary, setCleanSummary] = useState<CleanSummary | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillSummary, setBackfillSummary] = useState<BackfillSummary | null>(null);
  const [fixingSalaries, setFixingSalaries] = useState(false);
  const [salaryFixSummary, setSalaryFixSummary] = useState<SalaryFixSummary | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/analytics/daily', { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await r.json(); setStats(d);
    } catch (e) { console.error('Failed to fetch analytics:', e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [token]);

  const cleanDescriptions = async () => {
    if (!window.confirm('This will strip any remaining HTML from all job descriptions. Continue?')) {
      return;
    }

    setCleaning(true);
    setCleanSummary(null);

    try {
      const response = await fetch('/api/jobs/admin/clean-descriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to clean descriptions');
      }

      setCleanSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  const backfillExperience = async () => {
    if (!window.confirm('This will backfill experience levels and workplace type for existing jobs and test logs. Continue?')) {
      return;
    }

    setBackfilling(true);
    setBackfillSummary(null);

    try {
      const response = await fetch('/api/jobs/admin/backfill-experience', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to backfill experience levels');
      }

      setBackfillSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setBackfilling(false);
    }
  };

  const fixSalaries = async () => {
    if (!window.confirm('This will normalize suspiciously low salary values (e.g. 125 -> 125000). Continue?')) {
      return;
    }

    setFixingSalaries(true);
    setSalaryFixSummary(null);

    try {
      const response = await fetch('/api/jobs/admin/fix-salaries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fix salaries');
      }

      setSalaryFixSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setFixingSalaries(false);
    }
  };

  const STATS = [
    { icon: <Server size={18} />, value: stats?.connectedSources ?? 0, label: 'Career Pages', accent: false },
    { icon: <Database size={18} />, value: stats?.jobsScraped ?? 0, label: 'Raw Data (24h)', accent: false },
    { icon: <Cpu size={18} />, value: stats?.jobsSentToAI ?? 0, label: 'AI Processed', accent: false },
    { icon: <ClipboardList size={18} />, value: stats?.jobsPendingReview ?? 0, label: 'Needs Review', accent: true },
    { icon: <CheckCircle size={18} />, value: stats?.jobsPublished ?? 0, label: 'Live Jobs', accent: false },
  ];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '32px 0' }}>
        <Container>
          <PageHeader label="System Analytics" title="Daily Overview"
            subtitle={`Metrics for ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            actions={
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" size="sm" onClick={fetchStats} loading={loading}><RefreshCw size={13} />Refresh</Button>
                <Button variant="ghost" size="sm" onClick={cleanDescriptions} loading={cleaning}>Clean All Descriptions</Button>
                <Button variant="ghost" size="sm" onClick={backfillExperience} loading={backfilling}>Backfill Experience Levels</Button>
                <Button variant="ghost" size="sm" onClick={fixSalaries} loading={fixingSalaries}>Fix Salaries</Button>
                <Link to="/review"><Button size="sm">Review Queue <ArrowRight size={13} /></Button></Link>
              </div>
            } />
        </Container>
      </div>
      <Container style={{ padding: '32px 24px' }}>
        {salaryFixSummary && (
          <div style={{ marginBottom: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontSize: '0.86rem' }}>
            Salary normalization complete · Checked: {salaryFixSummary.total} · Fixed: {salaryFixSummary.fixed}
          </div>
        )}
        {backfillSummary && (
          <div style={{ marginBottom: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontSize: '0.86rem' }}>
            {backfillSummary.message} · Jobs: {backfillSummary.updated}/{backfillSummary.total} · Test logs: {backfillSummary.logsUpdated}/{backfillSummary.logsTotal}
          </div>
        )}
        {cleanSummary && (
          <div style={{ marginBottom: 14, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontSize: '0.86rem' }}>
            Description cleaning complete · Total: {cleanSummary.total} · Cleaned: {cleanSummary.cleaned} · Already clean: {cleanSummary.alreadyClean}
          </div>
        )}
        {loading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
          : <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            {STATS.map(s => <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} accent={s.accent} />)}
          </div>}
        <div style={{ marginTop: 24, padding: '24px', background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14 }}>
          <p className="font-sketch" style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: 10 }}>System Status</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted-ink)', lineHeight: 1.7 }}>
            The scraper runs automatically. Metrics reset daily at 00:00 UTC. Data shown is for <strong style={{ color: 'var(--ink)' }}>{new Date().toLocaleDateString()}</strong>.
          </p>
        </div>
      </Container>
    </div>
  );
}
