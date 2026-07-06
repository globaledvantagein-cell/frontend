/**
 * Single card in the Dashboard's job list.
 * Memoized — re-renders only when the job, selection state, or callback change.
 */
import { forwardRef, memo } from 'react';
import type { IJob } from '../../types';
import { Badge } from '../ui';
import { compactSalary, getDisplayLocation, normalizeWorkplace } from '../../utils/job';
import { relativeDate } from '../../utils/date';

interface DesktopProps {
  job: IJob;
  selected: boolean;
  applied?: boolean;
  onClick: () => void;
}

export const DesktopJobCard = memo(
  forwardRef<HTMLButtonElement, DesktopProps>(function DesktopJobCard({ job, selected, applied, onClick }, ref) {
    const salary = compactSalary(job);
    const wp = normalizeWorkplace(job.WorkplaceType);
    const showWp = wp === 'Remote' || wp === 'Hybrid';

    return (
      <button
        ref={ref}
        onClick={onClick}
        style={{
          border:     selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
          borderRadius: 8, padding: '10px 10px',
          textAlign: 'left', cursor: 'pointer', width: '100%',
        }}
      >
        <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {job.JobTitle}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Company} | {getDisplayLocation(job)}
        </p>
        {(showWp || salary || applied) && (
          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
            {applied && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>✓ Applied</Badge>}
            {showWp && <Badge variant="blue"  style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{wp}</Badge>}
            {salary && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{salary}</Badge>}
          </div>
        )}
      </button>
    );
  })
);

interface MobileProps {
  job: IJob;
  applied?: boolean;
  onClick: () => void;
}

export const MobileJobCard = memo(function MobileJobCard({ job, applied, onClick }: MobileProps) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'var(--bg-surface)', padding: '14px 12px',
        textAlign: 'left', width: '100%',
      }}
    >
      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{job.JobTitle}</p>
      <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{job.Company} · {getDisplayLocation(job)}</p>
      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 3 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>
      {applied && <Badge variant="green" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: 6 }}>✓ Applied</Badge>}
    </button>
  );
});