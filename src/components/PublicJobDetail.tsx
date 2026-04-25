import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import type { IJob } from '../types';
import FormattedDescription from './FormattedDescription';
import { formatPostedDate } from '../utils/date';
import { parseAllLocations,isMeaningful, normalizeWorkplace, detailedSalary ,getDisplayLocation} from '../utils/job';
import { Badge, Button } from './ui';

interface Props {
  job: IJob;
  onTrackApplyClick: (jobId: string) => Promise<void>;
}

export default function PublicJobDetail({ job, onTrackApplyClick }: Props) {
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [trackingApply, setTrackingApply] = useState(false);

  const allLocations = parseAllLocations(job);
 const primaryLocation = getDisplayLocation(job);
  const extraLocations = allLocations.slice(1);
  const salary = detailedSalary(job);
  const normalizedWorkplace = normalizeWorkplace(job.WorkplaceType);
  const showWorkplaceBadge = normalizedWorkplace === 'Remote' || normalizedWorkplace === 'Hybrid';

  const handleApplyNow = async () => {
    window.open(job.ApplicationURL, '_blank', 'noopener,noreferrer');
    try {
      setTrackingApply(true);
      await onTrackApplyClick(job._id);
    } finally {
      setTrackingApply(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface-2)', padding: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', right: 14, top: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Posted: {formatPostedDate(job.PostedDate)}
        </span>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.2rem,2.6vw,1.55rem)', color: 'var(--text-primary)', marginBottom: 10, paddingRight: 80 }}>
          {job.JobTitle}
        </h2>

        <div className="flex items-center flex-wrap gap-2" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{job.Company}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} /> {primaryLocation}
          </span>
          {showWorkplaceBadge && <Badge variant="blue" style={{ fontSize: '0.7rem' }}>{normalizedWorkplace}</Badge>}
        </div>

        <div className="flex flex-wrap gap-2" style={{ marginBottom: 10 }}>
          {(job.Domain === 'Technical' || job.Domain === 'Non-Technical') && <Badge variant={job.Domain === 'Technical' ? 'green' : 'neutral'}>{job.Domain}</Badge>}
          {isMeaningful(job.ExperienceLevel) && job.ExperienceLevel !== 'N/A' && <Badge variant="neutral">{job.ExperienceLevel}</Badge>}
          {isMeaningful(job.EmploymentType) && <Badge variant="neutral">{job.EmploymentType}</Badge>}
        </div>

        {salary && (
          <p style={{ marginBottom: 8, fontSize: '0.96rem', fontWeight: 700, color: 'var(--success)' }}>
            {salary}
          </p>
        )}

        {extraLocations.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setShowAllLocations(previous => !previous)}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {showAllLocations ? 'Hide locations' : `${extraLocations.length + 1} locations`}
            </button>
            {showAllLocations && (
              <div className="flex flex-wrap gap-1.5" style={{ marginTop: 8 }}>
                {allLocations.map(location => (
                  <Badge key={location} variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{location}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginTop: 10 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleApplyNow} loading={trackingApply}>
                Apply Now <ExternalLink size={12} />
            </Button>
            {job.GermanRequired === false && <Badge variant="acid">🇬🇧 English Only</Badge>}
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {job.applyClicks || 0} apply clicks
          </span>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-surface)', padding: 14 }}>
        <FormattedDescription description={job.Description || ''} />
      </div>

    </div>
  );
}