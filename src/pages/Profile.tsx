import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedJobs } from '../context/SavedJobsContext';
import { Button, Container, Badge, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { apiGet } from '../utils/jobApi';
import { CATEGORY_LABELS, type Category } from '../utils/categorize';
import IdentityCard from '../components/profile/IdentityCard';
import EmailPreferences from '../components/profile/EmailPreferences';
import JobPreferencesForm from '../components/profile/JobPreferencesForm';
import ParsedResumeProfile from '../components/profile/ParsedResumeProfile';
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

      {/* Parsed resume profile — experience, skills, education, projects */}
      <ParsedResumeProfile />

      {profile && (
        <EmailPreferences
          profile={profile}
          loadError={loadError}
          onProfileUpdated={setProfile}
        />
      )}

      {/* Job matching preferences — salary, work style, visa, etc. */}
      <JobPreferencesForm />

      {/* Saved jobs — bookmarked roles */}
      <SavedJobsList />

      {/* Coming-soon sections */}
      <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
        {[
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

// ── Saved jobs ───────────────────────────────────────────────────────────────
interface SavedEntry {
  jobId: string;
  savedAt: string | null;
  isActive: boolean;
  job: {
    JobTitle: string;
    Company: string;
    Location: string;
    Category?: string;
  };
}

function SavedJobsList() {
  const { savedVersion, toggleSave } = useSavedJobs();
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch whenever a bookmark is toggled anywhere in the app.
  useEffect(() => {
    apiGet<{ jobs: SavedEntry[] }>('/api/jobs/saved')
      .then(data => setEntries(data?.jobs || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [savedVersion]);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Saved jobs</h3>
        {!loading && entries.length > 0 && <Badge variant="neutral">{entries.length}</Badge>}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
      ) : entries.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 12, padding: 18 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No saved jobs yet. Tap the bookmark icon on any role to keep it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {entries.map(entry => (
            <div
              key={entry.jobId}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 14px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Link
                  to={`/jobs/${entry.jobId}`}
                  style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', wordBreak: 'break-word' }}
                >
                  {entry.job.JobTitle}
                </Link>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {entry.job.Company} · {entry.job.Location}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {entry.job.Category && CATEGORY_LABELS[entry.job.Category as Category] && (
                    <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {CATEGORY_LABELS[entry.job.Category as Category]}
                    </Badge>
                  )}
                  {!entry.isActive && (
                    <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>No longer listed</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void toggleSave(entry.jobId)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}