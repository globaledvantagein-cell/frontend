import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, SlidersHorizontal } from 'lucide-react';
import type { IJob } from '../types';
import JobCard from '../components/JobCard';
import { Container, PageHeader, Button, EmptyState } from '../components/ui';
import { CONTENT } from '../theme/content';

interface CS { companyName: string; openRoles: number; }
export default function Dashboard() {
  const [sp, setSp] = useSearchParams();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [cos, setCos] = useState<CS[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { document.title = CONTENT.admin.dashboard.documentTitle; }, []);
  const sel = sp.get('company') || '';

  useEffect(() => {
    (async () => {
      setLoading(true); try {
        const dr = await fetch('/api/jobs/directory'); const dd = await dr.json();
        setCos(Array.isArray(dd) ? dd.filter((c: any) => c.openRoles > 0) : []);
        const url = `/api/jobs?limit=100${sel ? `&company=${encodeURIComponent(sel)}` : ''}`;
        const jr = await fetch(url); const jd = await jr.json(); setJobs(jd.jobs || []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [sel]);

  const feedback = async (id: string, status: 'up' | 'down') => {
    if (status === 'down') setJobs(p => p.filter(j => j._id !== id));
    else setJobs(p => p.map(j => j._id === id ? { ...j, thumbStatus: status } : j));
    await fetch(`/api/jobs/${id}/feedback`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  };

  const SideBtn = ({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: active ? 'var(--primary-soft)' : 'transparent', color: active ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: active ? 700 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.22s', fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: '0.75rem', background: 'var(--paper2)', color: 'var(--subtle-ink)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{count}</span>}
    </button>
  );

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '32px 0' }}>
        <Container>
          <PageHeader label={CONTENT.admin.dashboard.headerLabel} title={sel || CONTENT.admin.dashboard.defaultTitle}
            subtitle={CONTENT.admin.dashboard.subtitle(jobs.length)}
            actions={sel ? <button onClick={() => setSp({})} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined} />
        </Container>
      </div>
      <Container style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 76 }} className="hidden md:block">
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={12} color="var(--primary)" />
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{CONTENT.admin.dashboard.sideHeading}</span>
              </div>
              <div className="thin-scroll" style={{ maxHeight: '72vh', overflowY: 'auto', padding: 8 }}>
                <SideBtn label={CONTENT.admin.dashboard.allJobs} active={!sel} onClick={() => setSp({})} />
                {cos.map(c => <SideBtn key={c.companyName} label={c.companyName} count={c.openRoles} active={sel === c.companyName} onClick={() => setSp({ company: c.companyName })} />)}
              </div>
            </div>
          </aside>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 148 }} />)}</div>
              : jobs.length === 0 ? <EmptyState icon={<Briefcase size={36} />} title={CONTENT.admin.dashboard.empty.title} body={CONTENT.admin.dashboard.empty.body} action={<Button variant="ghost" onClick={() => setSp({})}>{CONTENT.admin.dashboard.empty.clearFilterCta}</Button>} />
                : <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{jobs.map(j => <JobCard key={j._id} job={j} onFeedback={feedback} />)}</div>}
          </div>
        </div>
      </Container>
    </div>
  );
}
