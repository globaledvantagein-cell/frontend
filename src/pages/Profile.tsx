import { useEffect, useState } from 'react';
import { LogOut, Mail, User as UserIcon, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Container, Badge } from '../components/ui';
import { BRAND } from '../theme/brand';

interface ProfileData {
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string | null;
  createdAt?: string;
  acceptedTermsAt?: string | null;
}

/**
 * Profile page — currently a stub.
 *
 * Visible only when VITE_ENABLE_PROFILE=true. We'll add features here
 * incrementally (saved jobs, email preferences, application history).
 * The feature flag in App.tsx removes both the route and any nav link.
 */
export default function Profile() {
  const { user, logout, isAdmin } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Profile · ${BRAND.appName}`;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </Container>
    );
  }

  const display = profile || (user as ProfileData);
  if (!display) return null;

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

      {/* Identity card */}
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
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              flexShrink: 0,
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
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Mail size={12} /> {display.email}
          </p>
          {display.createdAt && (
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Calendar size={12} /> Joined {formatDate(display.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Coming-soon sections */}
      <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
        {[
          { title: 'Saved jobs', body: 'Bookmark roles to come back to them later.' },
          { title: 'Email preferences', body: 'Control your weekly job-alert digest and notifications.' },
          { title: 'Application history', body: 'Track which roles you’ve applied to.' },
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