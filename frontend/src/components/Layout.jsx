import { useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as logoutApi } from '../api/authApi';
import { getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    // Nav shrink effect on scroll
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: 'top -40',
        onUpdate: (self) => {
          if (self.scroll() > 40) {
            gsap.to(headerRef.current, {
              height: '56px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 20px rgba(5,46,22,0.08)',
              duration: 0.3,
              ease: 'power2.out'
            });
          } else {
            gsap.to(headerRef.current, {
              height: '72px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              boxShadow: 'none',
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        }
      });

      // Page Enter Animation Wrap
      gsap.fromTo(mainRef.current, 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleLogout = async () => {
    try { await logoutApi(); } catch (e) {}
    logout();
    toast.success('Logged out securely');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="app-layout">
      {/* Background SVG Grid */}
      <svg className="bg-grid" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22C55E" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      {/* Background Glowing Orb overlay top right */}
      <svg style={{position:'absolute', top:'-150px', right:'-100px', opacity:0.3, pointerEvents:'none', filter:'blur(80px)'}} width="600" height="600" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="250" fill="url(#orb-grad)"/>
        <defs>
          <radialGradient id="orb-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22C55E"/>
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0"/>
          </radialGradient>
        </defs>
      </svg>

      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <h1><span className="logo-icon" style={{background: 'var(--text-primary)', color: 'var(--c-surface)'}}>R</span>ReimburseQ</h1>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
             Dashboard
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
             Expenses
          </NavLink>
          <NavLink to="/expenses/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
             New Expense
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                 Team
              </NavLink>
              <NavLink to="/rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                 Workflows
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                 Categories
              </NavLink>
            </>
          )}

          <div className="sidebar-section-label">Account</div>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
             Profile
          </NavLink>
          <div className="sidebar-link" onClick={handleLogout} role="button" tabIndex={0} style={{marginTop: 'auto'}}>
             Sign Out
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
             <div className="user-name">{user?.name}</div>
             <div className="user-role">{user?.role}</div>
          </div>
        </div>
      </aside>

      <main className="app-main">
        <header ref={headerRef} className="app-header">
           <div className="page-title"></div>
           <div className="header-actions">
              <span className="badge badge-draft" style={{padding:'6px 16px', letterSpacing:'0.02em', border:'1px solid var(--c-border)'}}>Workspace Enabled</span>
           </div>
        </header>
        <div className="app-content" ref={mainRef}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
