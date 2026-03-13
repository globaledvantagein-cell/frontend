import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Briefcase, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import JobCard from '../components/JobCard';
import CompanyCard from '../components/DirectoryCard';
import type { IJob, ICompany } from '../types';
import { Button, Badge, Container, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';

const TICKER = CONTENT.home.ticker;
const WHY = [
  { icon: <Briefcase size={18} />, title: CONTENT.home.why[0].title, body: CONTENT.home.why[0].body },
  { icon: <Search size={18} />, title: CONTENT.home.why[1].title, body: CONTENT.home.why[1].body },
  { icon: <Shield size={18} />, title: CONTENT.home.why[2].title, body: CONTENT.home.why[2].body },
];

export default function Home() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sub, setSub] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${BRAND.fullName} | ${BRAND.tagline}`;
    (async () => {
      try {
        const [jr, dr] = await Promise.all([fetch('/api/jobs?limit=9'), fetch('/api/jobs/directory')]);
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

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 300;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="orb" style={{ width: 500, height: 500, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-soft)' }} />
        <Container style={{ position: 'relative', zIndex: 1, paddingTop: 96, paddingBottom: 80, textAlign: 'center' }}>
          <div className="anim-up" style={{ marginBottom: 20 }}><Badge variant="primary"><Briefcase size={10} />{BRAND.tagline}</Badge></div>
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
          <div className="anim-up hero-stats-grid" style={{ animationDelay: '0.28s', display: 'flex', justifyContent: 'center', gap: 48, marginTop: 60, flexWrap: 'wrap', paddingTop: 40, borderTop: '1.25px solid var(--border)' }}>
            {CONTENT.home.hero.stats.map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div className="font-sketch" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{v}</div>
                <div style={{ fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--subtle-ink)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
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
          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {WHY.map((w, i) => (
              <div key={i} style={{ padding: '36px 30px', background: 'var(--surface-solid)', borderRight: i < WHY.length - 1 ? '1.25px solid var(--border)' : 'none', transition: 'background 0.22s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-solid)'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: 18 }}>{w.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{w.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-ink)', lineHeight: 1.7 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── COMPANIES ────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{CONTENT.home.companies.label}</p>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>{CONTENT.home.companies.heading} <span style={{ color: 'var(--primary)' }}>{CONTENT.home.companies.headingAccent}</span></h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Carousel arrows (visible on all viewports) */}
              <button onClick={() => scrollCarousel('left')} aria-label={CONTENT.home.companies.carouselAriaLeft}
                style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)', transition: 'all 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => scrollCarousel('right')} aria-label={CONTENT.home.companies.carouselAriaRight}
                style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)', transition: 'all 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}>
                <ChevronRight size={16} />
              </button>
              <Link to="/directory"><Button variant="ghost">{CONTENT.home.companies.fullDirectoryCta} <ArrowRight size={13} /></Button></Link>
            </div>
          </div>

          {/* Carousel: horizontal scroll with snap on mobile/tablet, wraps on large desktop */}
          <div ref={carouselRef} className="snap-carousel stagger" style={{ scrollPaddingLeft: 4 }}>
            {companies.map(c => (
              <div key={c.companyName} style={{ minWidth: 260, maxWidth: 300, flex: '0 0 auto' }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </Container>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{CONTENT.home.latest.label}</p>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>{CONTENT.home.latest.heading}</h2>
            </div>
            <Link to="/jobs"><Button variant="ghost">{CONTENT.home.latest.viewAllCta} <ArrowRight size={13} /></Button></Link>
          </div>
          {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
            : <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{jobs.map(j => <JobCard key={j._id} job={j} />)}</div>}
          <div style={{ textAlign: 'center', marginTop: 36 }}><Link to="/jobs"><Button variant="outline">{CONTENT.home.latest.loadMoreCta} <ArrowRight size={13} /></Button></Link></div>
        </Container>
      </section>
    </div>
  );
}
