import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../services/api';
import { getStoredProfile } from '../features/auth/hooks/useAuth';
import { Book, FileText, Pencil, Menu, X, LogOut, BrainCircuit } from 'lucide-react';

export function StaffLayout() {
  const navigate = useNavigate();
  const profile = getStoredProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    clearToken();
    localStorage.removeItem('erp_staff_profile');
    navigate('/login');
  }

  // Close mobile nav on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('app-mobile-nav-active');
    } else {
      document.body.classList.remove('app-mobile-nav-active');
    }
    return () => {
      document.body.classList.remove('app-mobile-nav-active');
    };
  }, [mobileMenuOpen]);

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
        <div className="app-header-left">
          <NavLink to="/staff/paper-builder" className="app-brand-link">
            <div className="app-brand">
              <span className="app-logo">📄</span>
              <span>Paper Builder</span>
            </div>
          </NavLink>
        </div>

        {/* Desktop Navigation */}
        <div className="app-header-right app-desktop-only">
          <NavLink to="/staff/question-bank">
            {({ isActive }) => (
              <span className={`sp-tab ${isActive ? 'active' : ''}`}>
                <Book size={15} /> Question Bank
              </span>
            )}
          </NavLink>
          <NavLink to="/staff/paper-builder" end>
            {({ isActive }) => (
              <span className={`sp-tab ${isActive ? 'active' : ''}`}>
                <FileText size={15} /> My Papers
              </span>
            )}
          </NavLink>
          <NavLink to="/staff/paper-builder/new">
            {({ isActive }) => (
              <span className={`sp-tab sp-tab-save ${isActive ? 'active' : ''}`}>
                <Pencil size={15} />New Paper
              </span>
            )}
          </NavLink>
          <NavLink to="/staff/bloom-generator">
            {({ isActive }) => (
              <span className={`sp-tab ${isActive ? 'active' : ''}`}>
                <BrainCircuit size={15} /> AI Exams
              </span>
            )}
          </NavLink>
          <div className="app-user-block">
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
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="app-mobile-nav-toggle app-mobile-only"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile Navigation Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="app-mobile-nav-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Sidebar Drawer */}
      <aside className={`app-mobile-nav-drawer ${mobileMenuOpen ? 'is-open' : ''}`}>
        <div className="app-mobile-nav-header">
          <div className="app-brand">
            <span className="app-logo">📄</span>
            <span>Paper Builder</span>
          </div>
          <button
            type="button"
            className="app-mobile-nav-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {profile && (
          <div className="app-mobile-profile-card">
            <span className="user-avatar">{initials}</span>
            <div className="app-mobile-profile-info">
              <strong>{profile.fullName}</strong>
              <span className="user-role">{profile.role}</span>
            </div>
          </div>
        )}

        <nav className="app-mobile-nav-links">
          <NavLink
            to="/staff/paper-builder"
            end
            className={({ isActive }) => `app-mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={18} />
            <span>My Papers</span>
          </NavLink>
          <NavLink
            to="/staff/paper-builder/new"
            className={({ isActive }) => `app-mobile-nav-link sp-new-paper-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Pencil size={18} />
            <span>New Paper</span>
          </NavLink>
          <NavLink
            to="/staff/question-bank"
            className={({ isActive }) => `app-mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Book size={18} />
            <span>Question Bank</span>
          </NavLink>
          <NavLink
            to="/staff/bloom-generator"
            className={({ isActive }) => `app-mobile-nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BrainCircuit size={18} />
            <span>AI Exams</span>
          </NavLink>
        </nav>

        <div className="app-mobile-nav-footer">
          <button
            type="button"
            className="app-mobile-logout-btn"
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}