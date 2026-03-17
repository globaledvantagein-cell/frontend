import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import Footer from './Footer';
import FeedbackWidget from './FeedbackWidget';
import { Button, Badge } from './ui';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Layout() {
  const loc = useLocation();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { mode, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [unreadFeedback, setUnreadFeedback] = useState(0);
  const isMobileNav = useMediaQuery('(max-width: 767px)');

  const hideFeedbackWidget = isAdmin || loc.pathname.startsWith('/admin');

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeDrawer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, isMobileNav]);


  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  useEffect(() => {
    if (!isAdmin) return;

    fetch('/api/feedback/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(response => response.json())
      .then(data => setUnreadFeedback(data?.unread || 0))
      .catch(() => {});
  }, [isAdmin, loc.pathname]);

  function closeDrawer() {
    if (!drawerOpen) return;
    setDrawerClosing(true);
    setTimeout(() => {
      setDrawerOpen(false);
      setDrawerClosing(false);
    }, 200);
  }

  function openDrawer() {
    setDrawerOpen(true);
    setDrawerClosing(false);
  }

  const active = (path: string) => loc.pathname === path;

  const navLinkStyle = (path: string): React.CSSProperties => ({
    fontSize: '0.88rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: active(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
    textDecoration: 'none',
    padding: '5px 0',
    position: 'relative',
    transition: 'color 0.18s',
  });

  const NavLink = ({ path, label }: { path: string; label: string }) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start' }}>
      <Link
        to={path}
        onClick={closeDrawer}
        style={navLinkStyle(path)}
        onMouseEnter={e => { if (!active(path)) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { if (!active(path)) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      >
        {label}
        {active(path) && (
          <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--acid)', borderRadius: 2 }} />
        )}
      </Link>
      {path === '/feedback' && unreadFeedback > 0 && (
        <span style={{
          background: 'var(--danger)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700,
          padding: '1px 5px', borderRadius: 8,
          marginLeft: -4, position: 'relative', top: -8,
        }}>
          {unreadFeedback}
        </span>
      )}
    </div>
  );

  const DrawerNavLink = ({ path, label }: { path: string; label: string }) => (
    <Link
      to={path}
      onClick={closeDrawer}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '13px 20px',
        fontSize: '1rem',
        fontWeight: 600,
        color: active(path) ? 'var(--acid)' : 'var(--text-primary)',
        textDecoration: 'none',
        borderLeft: active(path) ? '3px solid var(--acid)' : '3px solid transparent',
        background: active(path) ? 'var(--acid-soft)' : 'transparent',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </Link>
  );

  const adminLinks: [string, string][] = [
    ['/dashboard', 'Dashboard'],
    ['/review', 'Review'],
    ['/test-logs', 'Test Logs'],
    ['/admin/companies', 'Directory'],
    ['/add', 'Add Job'],
    ['/rejected', 'Trash'],
    ['/feedback', 'Feedback'],
  ];
  const publicLinks: [string, string][] = [
    ['/directory', 'Companies'],
    ['/jobs', 'Browse Jobs'],
  ];
  const links = isAdmin ? adminLinks : publicLinks;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        className="nav-blur"
        style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border)' }}
        aria-label="Main navigation"
      >
        <div
          style={{
            maxWidth: 1600,
            margin: '0 auto',
            padding: '0 clamp(16px, 3vw, 24px)',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link
            to={isAdmin ? '/dashboard' : '/'}
            style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}
            aria-label="English Jobs in Germany home"
          >
            <img
              src="/logo.jpeg"
              alt="English Jobs in Germany"
              style={{ height: isMobileNav ? 28 : 32, width: 'auto', display: 'block', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobileNav ? '0.95rem' : '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                English <span style={{ color: 'var(--primary)' }}>Jobs</span>
              </span>
              {!isMobileNav && (
                <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>in Germany</span>
              )}
              {isAdmin && (
                <span style={{ fontSize: '0.58rem', fontWeight: 700, background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.05em', alignSelf: 'flex-start', marginTop: 2 }}>ADMIN</span>
              )}
            </div>
          </Link>

          {/* Desktop nav links */}
          {!isMobileNav && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {links.map(([path, label]) => <NavLink key={path} path={path} label={label} />)}
            </div>
          )}

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
              className="no-touch-expand"
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: '1px solid var(--border-mid)', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.18s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--acid)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--acid)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-mid)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            >
              {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Desktop: user info / auth buttons */}
            {!isMobileNav && isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} /> {user?.name}
                  {isAdmin && <Badge variant="red" style={{ fontSize: '0.58rem', padding: '2px 6px' }}>ADMIN</Badge>}
                </span>
                <button
                  onClick={logout}
                  className="no-touch-expand"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s', fontFamily: 'inherit', fontWeight: 600 }}
                  onMouseEnter={e => ((e.currentTarget.style.color = 'var(--danger)'))}
                  onMouseLeave={e => ((e.currentTarget.style.color = 'var(--text-muted)'))}
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>
            )}
            {!isMobileNav && !isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
                <Link to="/signup"><Button size="sm">Get alerts</Button></Link>
              </div>
            )}

            {/* Mobile hamburger */}
            {isMobileNav && (
              <button
                onClick={drawerOpen ? closeDrawer : openDrawer}
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
                className="no-touch-expand"
                style={{
                  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                  cursor: 'pointer', color: 'var(--text-primary)',
                }}
              >
                {drawerOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile slide-in drawer */}
      {drawerOpen && (
        <>
          <div
            className="nav-drawer-overlay"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            className={`nav-drawer${drawerClosing ? ' closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/logo.jpeg" alt="English Jobs in Germany" style={{ height: 26, width: 'auto', display: 'block' }} />
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  English <span style={{ color: 'var(--primary)' }}>Jobs</span>
                </span>
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="no-touch-expand"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, overflowY: 'auto' }} aria-label="Mobile navigation">
              {links.map(([path, label]) => <DrawerNavLink key={path} path={path} label={label} />)}
            </nav>

            {/* User info / auth at bottom */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', flexShrink: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} /> {user?.name}
                    {isAdmin && <Badge variant="red" style={{ fontSize: '0.58rem', padding: '2px 6px' }}>ADMIN</Badge>}
                  </span>
                  <button
                    onClick={() => { logout(); closeDrawer(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.9rem', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/login" onClick={closeDrawer} style={{ flex: 1 }}>
                    <Button variant="ghost" size="sm" style={{ width: '100%', justifyContent: 'center' }}>Log in</Button>
                  </Link>
                  <Link to="/signup" onClick={closeDrawer} style={{ flex: 1 }}>
                    <Button size="sm" style={{ width: '100%', justifyContent: 'center' }}>Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <main
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        role="main"
      >
        <Outlet />
      </main>
        <Footer />
      {!hideFeedbackWidget && <FeedbackWidget />}
    </div>
  );
}
