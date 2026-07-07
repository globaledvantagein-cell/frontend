/**
 * "Jobs matching your skills" — a compact horizontal card row.
 * Renders above the filters on the Browse Jobs page.
 *
 * Edge cases:
 *  - Not authenticated → hidden (don't render at all)
 *  - No parsedProfile  → prompt to upload resume
 *  - Profile but no skills → prompt to add skills on profile page
 *  - No matching jobs   → small note, not intrusive
 *  - < 5 matches        → show however many exist
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Upload, Wrench } from 'lucide-react';
import {  Button } from './ui';
import { useAuth } from '../context/AuthContext';
import { fetchSkillMatches, type SkillMatchJob } from '../utils/skillMatchApi';
import { getDisplayLocation } from '../utils/job';

export default function SkillMatches() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<SkillMatchJob[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setLoading(false); return; }

    fetchSkillMatches()
      .then(data => {
        setMatches(data.matches);
        setReason(data.meta.reason);
      })
      .catch(() => setReason('error'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  // Don't render anything for unauthenticated users
  if (!isAuthenticated || authLoading) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="skeleton" style={{ height: 100, borderRadius: 10 }} />
      </div>
    );
  }

  // No profile → prompt to upload resume
  if (reason === 'no_profile') {
    return (
      <Prompt
        icon={<Upload size={16} />}
        text="Upload your resume to see jobs matching your skills."
        linkTo="/resume"
        linkLabel="Upload Resume"
      />
    );
  }

  // Profile exists but no skills → prompt to add skills
  if (reason === 'no_skills') {
    return (
      <Prompt
        icon={<Wrench size={16} />}
        text="Add skills to your profile to see matched jobs."
        linkTo="/profile"
        linkLabel="Add Skills"
      />
    );
  }

  // No matches found
  if (reason === 'no_matches' || matches.length === 0) return null;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, padding: '0 2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Jobs matching your skills
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div style={{
        display: 'flex', gap: 10, overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'thin',
      }}>
        {matches.map(job => (
          <div
            key={job._id}
            onClick={() => navigate(`/jobs/${job._id}`)}
            style={{
              minWidth: 220, maxWidth: 260, flex: '0 0 auto',
              border: '1px solid var(--border)', borderRadius: 8,
              background: 'var(--bg-surface)', padding: '10px 12px',
              cursor: 'pointer', transition: 'border-color 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <p style={{
              fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)',
              lineHeight: 1.3, marginBottom: 4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {job.JobTitle}
            </p>
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {job.Company} · {getDisplayLocation(job as any)}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {job.matchedSkills.slice(0, 4).map(skill => (
                <span key={skill} style={{
                  fontSize: '0.65rem', padding: '1px 5px', borderRadius: 4,
                  background: 'var(--acid-soft)', color: 'var(--acid)',
                  border: '1px solid var(--acid)',
                  fontWeight: 600,
                }}>
                  {skill}
                </span>
              ))}
              {job.matchedSkills.length > 4 && (
                <span style={{
                  fontSize: '0.65rem', padding: '1px 5px', borderRadius: 4,
                  color: 'var(--text-muted)',
                }}>
                  +{job.matchedSkills.length - 4}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Prompt component for no-profile / no-skills states ─────────────────────
function Prompt({ icon, text, linkTo, linkLabel }: {
  icon: React.ReactNode; text: string; linkTo: string; linkLabel: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 8,
      border: '1px dashed var(--border)', borderRadius: 8,
      background: 'var(--bg-surface)', padding: '10px 14px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{text}</span>
      </div>
      <Link to={linkTo}>
        <Button size="sm" variant="ghost">{linkLabel}</Button>
      </Link>
    </div>
  );
}