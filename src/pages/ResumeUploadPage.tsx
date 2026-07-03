/**
 * /resume — Upload your resume page.
 * Parses via Gemini, saves parsedProfile + hash to user doc.
 * After success, links to profile page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Container, Button, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';

type Status = 'idle' | 'uploading' | 'success' | 'error';

export default function ResumeUploadPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = `Upload Resume · ${BRAND.appName}`; }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!token) return;
    setFileName(file.name);
    setStatus('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/auth/upload-resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  if (authLoading) return null;

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '80vh' }}>
      <Container style={{ maxWidth: 600, padding: '40px 24px 60px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          SMART MATCH
        </p>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,3.5vw,1.8rem)', color: 'var(--text-primary)', marginBottom: 8 }}>
          Upload your resume
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 28 }}>
          We'll parse your skills, experience, and preferences to match you with the best roles in Germany.
        </p>

        {status === 'success' ? (
          <div style={{
            border: '1px solid var(--success)', borderRadius: 12,
            background: 'var(--bg-surface)', padding: '32px 24px', textAlign: 'center',
          }}>
            <CheckCircle size={40} style={{ color: 'var(--success)', marginBottom: 12 }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Resume parsed successfully
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
              Your profile has been updated. You can now run Smart Match.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/profile"><Button variant="ghost" size="sm">View Profile</Button></Link>
              <Link to="/smart-match"><Button size="sm">Run Smart Match →</Button></Link>
            </div>
          </div>
        ) : (
          <>
            {error && <Alert type="error" style={{ marginBottom: 16 }}>{error}</Alert>}

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12, padding: '48px 24px', textAlign: 'center',
                cursor: status === 'uploading' ? 'wait' : 'pointer',
                background: dragOver ? 'var(--bg-surface-2)' : 'var(--bg-surface)',
                transition: 'all 0.2s',
                opacity: status === 'uploading' ? 0.6 : 1,
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />

              {status === 'uploading' ? (
                <>
                  <FileText size={32} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Parsing {fileName}…
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    This takes a few seconds
                  </p>
                </>
              ) : (
                <>
                  <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Drop your resume here, or click to browse
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    PDF · up to 10 MB
                  </p>
                </>
              )}
            </div>

            {status === 'error' && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <AlertCircle size={14} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Having trouble? Try a different PDF or paste your resume text on the{' '}
                  <Link to="/smart-match" style={{ color: 'var(--primary)' }}>Smart Match</Link> page.
                </span>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}