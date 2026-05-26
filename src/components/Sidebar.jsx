import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Library, Settings, LogOut, Users, ListChecks, Shield, Video, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}><Users size={24} color="var(--color-white)" /></div>
        <div style={styles.logoText}>
          <span style={styles.logoBrand}>eXp</span> Syndicate
        </div>
      </div>

      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {currentUser?.role === 'admin' ? (
            <li>
              <NavLink 
                to="/admin" 
                style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
              >
                <Shield size={20} />
                <span>Admin Panel</span>
              </NavLink>
            </li>
          ) : (
            <>
              <li>
                <NavLink 
                  to="/" 
                  style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
                >
                  <Home size={20} />
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/checklist" 
                  style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
                >
                  <ListChecks size={20} />
                  <span>Playbook</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/resources" 
                  style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
                >
                  <Library size={20} />
                  <span>Resource Board</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/community" 
                  style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
                >
                  <Video size={20} />
                  <span>Training Feed</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/calendar" 
                  style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
                >
                  <Calendar size={20} />
                  <span>Calendar</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div style={styles.footer}>
        <ul style={styles.navList}>
          <li>
            <NavLink 
              to="/settings" 
              style={({ isActive }) => isActive ? { ...styles.navLink, ...styles.navLinkActive } : styles.navLink}
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </li>
          <li>
            <a href="#" onClick={handleLogout} style={{ ...styles.navLink, color: 'var(--color-moss-grey)' }}>
              <LogOut size={20} />
              <span>Sign Out</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    backgroundColor: 'var(--color-dark-navy)',
    color: 'var(--color-white)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 1.5rem',
    zIndex: 100,
    boxShadow: 'var(--shadow-lg)'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '3rem',
    paddingLeft: '0.5rem',
  },
  logoIcon: {
    backgroundColor: 'var(--color-slate-blue)',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--color-white)',
    letterSpacing: '0.5px'
  },
  logoBrand: {
    color: '#00A1E0',
  },
  nav: {
    flexGrow: 1,
  },
  navList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--color-frosted-blue)',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  navLinkActive: {
    backgroundColor: 'var(--color-slate-blue)',
    color: 'var(--color-white)',
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '1rem',
  }
};

export default Sidebar;
