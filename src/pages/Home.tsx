import { useState, useEffect } from 'react';
// ...existing code...
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HomeJobCard from '../components/HomeJobCard';
import CompanyCard from '../components/DirectoryCard';
import type { IJob, ICompany } from '../types';
import { Button, Container } from '../components/ui';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';

const TICKER = CONTENT.home.ticker;
// ...existing code...

export default function Home() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);

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
          {/* Hero subtitle split into two lines with visual separation */}
          <div className="anim-up" style={{ animationDelay: '0.14s', margin: '0 auto 32px', maxWidth: 600, textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 10 }}>
              {CONTENT.home.hero.subtitleLine1}
            </div>
            <div style={{ width: 40, height: 1.5, background: 'rgba(31,111,235,0.3)', borderRadius: 2, margin: '14px auto' }} />
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>
              {CONTENT.home.hero.subtitleLine2}
            </div>
          </div>
          <div className="anim-up hero-cta-group" style={{ animationDelay: '0.2s', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/jobs"><Button size="lg">Browse Jobs <ArrowRight size={15} /></Button></Link>
            <Link to="/signup"><Button variant="ghost" size="lg">{CONTENT.home.hero.secondaryCta}</Button></Link>
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

      {/* ── HOW WE FIND ENGLISH-SPEAKING JOBS — EDITORIAL NUMBERED ROWS ──────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--paper)' }}>
        <Container>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: 10 }}>{CONTENT.home.whySection.heading}</h2>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>{CONTENT.home.whySection.subtitle}</div>
          <div style={{ maxWidth: 680, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
            {CONTENT.home.why.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
                {/* Number */}
                <div style={{ width: 80, flexShrink: 0, fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: 'rgba(59,130,246,0.15)', lineHeight: 1, textAlign: 'left' }}>{`0${i + 1}`}</div>
                {/* Title + Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{step.desc}</div>
                </div>
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
