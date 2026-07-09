/**
 * /smart-match — AI-ranked job recommendations.
 *
 * If user has a stored parsedProfile (from /resume upload), shows a
 * one-click "Find my matches" button. Otherwise prompts to upload first.
 * Falls back to text paste for users without a PDF.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Upload, RotateCcw } from 'lucide-react';
import { Container, PageHeader, Badge, Button, Alert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/jobApi';
import MatchProgress from '../components/MatchProgress';
import ParsedProfileCard from '../components/ParsedProfileCard';
import MatchResults from '../components/MatchResults';
import {
  matchResumeText,
  ResumeMatchError,
  type MatchResponse,
} from '../utils/resumeMatchApi';
import { BRAND } from '../theme/brand';

type Status = 'idle' | 'loading' | 'done' | 'error';

function toUiError(err: unknown): { message: string } {
  if (err instanceof ResumeMatchError) {
    if (err.code === 'RATE_LIMITED' || err.status === 429) return { message: 'Service is busy. Try again in a minute.' };
    if (err.status === 401 || err.status === 403) return { message: 'Session expired. Please sign in again.' };
    return { message: err.message || 'Something went wrong.' };
  }
  return { message: 'Network error — could not reach the server.' };
}

export default function SmartMatch() {
  const { token, isLoading: authLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { document.title = `Smart Match · ${BRAND.appName}`; }, []);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Check if user has a stored profile + load cached results
  useEffect(() => {
    if (authLoading || !token) return;
    apiGet<{ parsedProfile?: unknown }>('/api/auth/me')
      .then(data => setHasProfile(!!data?.parsedProfile))
      .catch(() => setHasProfile(false));

    // Try loading cached Smart Match results
    apiGet<{ success: boolean; results?: MatchResponse['results']; meta?: MatchResponse['meta']; cached?: boolean }>('/api/jobs/admin/resume-match')
      .then(data => {
        if (data?.success && data.results && data.results.length > 0) {
          setResult({ results: data.results, meta: data.meta } as MatchResponse);
          setStatus('done');
        }
      })
      .catch(() => { /* no cache, that's fine */ });
  }, [token, authLoading]);

  const runMatch = async (payload?: { text: string }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      let data: MatchResponse;
      if (payload?.text) {
        data = await matchResumeText(payload.text);
      } else {
        // Use stored profile — send empty request, backend reads from user doc
        data = await matchResumeText('USE_STORED_PROFILE');
      }
      if (!controller.signal.aborted) {
        setResult(data);
        setStatus('done');
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(toUiError(err));
        setStatus('error');
      }
    }
  };

  const handleRunMatch = () => runMatch();
  const handlePasteMatch = () => {
    if (pasteText.trim().length < 50) return;
    runMatch({ text: pasteText });
  };
  const handleReset = () => { setStatus('idle'); setResult(null); setError(null); };

  if (authLoading || hasProfile === null) {
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
          title="Smart Match"
          subtitle="AI-ranked jobs matched to your skills, experience, and preferences."
          actions={<Badge variant="primary">Premium</Badge>}
        />

        {status === 'loading' && <MatchProgress />}

        {status === 'error' && (
          <div style={{ marginBottom: 16 }}>
            <Alert type="error">{error?.message}</Alert>
            <Button variant="ghost" size="sm" onClick={handleReset} style={{ marginTop: 8 }}>
              <RotateCcw size={14} /> Try again
            </Button>
          </div>
        )}

        {status === 'done' && result && (
          <>
            <ParsedProfileCard profile={result.profile} />
            <div style={{ marginTop: 16 }}>
              <MatchResults data={result} />
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw size={14} /> Run again
              </Button>
            </div>
          </>
        )}

        {status === 'idle' && (
          <>
            {hasProfile ? (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 12,
                background: 'var(--bg-surface)', padding: '32px 24px', textAlign: 'center',
              }}>
                <Sparkles size={32} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Your profile is ready
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                  We'll match your skills and experience against {'>'}2,000 English-speaking roles in Germany.
                </p>
                <Button onClick={handleRunMatch}>
                  <Sparkles size={16} /> Find my matches
                </Button>
                <p style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Resume changed?{' '}
                  <Link to="/resume" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    Re-upload
                  </Link>
                </p>
              </div>
            ) : (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 12,
                background: 'var(--bg-surface)', padding: '32px 24px', textAlign: 'center',
              }}>
                <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Upload your resume first
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                  We need your resume to find matching jobs. Upload once — it's saved to your profile.
                </p>
                <Link to="/resume"><Button><Upload size={16} /> Upload Resume</Button></Link>
                <p style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  or{' '}
                  <button onClick={() => setPasteMode(true)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>
                    paste your resume text
                  </button>
                </p>
              </div>
            )}

            {pasteMode && !hasProfile && (
              <div style={{ marginTop: 16 }}>
                <textarea
                  value={pasteText} onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste the full text of your resume here..."
                  style={{
                    width: '100%', minHeight: 160, padding: 14, borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg-surface)',
                    color: 'var(--text-primary)', fontSize: '0.88rem', resize: 'vertical',
                  }}
                />
                <Button size="sm" onClick={handlePasteMatch} style={{ marginTop: 8 }}>
                  <Sparkles size={14} /> Match from text
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}