import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Container, Badge, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { apiGet } from '../utils/jobApi';
import IdentityCard from '../components/profile/IdentityCard';
import EmailPreferences from '../components/profile/EmailPreferences';
import type { ProfileData } from '../components/profile/profileTypes';

/**
 * Profile page — visible only when VITE_ENABLE_PROFILE=true.
 * Identity card + email preferences + a couple of "soon" placeholders.
 */
export default function Profile() {
  const { user, logout, isAdmin, token, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { document.title = `Profile · ${BRAND.appName}`; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet<ProfileData>('/api/auth/me')
      .then(setProfile)
      .catch(err => {
        console.error('[Profile] /me fetch failed:', err);
        setLoadError('Could not load your latest preferences. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  if (authLoading || loading) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <Alert type="error">You are not signed in. Please log in to view your profile.</Alert>
      </Container>
    );
  }

  // Merge auth user (always available) with /me profile (richer fields).
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

      <IdentityCard data={display} isAdmin={isAdmin} />

      {profile && (
        <EmailPreferences
          profile={profile}
          loadError={loadError}
          onProfileUpdated={setProfile}
        />
      )}

      {/* Coming-soon sections */}
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

      <Button variant="ghost" onClick={logout}>
        <LogOut size={14} /> Sign out
      </Button>
    </Container>
  );
}
