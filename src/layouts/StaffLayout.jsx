import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../services/api';
import { getStoredProfile } from '../features/auth/hooks/useAuth';
import { Book } from 'lucide-react';

export function StaffLayout() {
  const navigate = useNavigate();
  const profile = getStoredProfile();

  function handleLogout() {
    clearToken();
    localStorage.removeItem('erp_staff_profile');
    navigate('/login');
  }

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
    : '?';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="app-brand">
            <span className="app-logo"><Book size={20} /></span> Question Bank
          </span>
          <nav className="app-nav">
            <NavLink
              to="/staff/question-bank"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Questions
            </NavLink>
            <NavLink
              to="/staff/exams"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Exams
            </NavLink>
            <NavLink
              to="/staff/paper-builder"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Paper Builder
            </NavLink>
          </nav>
        </div>
        <div className="app-header-right">
          {profile && (
            <div className="user-chip">
              <span className="user-avatar">{initials}</span>
              <span>
                <strong>{profile.fullName}</strong>
                <div className="user-role">{profile.role}</div>
              </span>
            </div>
          )}
          <button className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}