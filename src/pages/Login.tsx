import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle, Mail, Globe } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { BRAND } from '../theme/brand';

/**
 * Single auth page for everyone.
 *
 * No email/password. No separate signup. Google sign-in only.
 * First-time users are created on the backend; returning users are
 * recognized by their Google email. Admin status is set in the DB
 * directly — no admin signup form exists.
 */
export default function Login() {
  const nav = useNavigate();

  const TRUST = [
    { icon: <CheckCircle size={14} />, text: 'No German required — verified listings' },
    { icon: <Mail size={14} />, text: 'Optional weekly job alerts to your inbox' },
    { icon: <Globe size={14} />, text: 'Full access to every English-speaking role' },
  ];

  return (
    <div style={{ minHeight: '90vh', display: 'flex', background: 'var(--paper)' }}>
      {/* Brand panel (desktop) */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
          background: 'var(--paper2)',
          borderRight: '1.25px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 360, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'var(--primary-soft)',
              border: '1.25px solid var(--primary)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              margin: '0 auto 24px',
            }}
          >
            <Briefcase size={24} />
          </div>
          <h2
            style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            Welcome
          </h2>
          <p style={{ color: 'var(--muted-ink)', marginBottom: 36, lineHeight: 1.65, fontSize: '0.95rem' }}>
            {BRAND.description}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {TRUST.map((t, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-ink)', fontSize: '0.875rem' }}
              >
                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{t.icon}</span>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="anim-scale" style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile brand header */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 46,
                height: 46,
                background: 'var(--primary-soft)',
                border: '1.25px solid var(--primary)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                margin: '0 auto 14px',
              }}
            >
              <Briefcase size={20} />
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-solid)',
              border: '1.25px solid var(--border)',
              borderRadius: 18,
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                  marginBottom: 6,
                }}
              >
                Sign in to {BRAND.appName}
              </h2>
              <p style={{ color: 'var(--subtle-ink)', fontSize: '0.9rem' }}>
                One-click access — new and returning users.
              </p>
            </div>

            <GoogleAuthButton onSuccess={() => nav('/jobs')} text="continue_with" />

            <p
              style={{
                textAlign: 'center',
                marginTop: 22,
                fontSize: '0.82rem',
                color: 'var(--subtle-ink)',
              }}
            >
              Just want weekly job alerts?{' '}
              <a
                onClick={() => nav('/alerts')}
                style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
              >
                Get email updates
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}