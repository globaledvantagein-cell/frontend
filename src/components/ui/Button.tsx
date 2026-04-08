import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline';

const BTN_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.01em',
  border: 'none', borderRadius: '10px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1,
  transition: 'all 0.22s cubic-bezier(0.2,0.8,0.2,1)',
  whiteSpace: 'nowrap',
};
const BTN_SIZE: Record<Size, CSSProperties> = {
  sm: { fontSize: '0.8rem', padding: '8px 16px' },
  md: { fontSize: '0.875rem', padding: '11px 22px' },
  lg: { fontSize: '0.95rem', padding: '14px 28px' },
};
const BTN_VARIANT: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--primary)', color: '#ffffff' },
  ghost: { background: 'transparent', color: 'var(--ink2)', border: '1.25px solid var(--ink-border-strong, var(--border-strong))' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1.25px solid var(--danger)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)', border: '1.25px solid var(--success)' },
  outline: { background: 'transparent', color: 'var(--ink)', border: '1.25px solid var(--ink-border-strong, var(--border-strong))' },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean; as?: 'button' | 'a'; href?: string; children: ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, children, style, as: Tag = 'button', href, className = '', ...rest }: ButtonProps & { className?: string }) {
  const sketchClass = (variant === 'ghost' || variant === 'outline') ? 'sketch-ink marker-hover' : '';
  const merged: CSSProperties = { ...BTN_BASE, ...BTN_SIZE[size], ...BTN_VARIANT[variant], ...(loading ? { opacity: 0.65, cursor: 'not-allowed' } : {}), ...style };
  if (Tag === 'a') return <a href={href} className={`${sketchClass} ${className}`} style={merged} {...(rest as any)}>{loading ? <Spinner size={14} /> : children}</a>;
  return <button disabled={loading || rest.disabled} className={`${sketchClass} ${className}`} style={merged} {...rest}>{loading ? <Spinner size={14} /> : children}</button>;
}
