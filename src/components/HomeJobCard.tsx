import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { IJob } from '../types';
import { Badge } from './ui';

interface HomeJobCardProps {
  job: IJob;
}

function relativeDate(value?: string | null) {
  if (!value) return 'Recently added';
  const posted = new Date(value);
  if (Number.isNaN(posted.getTime())) return 'Recently added';
  const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function getPrimaryLocation(job: IJob) {
  const allLocations = [
    ...String(job.Location || '').split(';').map(part => part.trim()).filter(Boolean),
    ...(job.AllLocations || []).map(part => String(part).trim()).filter(Boolean),
  ];

  return [...new Set(allLocations)][0] || 'Germany';
}

function compactSalary(job: IJob) {
  if (job.SalaryMin == null && job.SalaryMax == null) return null;
  const symbol = job.SalaryCurrency === 'EUR' ? '€' : job.SalaryCurrency === 'USD' ? '$' : '';
  const min = job.SalaryMin != null ? `${Math.round(job.SalaryMin / 1000)}K` : null;
  const max = job.SalaryMax != null ? `${Math.round(job.SalaryMax / 1000)}K` : null;

  if (min && max) return `${symbol}${min}-${max}`;
  if (min) return `${symbol}${min}+`;
  if (max) return `${symbol}${max}`;
  return null;
}

function getInitialColors(company: string) {
  const initial = (company.trim().charCodeAt(0) || 65) - 65;
  const hue = ((initial % 26) * 17 + 210) % 360;

  return {
    background: `hsla(${hue}, 78%, 55%, 0.14)`,
    border: `hsla(${hue}, 68%, 42%, 0.24)`,
    color: `hsl(${hue}, 68%, 40%)`,
  };
}

export default function HomeJobCard({ job }: HomeJobCardProps) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const destination = `/jobs?id=${job._id}`;
  const salary = compactSalary(job);
  const location = getPrimaryLocation(job);
  const initialColors = useMemo(() => getInitialColors(job.Company || 'J'), [job.Company]);

  const badges = [
    job.Domain && (job.Domain === 'Technical' || job.Domain === 'Non-Technical')
      ? { label: job.Domain, variant: job.Domain === 'Technical' ? 'blue' as const : 'neutral' as const }
      : null,
    job.ExperienceLevel && job.ExperienceLevel !== 'N/A'
      ? { label: job.ExperienceLevel, variant: 'neutral' as const }
      : null,
    job.WorkplaceType && job.WorkplaceType !== 'Unspecified'
      ? { label: job.WorkplaceType, variant: 'blue' as const }
      : null,
    salary
      ? { label: salary, variant: 'green' as const }
      : null,
  ].filter(Boolean).slice(0, 4) as Array<{ label: string; variant: 'blue' | 'neutral' | 'green' }>;

  const openJob = () => navigate(destination);

  const onCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openJob();
    }
  };

  const stopCardNavigation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${job.JobTitle} at ${job.Company}`}
      onClick={openJob}
      onKeyDown={onCardKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid',
        borderColor: hovered ? 'var(--primary)' : 'var(--border)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        cursor: 'pointer',
        transition: 'border-color 0.22s, transform 0.22s, box-shadow 0.22s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0, 0, 0, 0.08)' : 'none',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '999px',
          background: initialColors.background,
          border: `1px solid ${initialColors.border}`,
          color: initialColors.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: "'Playfair Display', serif",
          fontSize: '1rem',
          fontWeight: 700,
        }}
      >
        {(job.Company || 'J').charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, margin: 0, wordBreak: 'break-word' }}>
              {job.JobTitle}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              {job.Company} • {location} • {relativeDate(job.PostedDate || job.scrapedAt)}
            </p>
          </div>

          {job.ApplicationURL && (
            <a
              href={job.ApplicationURL}
              target="_blank"
              rel="noreferrer"
              onClick={stopCardNavigation}
              onMouseDown={stopCardNavigation}
              style={{
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                marginLeft: 'auto',
              }}
              aria-label={`Apply for ${job.JobTitle} at ${job.Company}`}
            >
              Apply <ArrowUpRight size={13} />
            </a>
          )}
        </div>

        {badges.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
            {badges.map(badge => (
              <Badge key={badge.label} variant={badge.variant} style={{ fontSize: '0.68rem', padding: '2px 8px', fontFamily: 'inherit', fontWeight: 600 }}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}