/**
 * Displays the AI-parsed resume profile on the Profile page.
 * Shows summary, skills with categories, work experience with responsibilities
 * and tech tags, education, and projects — similar to JobMesh's profile view.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Briefcase, GraduationCap, FolderOpen, Wrench } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { apiGet } from '../../utils/jobApi';

interface ParsedProfile {
  name?: string;
  email?: string;
  summary?: string;
  experience?: { company: string; title: string; startDate: string | null; endDate: string | null; isCurrent: boolean; responsibilities: string[]; technologies: string[] }[];
  education?: { institution: string; degree: string; field: string; endDate: string | null }[];
  skills?: { name: string; category: string }[];
  projects?: { name: string; description: string; technologies: string[] }[];
  total_experience_years?: number | null;
  seniority_level?: string | null;
  domain?: string;
  sub_domain?: string | null;
  languages?: { language: string; proficiency: string }[];
  location?: string | null;
}

export default function ParsedResumeProfile() {
  const [profile, setProfile] = useState<ParsedProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ parsedProfile?: ParsedProfile }>('/api/auth/me')
      .then(data => setProfile(data?.parsedProfile || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 14 }} />;

  if (!profile) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <FileText size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No resume uploaded yet</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>Upload your resume to see your parsed profile and use Smart Match.</p>
          <Link to="/resume"><Button size="sm"><Upload size={14} /> Upload Resume</Button></Link>
        </div>
      </Card>
    );
  }

  const skills = profile.skills || [];
  const experience = profile.experience || [];
  const education = profile.education || [];
  const projects = profile.projects || [];
  const languages = profile.languages || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header + Summary */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Parsed Resume</h3>
            {profile.name && <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{profile.name}</p>}
          </div>
          <Link to="/resume"><Button variant="ghost" size="sm"><Upload size={12} /> Re-upload</Button></Link>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {profile.seniority_level && <Badge variant="primary">{profile.seniority_level}</Badge>}
          {profile.domain && <Badge variant="blue">{profile.domain}</Badge>}
          {profile.sub_domain && <Badge variant="neutral">{profile.sub_domain}</Badge>}
          {profile.total_experience_years != null && <Badge variant="neutral">{profile.total_experience_years} yr{profile.total_experience_years !== 1 ? 's' : ''}</Badge>}
        </div>
        {profile.summary && <p style={{ marginTop: 12, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{profile.summary}</p>}
        {(profile.location || languages.length > 0) && (
          <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {profile.location}{profile.location && languages.length > 0 ? ' · ' : ''}{languages.map(l => `${l.language} (${l.proficiency})`).join(' · ')}
          </p>
        )}
      </Card>

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Wrench size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Skills</h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((s, i) => (
              <Badge key={`${s.name}-${i}`} variant="neutral">{s.name}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Briefcase size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Work Experience</h4>
          </div>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < experience.length - 1 ? 18 : 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{exp.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 6px' }}>
                {exp.company} · {exp.startDate || '?'} – {exp.endDate || '?'}
              </p>
              {exp.responsibilities.length > 0 && (
                <ul style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {exp.responsibilities.map((r, j) => <li key={j} style={{ marginBottom: 3 }}>{r}</li>)}
                </ul>
              )}
              {exp.technologies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {exp.technologies.map((t, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <GraduationCap size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Education</h4>
          </div>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: i < education.length - 1 ? 10 : 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0 }}>{edu.institution}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {[edu.degree, edu.field].filter(Boolean).join(' in ')}{edu.endDate ? ` · ${edu.endDate}` : ''}
              </p>
            </div>
          ))}
        </Card>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <FolderOpen size={15} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Projects</h4>
          </div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: i < projects.length - 1 ? 10 : 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)', margin: 0 }}>{p.name}</p>
              {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 4px' }}>{p.description}</p>}
              {p.technologies.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {p.technologies.map((t, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}