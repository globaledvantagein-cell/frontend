import { Briefcase, MapPin, GraduationCap, Languages, Wrench } from 'lucide-react';
import { Card, Badge } from './ui';
import type { ResumeProfile } from '../utils/resumeMatchApi';

interface Props {
  profile: ResumeProfile;
}

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--muted-ink)' }}>
      <span style={{ color: 'var(--subtle-ink)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: 'var(--ink)' }}>{children}</span>
    </div>
  );
}

export default function ParsedProfileCard({ profile }: Props) {
  const skills = profile.skills ?? [];
  const languages = profile.languages ?? [];

  const expLabel =
    profile.experience_years != null
      ? `${profile.experience_years} yr${profile.experience_years === 1 ? '' : 's'} experience`
      : 'Experience not specified';

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>
            {profile.name || 'Candidate'}
          </h2>
          {profile.current_role && (
            <p style={{ margin: '3px 0 0', fontSize: '0.9rem', color: 'var(--muted-ink)' }}>
              {profile.current_role}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {profile.level && <Badge variant="primary">{profile.level}</Badge>}
          {profile.domain && <Badge variant="blue">{profile.domain}</Badge>}
        </div>
      </div>

      {profile.summary && (
        <p style={{ margin: '14px 0 0', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary, var(--muted-ink))' }}>
          {profile.summary}
        </p>
      )}

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <MetaRow icon={<Briefcase size={15} />}>{expLabel}</MetaRow>
        {profile.location && <MetaRow icon={<MapPin size={15} />}>{profile.location}</MetaRow>}
        {profile.education && <MetaRow icon={<GraduationCap size={15} />}>{profile.education}</MetaRow>}
        {languages.length > 0 && (
          <MetaRow icon={<Languages size={15} />}>
            {languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}
          </MetaRow>
        )}
      </div>

      {skills.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Wrench size={14} style={{ color: 'var(--subtle-ink)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Skills
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((skill, i) => (
              <Badge key={`${skill}-${i}`} variant="neutral">{skill}</Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
