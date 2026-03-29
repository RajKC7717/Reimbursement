import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as logoutApi } from '../api/authApi';
import { getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore
    }
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <h1>
            <span className="logo-icon">💰</span>
            ReimburseQ
          </h1>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="link-icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="link-icon">💳</span> Expenses
          </NavLink>
          <NavLink to="/expenses/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="link-icon">➕</span> New Expense
          </NavLink>

          {isAdmin && (
            <>
              <div className="sidebar-section-label">Admin</div>
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="link-icon">👥</span> Users
              </NavLink>
              <NavLink to="/rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="link-icon">📋</span> Approval Rules
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="link-icon">🏷️</span> Categories
              </NavLink>
            </>
          )}

          <div className="sidebar-section-label">Account</div>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="link-icon">👤</span> Profile
          </NavLink>
          <div className="sidebar-link" onClick={handleLogout} role="button" tabIndex={0}>
            <span className="link-icon">🚪</span> Logout
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

      {/* Main Content */}
      <main className="app-main">
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
