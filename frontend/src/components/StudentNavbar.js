import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentNavbar() {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cls = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        <div className="logo-sm">🎓</div>
        <span>Faculty Feedback System</span>
      </Link>
      <div className="navbar-links">
        <Link to="/dashboard" className={cls('/dashboard')}>🏠 Home</Link>
        <Link to="/feedback" className={cls('/feedback')}>📝 Feedback</Link>
        <Link to="/my-feedback" className={cls('/my-feedback')}>📋 My Feedback</Link>
        <span className="nav-link logout" onClick={() => { logoutUser(); navigate('/login'); }}>🚪 Logout</span>
      </div>
    </nav>
  );
}