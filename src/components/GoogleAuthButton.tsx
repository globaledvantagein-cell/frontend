import { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { Alert } from './ui';
import { useAuth } from '../context/AuthContext';

interface Props {
  /** Called after successful Google sign-in + JWT issuance */
  onSuccess?: () => void;
  /** Override the default error display */
  onError?: (message: string) => void;
  /** Visual size of the Google button */
  size?: 'medium' | 'large';
  /** Text on the Google button */
  text?: 'signin_with' | 'continue_with' | 'signup_with';
  /**
   * Extra fields to include in the POST /api/auth/google body.
   * Used by the Login page to pass subscribeToDigest + desiredCategories.
   */
  extraBody?: Record<string, unknown>;
}

// Google Identity Services button accepts a width between 200 and 400 px.
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/**
 * Shared Google sign-in widget.
 *
 * Terms acceptance is implicit: clicking the Google button = agreement.
 * The notice below the button serves as visible legal disclosure
 * ("browsewrap with notice"), the standard pattern used by Google,
 * Notion, Linear, etc.
 *
 * Backend records `acceptedTermsAt` on the FIRST successful sign-in for
 * a given email (audit trail). Returning users don't re-trigger this —
 * the timestamp is set once and never overwritten.
 *
 * The Google-rendered button has a fixed pixel width and won't auto-stretch.
 * We measure our container with ResizeObserver and feed that width back
 * into <GoogleLogin width={...}/> so the button always fills its slot
 * (clamped to GIS's 200–400 px range).
 */
export default function GoogleAuthButton({
  onSuccess,
  onError,
  size = 'large',
  text = 'continue_with',
  extraBody = {},
}: Props) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState<number>(MAX_WIDTH);

  // Track the container width and clamp it to GIS's accepted range so the
  // button fills its slot on every viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (w: number) => {
      const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.floor(w)));
      setButtonWidth(prev => (prev === clamped ? prev : clamped));
    };

    update(el.getBoundingClientRect().width);

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) update(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      // Always pass acceptedTerms=true — the user clicking this button
      // IS their agreement (the legal notice is visible below).
      // Also forward any extra fields (subscribeToDigest, desiredCategories).
      await loginWithGoogle(credentialResponse.credential, true, extraBody);
      onSuccess?.();
    } catch (err: any) {
      const message = err.message || 'Google sign-in failed';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {error && <Alert type="error">{error}</Alert>}

      <div
        ref={containerRef}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: loading ? 0.6 : 1,
          pointerEvents: loading ? 'none' : 'auto',
          transition: 'opacity 0.18s',
        }}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Google sign-in failed')}
          theme="outline"
          size={size}
          text={text}
          shape="rectangular"
          width={String(buttonWidth)}
          useOneTap={false}
        />
      </div>

      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted, var(--subtle-ink))',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        By continuing, you agree to our{' '}
        <Link
          to="/legal"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--primary, var(--acid))',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          Terms &amp; Privacy Policy
        </Link>
      </p>
    </div>
  );
}