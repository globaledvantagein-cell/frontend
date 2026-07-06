import { Link } from 'react-router-dom';

const linkStyle: React.CSSProperties = {
  fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.18s',
};
const sep: React.CSSProperties = { color: 'var(--border-strong)', fontSize: '0.7rem', userSelect: 'none' };

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', padding: '10px 24px' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '6px 16px',
      }}>
        <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', opacity: 0.7 }}>
          © 2026 English Jobs in Germany
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/legal?tab=privacy" style={linkStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >Privacy</Link>
          <span style={sep}>·</span>
          <Link to="/legal?tab=terms" style={linkStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >Terms</Link>
          <span style={sep}>·</span>
          <a href="mailto:support@englishjobsgermany.com" style={linkStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >Contact</a>
        </div>
      </div>
    </footer>
  );
}