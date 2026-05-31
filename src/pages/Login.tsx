import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle, Mail, Globe, Check } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';

/**
 * Single auth page for everyone.
 *
 * No email/password. No separate signup. Google sign-in only.
 * First-time users are created on the backend; returning users are
 * recognized by their Google email. Admin status is set in the DB
 * directly — no admin signup form exists.
 *
 * Optional weekly-digest opt-in lives BELOW the title as a slim row.
 * When ticked, a small category picker appears inline. The Google
 * button is the visual focal point (full-width via ResizeObserver
 * measurement inside GoogleAuthButton).
 */

const CATEGORY_OPTIONS = [
  ...CONTENT.signup.form.categoryOptions.Tech,
  ...CONTENT.signup.form.categoryOptions['Non-Tech'],
];

export default function Login() {
  const nav = useNavigate();
  const [wantsDigest, setWantsDigest] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    );
  };

  const TRUST = [
    { icon: <CheckCircle size={14} />, text: 'No German required — verified listings' },
    { icon: <Mail size={14} />, text: 'Optional weekly job alerts to your inbox' },
    { icon: <Globe size={14} />, text: 'Full access to every English-speaking role' },
  ];

  // Pass subscription data to GoogleAuthButton via extra body fields
  const extraAuthBody = wantsDigest && selectedCategories.length > 0
    ? { subscribeToDigest: true, desiredCategories: selectedCategories }
    : {};

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
              padding: '32px 28px',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div style={{ marginBottom: 22, textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                  marginBottom: 5,
                  lineHeight: 1.2,
                }}
              >
                Sign in to {BRAND.appName}
              </h2>
              <p style={{ color: 'var(--subtle-ink)', fontSize: '0.875rem', margin: 0 }}>
                One-click access — new and returning users
              </p>
            </div>

            {/* ── Google Sign-In (primary CTA) ──────────────────────── */}
            <GoogleAuthButton
              onSuccess={() => nav('/jobs')}
              text="continue_with"
              extraBody={extraAuthBody}
            />

            {/* ── Subtle divider ────────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '20px 0 16px',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--subtle-ink)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Optional
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* ── Subscribe row — slim, expands inline when ticked ───── */}
            <label
              htmlFor="digest-toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: wantsDigest ? 'var(--acid-soft, rgba(5,150,105,0.08))' : 'transparent',
                border: `1.25px solid ${wantsDigest ? 'var(--acid, #059669)' : 'var(--border)'}`,
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                userSelect: 'none',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: `1.5px solid ${wantsDigest ? 'var(--acid, #059669)' : 'var(--border-strong, var(--subtle-ink))'}`,
                  background: wantsDigest ? 'var(--acid, #059669)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.18s ease',
                }}
              >
                {wantsDigest && <Check size={12} color="#fff" strokeWidth={3.5} />}
              </span>
              <input
                id="digest-toggle"
                type="checkbox"
                checked={wantsDigest}
                onChange={e => setWantsDigest(e.target.checked)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500, lineHeight: 1.35 }}>
                Send me weekly job alerts
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted-ink)', fontWeight: 400, marginTop: 2 }}>
                  Curated digest every Monday
                </span>
              </span>
            </label>

            {/* Categories — appear when subscribe is ticked */}
            {wantsDigest && (
              <div
                className="anim-fade-in"
                style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  background: 'var(--paper2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--muted-ink)',
                    margin: '0 0 8px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Choose your interests
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORY_OPTIONS.map(opt => {
                    const isOn = selectedCategories.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleCategory(opt.value)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '5px 10px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          borderRadius: 7,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          border: isOn
                            ? '1.25px solid var(--acid, #059669)'
                            : '1.25px solid var(--border)',
                          background: isOn
                            ? 'var(--acid-soft, rgba(5,150,105,0.12))'
                            : 'var(--surface-solid, #fff)',
                          color: isOn
                            ? 'var(--acid, #059669)'
                            : 'var(--muted-ink)',
                        }}
                      >
                        {isOn && <Check size={10} strokeWidth={3} />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {selectedCategories.length === 0 && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--subtle-ink)', marginTop: 8, margin: '8px 0 0', fontStyle: 'italic' }}>
                    Pick at least one to activate the digest
                  </p>
                )}
              </div>
            )}

            {/* ── Alternative path ──────────────────────────────────── */}
            <p
              style={{
                textAlign: 'center',
                marginTop: 22,
                marginBottom: 0,
                fontSize: '0.8rem',
                color: 'var(--subtle-ink)',
              }}
            >
              Just want emails without an account?{' '}
              <a
                onClick={() => nav('/alerts')}
                style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}
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