import { useEffect, useState } from 'react';
import type { IJob } from '../types';
import JobCard from '../components/JobCard';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { Container, PageHeader, Button, EmptyState } from '../components/ui';
import { CONTENT } from '../theme/content';

export default function ReviewQueue() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('/api/jobs/admin/review', { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await r.json(); setJobs(d.jobs || []);
    } catch (e) { console.error('Failed to load queue', e); } finally { setLoading(false); }
  };

  const handleDecision = async (id: string, decision: 'accept' | 'reject') => {
    setJobs(p => p.filter(j => j._id !== id));
    const token = localStorage.getItem('token');
    await fetch(`/api/jobs/admin/decision/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ decision }) });
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '32px 0' }}>
        <Container size="lg">
          <PageHeader label={CONTENT.admin.label} title={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={24} color="var(--primary)" />{CONTENT.admin.reviewQueue.title}</span>}
            subtitle={CONTENT.admin.reviewQueue.subtitle(jobs.length)}
            actions={<Button variant="ghost" size="sm" onClick={fetchQueue} loading={loading}><RefreshCw size={13} />{CONTENT.admin.reviewQueue.refreshCta}</Button>} />
        </Container>
      </div>
      <Container size="lg" style={{ padding: '32px 24px' }}>
        {loading
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 148 }} />)}</div>
          : jobs.length === 0
            ? <EmptyState icon={<span style={{ fontSize: '2.5rem' }}>🎉</span>} title={CONTENT.admin.reviewQueue.empty.title} body={CONTENT.admin.reviewQueue.empty.body} />
            : <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map(j => <JobCard key={j._id} job={j} isReviewMode onDecision={handleDecision} />)}
            </div>}
      </Container>
    </div>
  );
}
