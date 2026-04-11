import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/feedback', icon: '📋', label: 'View Feedback' },
  { to: '/admin/subjects', icon: '📚', label: 'Manage Subjects' },
  { to: '/admin/export', icon: '📤', label: 'Export Feedback' },
];

export default function AdminSidebar() {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">🎓</div>
        <h2>FFS Admin</h2>
        <p>Faculty Feedback System</p>
      </div>
      <div className="sidebar-section">Navigation</div>
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <span>{link.icon}</span>{link.label}
        </NavLink>
      ))}
      <div className="sidebar-logout">
        <div className="sidebar-section">Account</div>
        <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.78rem', color: '#475569' }}>{user?.email}</div>
        <span className="sidebar-link logout-link" onClick={() => { logoutUser(); navigate('/login'); }}>
          Logout
        </span>
      </div>
    </div>
  );
}