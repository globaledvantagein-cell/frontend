import { useEffect, useState } from 'react';
import { LogOut, Mail, User as UserIcon, Calendar, Check, Bell, BellOff, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Container, Badge, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';

interface ProfileData {
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string | null;
  createdAt?: string;
  acceptedTermsAt?: string | null;
  isSubscribed?: boolean;
  desiredCategories?: string[];
  lastEmailSent?: string | null;
}

// Build a flat list of every category id → label, for rendering chips
const ALL_CATEGORIES: Array<{ value: string; label: string }> = [
  ...CONTENT.signup.form.categoryOptions.Tech.map(o => ({ ...o })),
  ...CONTENT.signup.form.categoryOptions['Non-Tech'].map(o => ({ ...o })),
];

/**
 * Profile page — visible only when VITE_ENABLE_PROFILE=true.
 *
 * Sections:
 *   1. Identity card (name, email, joined date)
 *   2. Email preferences — edit categories, unsubscribe/resubscribe
 *   3. Logout
 */
export default function Profile() {
  const { user, logout, isAdmin, token, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Local edit state for email preferences
  const [categories, setCategories] = useState<string[]>([]);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Profile · ${BRAND.appName}`;
  }, []);

  // Fetch profile and seed local edit state.
  // Wait for AuthContext to finish rehydrating from localStorage before
  // deciding whether we have a token — otherwise the first render sees
  // token=null and we incorrectly skip the fetch.
  useEffect(() => {
    if (authLoading) return; // wait for auth to settle

    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        setCategories(Array.isArray(data.desiredCategories) ? data.desiredCategories : []);
        setSubscribed(Boolean(data.isSubscribed));
      })
      .catch(err => {
        console.error('[Profile] /me fetch failed:', err);
        setLoadError('Could not load your latest preferences. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  const toggleCategory = (value: string) => {
    setCategories(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value],
    );
    setSaveMsg(null);
  };

  const dirty =
    profile &&
    (
      JSON.stringify([...categories].sort()) !== JSON.stringify([...(profile.desiredCategories || [])].sort()) ||
      subscribed !== Boolean(profile.isSubscribed)
    );

  const savePreferences = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          desiredCategories: categories,
          isSubscribed: subscribed,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      const updated: ProfileData = await res.json();
      setProfile(updated);
      setCategories(Array.isArray(updated.desiredCategories) ? updated.desiredCategories : []);
      setSubscribed(Boolean(updated.isSubscribed));
      setSaveMsg({ type: 'success', text: 'Preferences updated.' });
    } catch (e: any) {
      setSaveMsg({ type: 'error', text: e.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSubscription = async () => {
    if (!token) return;
    const next = !subscribed;
    setSubscribed(next);
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isSubscribed: next }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated: ProfileData = await res.json();
      setProfile(updated);
      setSubscribed(Boolean(updated.isSubscribed));
      setSaveMsg({
        type: 'success',
        text: next ? 'Subscribed to weekly digest.' : 'Unsubscribed. You will no longer receive weekly emails.',
      });
    } catch {
      // revert on failure
      setSubscribed(!next);
      setSaveMsg({ type: 'error', text: 'Could not update subscription.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </Container>
    );
  }

  // Identity always comes from the auth user (rehydrated from localStorage).
  // Extra fields (createdAt, isSubscribed, desiredCategories) come from /me.
  // Merging gives us a complete view even if /me fetch fails.
  if (!user) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <Alert type="error">You are not signed in. Please log in to view your profile.</Alert>
      </Container>
    );
  }

  const display: ProfileData = {
    email: profile?.email || user.email,
    name: profile?.name || user.name,
    role: (profile?.role || user.role) as 'user' | 'admin',
    avatarUrl: profile?.avatarUrl ?? user.avatarUrl ?? null,
    createdAt: profile?.createdAt,
    acceptedTermsAt: profile?.acceptedTermsAt,
    isSubscribed: profile?.isSubscribed,
    desiredCategories: profile?.desiredCategories,
    lastEmailSent: profile?.lastEmailSent,
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <Container style={{ padding: '40px 24px', maxWidth: 720 }}>
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
          color: 'var(--text-primary)',
          marginBottom: 6,
        }}
      >
        Your profile
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 28 }}>
        Manage your account on {BRAND.appName}.
      </p>

      {/* ── Identity card ─────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        {display.avatarUrl ? (
          <img
            src={display.avatarUrl}
            alt={display.name}
            referrerPolicy="no-referrer"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            <UserIcon size={26} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {display.name}
            </h2>
            {isAdmin && <Badge variant="red" style={{ fontSize: '0.6rem' }}>ADMIN</Badge>}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={12} /> {display.email}
          </p>
          {display.createdAt && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} /> Joined {formatDate(display.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* ── Email preferences ─────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 24,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Email preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Choose what kind of weekly job digest you receive.
            </p>
          </div>
          <Badge variant={subscribed ? 'green' : 'neutral'} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
            {subscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED'}
          </Badge>
        </div>

        {(saveMsg || loadError) && (
          <div style={{ marginBottom: 16 }}>
            {loadError && <Alert type="warning">{loadError}</Alert>}
            {saveMsg && <Alert type={saveMsg.type === 'success' ? 'success' : 'error'}>{saveMsg.text}</Alert>}
          </div>
        )}

        {/* Subscribe toggle */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            marginBottom: subscribed ? 18 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {subscribed
              ? <Bell size={16} style={{ color: 'var(--acid)' }} />
              : <BellOff size={16} style={{ color: 'var(--text-muted)' }} />
            }
            <div>
              <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Weekly digest
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {subscribed
                  ? 'You receive a weekly summary every Monday.'
                  : 'You are not receiving the weekly digest.'}
              </p>
            </div>
          </div>
          <Button
            variant={subscribed ? 'ghost' : undefined}
            size="sm"
            onClick={toggleSubscription}
            disabled={saving}
          >
            {subscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </div>

        {/* Categories — only relevant when subscribed */}
        {subscribed && (
          <>
            <p style={{
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
              marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Job categories
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {ALL_CATEGORIES.map(opt => {
                const isOn = categories.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleCategory(opt.value)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 12px',
                      fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                      borderRadius: 8, cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      border: isOn ? '1.25px solid var(--acid)' : '1.25px solid var(--border)',
                      background: isOn ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                      color: isOn ? 'var(--acid)' : 'var(--text-muted)',
                    }}
                  >
                    {isOn && <Check size={12} strokeWidth={3} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              onClick={savePreferences}
              disabled={!dirty || saving || categories.length === 0}
              loading={saving}
            >
              <Save size={13} /> Save changes
            </Button>
            {categories.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                Pick at least one category to save.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Coming-soon sections ──────────────────────────────────── */}
      <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
        {[
          { title: 'Saved jobs', body: 'Bookmark roles to come back to them later.' },
          { title: 'Application history', body: 'Track which roles you have applied to.' },
        ].map(section => (
          <div
            key={section.title}
            style={{
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {section.title}
              </h3>
              <Badge variant="neutral" style={{ fontSize: '0.62rem' }}>SOON</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{section.body}</p>
          </div>
        ))}
      </div>

      {/* Logout */}
      <Button variant="ghost" onClick={logout}>
        <LogOut size={14} /> Sign out
      </Button>
    </Container>
  );
}