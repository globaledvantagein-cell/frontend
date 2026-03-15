import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Briefcase, Shield, Search } from 'lucide-react';
import HomeJobCard from '../components/HomeJobCard';
import CompanyCard from '../components/DirectoryCard';
import type { IJob, ICompany } from '../types';
import { Button, Container, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';

const TICKER = CONTENT.home.ticker;
const WHY_CARDS = [
  {
    icon: <Briefcase size={22} />,
    title: CONTENT.home.why[0].title,
    body: CONTENT.home.why[0].body,
    step: '01',
    iconBg: 'linear-gradient(135deg, rgba(31,111,235,0.15), rgba(139,92,246,0.15))',
    iconBorder: 'rgba(31,111,235,0.28)',
    iconColor: 'var(--primary)',
    topBorder: '#1F6FEB',
  },
  {
    icon: <Search size={22} />,
    title: CONTENT.home.why[1].title,
    body: CONTENT.home.why[1].body,
    step: '02',
    iconBg: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(45,212,191,0.15))',
    iconBorder: 'rgba(52,211,153,0.28)',
    iconColor: 'var(--success)',
    topBorder: '#34D399',
  },
  {
    icon: <Shield size={22} />,
    title: CONTENT.home.why[2].title,
    body: CONTENT.home.why[2].body,
    step: '03',
    iconBg: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15))',
    iconBorder: 'rgba(251,191,36,0.28)',
    iconColor: 'var(--warning)',
    topBorder: '#FBBF24',
  },
];

export default function Home() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sub, setSub] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  useEffect(() => {
    document.title = `${BRAND.fullName} | ${BRAND.tagline}`;
    (async () => {
      try {
        const [jr, dr] = await Promise.all([fetch('/api/jobs?limit=6'), fetch('/api/jobs/directory')]);
        const jd = await jr.json(); setJobs(jd.jobs || []);
        const dd = await dr.json(); if (Array.isArray(dd)) setCompanies(dd.slice(0, 8));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const subscribe = async (e: FormEvent) => {
    e.preventDefault(); if (!email) return; setSub('busy');
    try {
      const r = await fetch('/api/auth/talent-pool', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name: email.split('@')[0], domain: 'General', location: 'Unknown' }) });
      setSub(r.ok ? 'ok' : 'err'); if (r.ok) setEmail('');
    } catch { setSub('err'); }
  };

  const previewJobs = jobs.slice(0, 6);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="orb" style={{ width: 500, height: 500, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-soft)' }} />
        <Container style={{ position: 'relative', zIndex: 1, paddingTop: 96, paddingBottom: 80, textAlign: 'center' }}>
          <h1 className="anim-up" style={{ animationDelay: '0.07s', fontSize: 'clamp(2.4rem,6.5vw,4.5rem)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            {CONTENT.home.hero.heading}<br /><span className="font-sketch" style={{ color: 'var(--primary)', fontSize: '1.1em' }}>{CONTENT.home.hero.headingAccent}</span>
          </h1>
          <p className="anim-up" style={{ animationDelay: '0.14s', fontSize: '1.05rem', color: 'var(--muted-ink)', lineHeight: 1.75, maxWidth: 500, margin: '0 auto 36px' }}>
            {CONTENT.home.hero.subtitle}
          </p>
          <div className="anim-up hero-cta-group" style={{ animationDelay: '0.2s', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/signup"><Button size="lg">{CONTENT.home.hero.primaryCta} <ArrowRight size={15} /></Button></Link>
            <Link to="/jobs"><Button variant="ghost" size="lg">{CONTENT.home.hero.secondaryCta}</Button></Link>
          </div>
        </Container>
        <div className="ticker-wrap" style={{ position: 'relative', overflow: 'hidden', borderTop: '1.25px solid var(--border)', borderBottom: '1.25px solid var(--border)', padding: '13px 0', background: 'var(--surface-solid)', zIndex: 1 }}>
          <div className="ticker-track" style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 28, paddingRight: 40 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--subtle-ink)', letterSpacing: '0.02em' }}>{t}</span>
                <span style={{ color: 'var(--primary)', fontSize: '0.55rem' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SECTION ──────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--paper)' }}>
        <Container>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>How we find your next role</h2>
          </div>
          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {WHY_CARDS.map((w, i) => (
              <div
                key={i}
                className="why-card anim-up"
                style={{
                  animationDelay: `${0.08 + i * 0.1}s`,
                  position: 'relative',
                  padding: 28,
                  borderRadius: 16,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${w.topBorder}`,
                  overflow: 'hidden',
                }}
              >
                {/* Faded step number */}
                <span aria-hidden="true" style={{ position: 'absolute', top: 10, right: 16, fontSize: '2.5rem', fontWeight: 800, color: 'var(--ink)', opacity: 0.06, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{w.step}</span>
                {/* Icon */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: w.iconBg, border: `1.5px solid ${w.iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: w.iconColor, marginBottom: 20, flexShrink: 0 }}>
                  {w.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{w.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── COMPANIES ────────────────────────────────── */}
      <section style={{ padding: '80px 0 64px', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>
              {CONTENT.home.companies.heading} <span style={{ color: 'var(--primary)' }}>{CONTENT.home.companies.headingAccent}</span>
            </h2>
            <Link to="/directory"><Button variant="ghost">{CONTENT.home.companies.fullDirectoryCta} <ArrowRight size={13} /></Button></Link>
          </div>
        </Container>

        {/* Auto-scrolling ticker — bleeds full section width */}
        <div className="company-ticker-wrap">
          <div className="company-ticker-track">
            {[...companies, ...companies].map((c, i) => (
              <div key={`${c.companyName}-${i}`} style={{ width: 260, flexShrink: 0 }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────── */}
      <section style={{ padding: '96px 0', position: 'relative', overflow: 'hidden', background: 'var(--paper)', borderTop: '1.25px solid var(--border)' }}>
        <div className="orb" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--primary-soft)' }} />
        <Container size="sm" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 24px' }}><Mail size={22} /></div>
          <h2 style={{ fontSize: 'clamp(1.7rem,4vw,3rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 14 }}>{CONTENT.home.newsletter.heading}</h2>
          <p style={{ color: 'var(--muted-ink)', marginBottom: 36, lineHeight: 1.75 }}>{CONTENT.home.newsletter.subtitle}</p>
          <form onSubmit={subscribe} className="newsletter-form" style={{ display: 'flex', gap: 8, maxWidth: 420, margin: '0 auto 16px', flexWrap: 'wrap' }}>
            <input type="email" required placeholder={CONTENT.home.newsletter.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} disabled={sub === 'busy'}
              style={{ flex: 1, minWidth: 200, padding: '12px 14px', fontFamily: 'inherit', fontSize: '0.925rem', background: 'var(--surface-solid)', color: 'var(--ink)', border: '1.25px solid var(--border)', borderRadius: 10, outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
            <Button loading={sub === 'busy'}>{CONTENT.home.newsletter.subscribeCta}</Button>
          </form>
          {sub === 'ok' && <Alert type="success">{CONTENT.home.newsletter.success}</Alert>}
          {sub === 'err' && <Alert type="error">{CONTENT.home.newsletter.error}</Alert>}
        </Container>
      </section>

      {/* ── LATEST JOBS ──────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
        <Container size="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {CONTENT.home.latest.heading}
            </h2>
            <Link
              to="/jobs"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              {CONTENT.home.latest.viewAllCta} <ArrowRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 12 }} />)}
            </div>
          ) : (
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {previewJobs.map(job => <HomeJobCard key={job._id} job={job} />)}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
