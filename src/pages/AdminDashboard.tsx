import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, RefreshCw, ArrowRight, FlaskConical, Globe, Trash2 } from 'lucide-react';
import { Container, PageHeader, Button, StatCard } from '../components/ui';

interface CleanSummary { total: number; cleaned: number; alreadyClean: number; }
interface BackfillSummary { total: number; updated: number; logsTotal: number; logsUpdated: number; message: string; }
interface SalaryFixSummary { total: number; fixed: number; }
interface DbCounts { testLogs: number; pendingReview: number; activeJobs: number; rejectedJobs: number; }

export default function AdminDashboard() {
  const { token } = useAuth();
  const [counts, setCounts] = useState<DbCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSummary, setCleanSummary] = useState<CleanSummary | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillSummary, setBackfillSummary] = useState<BackfillSummary | null>(null);
  const [fixingSalaries, setFixingSalaries] = useState(false);
  const [salaryFixSummary, setSalaryFixSummary] = useState<SalaryFixSummary | null>(null);

  const fetchCounts = async () => {
    setCountsLoading(true);
    try {
      const r = await fetch('/api/analytics/counts');
      if (r.ok) setCounts(await r.json());
    } catch (e) { console.error('Failed to fetch DB counts:', e); } finally { setCountsLoading(false); }
  };

  useEffect(() => { fetchCounts(); }, [token]);

  const cleanDescriptions = async () => {
    if (!window.confirm('This will strip any remaining HTML from all job descriptions. Continue?')) return;
    setCleaning(true);
    setCleanSummary(null);
    try {
      const response = await fetch('/api/jobs/admin/clean-descriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to clean descriptions');
      setCleanSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  const backfillExperience = async () => {
    if (!window.confirm('This will backfill experience levels and workplace type for existing jobs and test logs. Continue?')) return;
    setBackfilling(true);
    setBackfillSummary(null);
    try {
      const response = await fetch('/api/jobs/admin/backfill-experience', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to backfill experience levels');
      setBackfillSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setBackfilling(false);
    }
  };

  const fixSalaries = async () => {
    if (!window.confirm('This will normalize suspiciously low salary values (e.g. 125 -> 125000). Continue?')) return;
    setFixingSalaries(true);
    setSalaryFixSummary(null);
    try {
      const response = await fetch('/api/jobs/admin/fix-salaries', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Failed to fix salaries');
      setSalaryFixSummary(payload);
    } catch (error) {
      console.error(error);
    } finally {
      setFixingSalaries(false);
    }
  };

  const DB_COUNTS = [
    { icon: <FlaskConical size={18} />, value: counts?.testLogs ?? '–', label: 'Test Logs', accent: false },
    { icon: <ClipboardList size={18} />, value: counts?.pendingReview ?? '–', label: 'Review Queue', accent: counts !== null && (counts.pendingReview > 0) },
    { icon: <Globe size={18} />, value: counts?.activeJobs ?? '–', label: 'Live Jobs', accent: false },
    { icon: <Trash2 size={18} />, value: counts?.rejectedJobs ?? '–', label: 'Trash', accent: false },
  ];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '32px 0' }}>
        <Container>
          <PageHeader label="System Analytics" title="Daily Overview"
            subtitle={`Metrics for ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            actions={
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" size="sm" onClick={fetchCounts} loading={countsLoading}><RefreshCw size={13} />Refresh</Button>
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
        {countsLoading
          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
          : <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
            {DB_COUNTS.map(s => <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} accent={s.accent} />)}
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
