import { Link } from 'react-router-dom';

interface Props {
  links: ReadonlyArray<readonly [string, string]>;
  isActive: (path: string) => boolean;
  unreadFeedback: number;
}

const linkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: '0.88rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  textDecoration: 'none',
  padding: '5px 0',
  position: 'relative',
  transition: 'color 0.18s',
});

function NavLink({
  path, label, active, badge,
}: { path: string; label: string; active: boolean; badge?: number }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start' }}>
      <Link
        to={path}
        style={linkStyle(active)}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {label}
        {active && <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--acid)', borderRadius: 2 }} />}
      </Link>
      {badge != null && badge > 0 && (
        <span style={{
          background: 'var(--danger)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700,
          padding: '1px 5px', borderRadius: 8,
          marginLeft: -4, position: 'relative', top: -8,
        }}>
          {badge}
        </span>
      )}
    </div>
  );
}

export default function DesktopNav({ links, isActive, unreadFeedback }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      {links.map(([path, label]) => (
        <NavLink
          key={path}
          path={path}
          label={label}
          active={isActive(path)}
          badge={path === '/feedback' ? unreadFeedback : undefined}
        />
      ))}
    </div>
  );
}
