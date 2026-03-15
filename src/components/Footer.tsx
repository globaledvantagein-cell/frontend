import { Link } from 'react-router-dom';
import { Divider } from './ui';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Footer() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const wrapperPadding = isMobile ? '32px 16px' : '48px 24px 28px';
  const gridTemplateColumns = isMobile ? '1fr' : '1.4fr 1fr';
  const gridGap = isMobile ? 0 : 40;
  const sectionMargin = isMobile ? 28 : 0;
  const headingStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 14px' };

  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: wrapperPadding }}>
        <div style={{ display: 'grid', gridTemplateColumns, gap: gridGap, alignItems: 'start' }}>
          <div style={{ marginBottom: sectionMargin }}>
            <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none', marginBottom: 12, lineHeight: 1 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                English <span style={{ color: 'var(--primary)' }}>Jobs</span>
              </span>
              <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>
                IN GERMANY
              </span>
            </Link>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 320, margin: 0 }}>
              English Jobs in Germany is an independent platform highlighting job opportunities in Germany where German is not required. We help international professionals discover roles and companies that offer English-speaking work environments.
            </p>
          </div>

          <div style={{ marginBottom: sectionMargin }}>
            <p style={{ ...headingStyle, marginBottom: 10 }}>Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to="/legal?tab=privacy"
                style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Privacy Policy
              </Link>
              <Link
                to="/legal?tab=terms"
                style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Terms of Use
              </Link>
            </div>

            <p style={{ ...headingStyle, marginTop: 20, marginBottom: 10 }}>Contact</p>
            <a
              href="mailto:support@englishjobsgermany.com"
              style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              support@englishjobsgermany.com
            </a>
          </div>
        </div>
        <Divider style={{ margin: '28px 0 16px' }} />
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6, margin: '0 auto 6px' }}>
          English Jobs in Germany is an independent platform highlighting roles where German is not required.
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', opacity: 0.5 }}>
          © 2026 English Jobs in DE
        </p>
      </div>
    </footer>
  );
}
