import { useState } from 'react';
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
}

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
 * Used by: /login page and the SignupGate component.
 */
export default function GoogleAuthButton({
  onSuccess,
  onError,
  size = 'large',
  text = 'continue_with',
}: Props) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      // Always pass acceptedTerms=true — the user clicking this button
      // IS their agreement (the legal notice is visible below).
      await loginWithGoogle(credentialResponse.credential, true);
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
        style={{
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