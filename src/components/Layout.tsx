import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, User, ShieldCheck, Menu, X, Sun, Moon, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { BRAND } from '../theme/brand';
import Footer from './Footer';
import { Button, Badge } from './ui';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Layout() {
  const loc = useLocation();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { mode, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const isMobileNav = useMediaQuery('(max-width: 767px)');

  const isDesktopSize = useMediaQuery('(min-width: 768px)');
  const isSplitRoute = loc.pathname === '/jobs' || loc.pathname === '/review';
  const isDesktopSplitRoute = isDesktopSize && isSplitRoute;

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeDrawer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname, isMobileNav]);

  useEffect(() => {
    document.body.classList.toggle('jobs-split-locked', isDesktopSplitRoute);
    return () => { document.body.classList.remove('jobs-split-locked'); };
  }, [isDesktopSplitRoute]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
        height: isDesktopSplitRoute ? '100vh' : undefined,
        display: 'flex',
        flexDirection: 'column',
        overflow: isDesktopSplitRoute ? 'hidden' : undefined,
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
            aria-label={`${BRAND.appName} home`}
          >
            <div
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: isAdmin ? 'var(--danger-dim)' : 'var(--acid-dim)',
                border: `1px solid ${isAdmin ? 'var(--danger)' : 'var(--acid-mid)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isAdmin ? <ShieldCheck size={14} color="var(--danger)" /> : <Zap size={14} color="var(--acid)" />}
            </div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {BRAND.appName.replace('Jobs', '')}<span style={{ color: 'var(--acid)' }}>Jobs</span>
            </span>
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
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {BRAND.appName.replace('Jobs', '')}<span style={{ color: 'var(--acid)' }}>Jobs</span>
              </span>
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
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: isDesktopSplitRoute ? 'hidden' : undefined }}
        role="main"
      >
        <Outlet />
      </main>
      {!isDesktopSplitRoute && <Footer />}
    </div>
  );
}
