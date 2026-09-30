import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, BookOpen, Bookmark, LayoutDashboard, User, LogOut, LogIn, Award } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { bookmarkCount } = useBookmarks();
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <GraduationCap size={28} />
          <span>SkillHub</span>
        </Link>

        <nav>
          <ul className="navbar-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <BookOpen size={18} />
                <span>Courses</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/bookmarks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Bookmark size={18} />
                <span>Bookmarks</span>
                {bookmarkCount > 0 && <span className="badge">{bookmarkCount}</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            {user && user.isLoggedIn && (
              <li>
                <NavLink to="/certificates" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Award size={18} />
                  <span>Certificates</span>
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <User size={18} />
                <span>My Account</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="user-menu">
          {user && user.isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Link to="/profile" className="user-avatar-btn" title="View Account">
                <div className="avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user.name || 'Account'}</span>
              </Link>
              <button 
                onClick={logout} 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
