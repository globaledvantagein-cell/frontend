import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CheckCircle, Briefcase, Globe, ArrowRight, Shield, Mail } from 'lucide-react';
import { Button, FormField, Input, Select, Alert } from '../components/ui';
import { CONTENT } from '../theme/content';

const COUNTRIES = CONTENT.signup.countries;

const TRUST = [
  { icon: <Mail size={14} />, text: CONTENT.signup.leftPanel.perks[0] },
  { icon: <Shield size={14} />, text: CONTENT.signup.leftPanel.perks[1] },
  { icon: <Globe size={14} />, text: CONTENT.signup.leftPanel.perks[2] },
];

export default function Signup() {
  const [fd, setFd] = useState({ name: '', email: '', domain: 'Tech', location: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (fd.location.startsWith('---')) return;
    setStatus('loading'); setErr('');
    try {
      const r = await fetch('/api/auth/talent-pool', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fd) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || CONTENT.signup.fallbackError);
      setStatus('success');
    } catch (e: any) { setStatus('error'); setErr(e.message); }
  };

  if (status === 'success') return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--primary-soft)' }} />
      <div className="anim-scale" style={{ textAlign: 'center', padding: 56, maxWidth: 400, position: 'relative', zIndex: 1, background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 58, height: 58, background: 'var(--success-soft)', border: '1.25px solid var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', margin: '0 auto 22px' }}><CheckCircle size={26} /></div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{CONTENT.signup.success.heading}</h2>
        <p style={{ color: 'var(--muted-ink)', lineHeight: 1.75, marginBottom: 30, fontSize: '0.92rem' }}>{CONTENT.signup.success.subtitle}</p>
        <Link to="/jobs"><Button>{CONTENT.signup.success.cta} <ArrowRight size={14} /></Button></Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '90vh', display: 'flex', background: 'var(--paper)' }}>
      {/* Brand panel (desktop only) */}
      <div className="hidden md:flex" style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px', background: 'var(--paper2)', borderRight: '1.25px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 360, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 24px' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 12 }}>{CONTENT.signup.leftPanel.heading}</h2>
          <p style={{ color: 'var(--muted-ink)', marginBottom: 36, lineHeight: 1.65, fontSize: '0.95rem' }}>{CONTENT.signup.leftPanel.subtitle}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {TRUST.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-ink)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{t.icon}</span>{t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="signup-form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="anim-up" style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile brand header */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 46, height: 46, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', margin: '0 auto 14px' }}><Sparkles size={20} /></div>
          </div>

          <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, padding: '36px 32px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 6 }}>{CONTENT.signup.form.heading}</h2>
              <p style={{ color: 'var(--subtle-ink)', fontSize: '0.9rem' }}>{CONTENT.signup.form.subtitle}</p>
            </div>
            {status === 'error' && <div style={{ marginBottom: 18 }}><Alert type="error">{err}</Alert></div>}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <FormField label={CONTENT.signup.form.labels.fullName}><Input type="text" required placeholder={CONTENT.signup.form.placeholders.fullName} value={fd.name} onChange={e => setFd({ ...fd, name: e.target.value })} /></FormField>
              <FormField label={CONTENT.signup.form.labels.email}><Input type="email" required placeholder={CONTENT.signup.form.placeholders.email} value={fd.email} onChange={e => setFd({ ...fd, email: e.target.value })} /></FormField>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted-ink)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={11} />{CONTENT.signup.form.labels.jobInterest}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {CONTENT.signup.form.domainOptions.map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setFd({ ...fd, domain: v })} style={{ padding: '11px', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, background: fd.domain === v ? 'var(--primary-soft)' : 'var(--paper2)', color: fd.domain === v ? 'var(--primary)' : 'var(--muted-ink)', border: `1.25px solid ${fd.domain === v ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.22s' }}>{l}</button>
                  ))}
                </div>
              </div>
              <FormField label={CONTENT.signup.form.labels.currentCountry}>
                <Select required value={fd.location} onChange={e => setFd({ ...fd, location: e.target.value })}>
                  <option value="" disabled>{CONTENT.signup.form.countryPlaceholder}</option>
                  {COUNTRIES.map((c, i) => <option key={i} value={c} disabled={c.startsWith('---')}>{c}</option>)}
                </Select>
              </FormField>
              <Button loading={status === 'loading'} style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }}>
                <Sparkles size={14} />{CONTENT.signup.form.submitCta}
              </Button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.875rem', color: 'var(--subtle-ink)' }}>{CONTENT.signup.form.adminPrompt} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>{CONTENT.signup.form.adminLoginCta}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
