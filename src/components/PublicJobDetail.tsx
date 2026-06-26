import { useState } from 'react';
import { ExternalLink, MapPin, Share2, Check } from 'lucide-react';
import type { IJob } from '../types';
import FormattedDescription from './FormattedDescription';
import { formatPostedDate } from '../utils/date';
import { parseAllLocations, isMeaningful, normalizeWorkplace, detailedSalary, getDisplayLocation } from '../utils/job';
import { Badge, Button } from './ui';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../utils/jobApi';

interface Props {
  job: IJob;
  /** Patches the in-memory list when applyClicks changes */
  onApplyTracked?: (jobId: string, applyClicks: number) => void;
  /** Called when an unauthenticated user clicks Apply — show the SignupGate */
  onAuthRequired?: () => void;
}

export default function PublicJobDetail({ job, onApplyTracked, onAuthRequired }: Props) {
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();

  const shareUrl = `${window.location.origin}/jobs/${job._id}`;

  const handleShare = async () => {
    const shareData = { title: `${job.JobTitle} at ${job.Company}`, url: shareUrl };
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch { /* user cancelled or unsupported — fall through to clipboard */ }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* rare clipboard failure — silent */ }
  };

  const allLocations = parseAllLocations(job);
  const primaryLocation = getDisplayLocation(job);
  const extraLocations = allLocations.slice(1);
  const salary = detailedSalary(job);
  const normalizedWorkplace = normalizeWorkplace(job.WorkplaceType);
  const showWorkplaceBadge = normalizedWorkplace === 'Remote' || normalizedWorkplace === 'Hybrid';

  // Apply requires auth — even if the user is under the view limit,
  // applying is the highest-value action and is always gated.
  const applyTarget = job.DirectApplyURL || job.ApplicationURL;

  const handleApplyClick = () => {
    // Track the click in the background — don't block navigation
    apiPost<{ applyClicks: number }>(`/api/jobs/${job._id}/apply-click`, {})
      .then(result => onApplyTracked?.(job._id, result.applyClicks ?? 0))
      .catch(console.error);
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
            {isAuthenticated ? (
              <Button as="a" href={applyTarget} target="_blank" rel="noopener noreferrer" size="sm" onClick={handleApplyClick}>
                Apply Now <ExternalLink size={12} />
              </Button>
            ) : (
              <Button size="sm" onClick={() => onAuthRequired?.()}>
                Sign in to apply <ExternalLink size={12} />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleShare}>
              {copied ? <><Check size={12} /> Copied!</> : <><Share2 size={12} /> Share</>}
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