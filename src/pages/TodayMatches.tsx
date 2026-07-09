/**
 * /today-matches — Daily skill-matched job recommendations.
 *
 * Pure programmatic matching — no AI, no API costs.
 * Compares the user's profile skills against parsedRequirements
 * on active jobs. Shows top 5 with matched/missing skill breakdown.
 *
 * Edge cases:
 *  - No parsedProfile → prompt to upload resume
 *  - Profile but no skills → prompt to add skills
 *  - No matching jobs → empty state
 *  - < 5 matches → show however many exist
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Upload, Wrench, Building2, MapPin, Check, RefreshCw } from 'lucide-react';
import { Container, PageHeader, Card, Badge, Button, EmptyState } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { fetchSkillMatches, type SkillMatchJob } from '../utils/skillMatchApi';
import { BRAND } from '../theme/brand';

type Status = 'loading' | 'done' | 'no_profile' | 'no_skills' | 'no_matches' | 'error';

export default function TodayMatches() {
  const { token, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [matches, setMatches] = useState<SkillMatchJob[]>([]);
  const [meta, setMeta] = useState<{ userSkillCount?: number; totalJobsScanned?: number }>({});

  useEffect(() => { document.title = `Today's Matches · ${BRAND.appName}`; }, []);

  const load = (refresh = false) => {
    setStatus('loading');
    fetchSkillMatches(refresh)
      .then(data => {
        setMatches(data.matches);
        setMeta(data.meta);
        setStatus(
          data.meta.reason === 'no_profile'     ? 'no_profile' :
          data.meta.reason === 'no_skills'      ? 'no_skills'  :
          data.meta.reason === 'too_few_skills' ? 'no_skills'  :
          data.meta.reason === 'cache_not_ready' ? 'error'     :
          data.matches.length === 0             ? 'no_matches' :
          'done'
        );
      })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    if (authLoading || !token) return;
    load();
  }, [token, authLoading]);

  if (authLoading) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </Container>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '80vh' }}>
      <Container style={{ maxWidth: 800, padding: '24px 24px 48px' }}>
        <PageHeader
          label="ENGLISH JOBS IN GERMANY"
          title="Today's Matches"
          subtitle="Jobs matching your profile skills — updated daily, no AI needed."
        />

        {status === 'loading' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 10 }} />
            ))}
          </div>
        )}

        {status === 'no_profile' && (
          <PromptCard
            icon={<Upload size={32} style={{ color: 'var(--text-muted)' }} />}
            title="Upload your resume first"
            body="We need your resume to extract skills and find matching jobs. Upload once — it's saved to your profile."
            linkTo="/resume"
            linkLabel="Upload Resume"
          />
        )}

        {status === 'no_skills' && (
          <PromptCard
            icon={<Wrench size={32} style={{ color: 'var(--text-muted)' }} />}
            title="Add skills to your profile"
            body="Your profile doesn't have enough skills yet. Add at least 3 skills so we can find meaningful matches."
            linkTo="/profile"
            linkLabel="Edit Skills"
          />
        )}

        {status === 'no_matches' && (
          <EmptyState
            icon={<Sparkles size={40} />}
            title="No matching jobs today"
            body="None of the active jobs match your current skills. Check back tomorrow or add more skills to your profile."
          />
        )}

        {status === 'error' && (
          <EmptyState
            icon={<Sparkles size={40} />}
            title="Something went wrong"
            body="Could not load matches. Please try again."
          />
        )}

        {status === 'done' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {matches.length} match{matches.length !== 1 ? 'es' : ''} from{' '}
                {meta.totalJobsScanned?.toLocaleString()} jobs · {meta.userSkillCount} skills in your profile
              </span>
              <Button variant="ghost" size="sm" onClick={() => load(true)}>
                <RefreshCw size={12} /> Refresh
              </Button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {matches.map(job => (
                <SkillMatchCard key={job._id} job={job} onClick={() => navigate(`/jobs/${job._id}`)} />
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

// ── Match Card ─────────────────────────────────────────────────────────────────
function SkillMatchCard({ job, onClick }: { job: SkillMatchJob; onClick: () => void }) {
  const pct = Math.round(job.score * 100);
  const accent = pct >= 60 ? 'var(--success)' : pct >= 35 ? 'var(--info)' : 'var(--warning)';

  return (
    <Card
      style={{ borderLeft: `3px solid ${accent}`, cursor: 'pointer', transition: 'border-color 0.18s' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Score */}
        <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 44 }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: accent, lineHeight: 1 }}>
            {pct}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            %
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {job.JobTitle}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {job.Company && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Building2 size={13} /> {job.Company}
              </span>
            )}
            {job.Location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {job.Location}
              </span>
            )}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {job.Category && <Badge variant="neutral">{job.Category.replace(/_/g, ' ')}</Badge>}
            {job.ExperienceLevel && <Badge variant="neutral">{job.ExperienceLevel}</Badge>}
            {job.WorkplaceType && <Badge variant="neutral">{job.WorkplaceType}</Badge>}
          </div>

          {/* Matched skills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
            <Check size={14} strokeWidth={3} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {job.matchedSkills.map(skill => (
                <span key={skill} style={{
                  fontSize: '0.74rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                  background: 'var(--acid-soft)', color: 'var(--acid)',
                  border: '1px solid var(--acid)',
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <p style={{ marginTop: 8, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {job.matchedCount} of {job.totalSkillCount} skills matched
          </p>
        </div>
      </div>
    </Card>
  );
}

// ── Prompt Card ────────────────────────────────────────────────────────────────
function PromptCard({ icon, title, body, linkTo, linkLabel }: {
  icon: React.ReactNode; title: string; body: string; linkTo: string; linkLabel: string;
}) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12,
      background: 'var(--bg-surface)', padding: '32px 24px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 12 }}>{icon}</div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
        {body}
      </p>
      <Link to={linkTo}><Button>{linkLabel}</Button></Link>
    </div>
  );
}