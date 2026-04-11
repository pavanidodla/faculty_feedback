import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentNavbar from '../components/StudentNavbar';
import { getMyFeedback } from '../api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const rollNo = user?.email?.split('@')[0]?.toUpperCase() || 'N/A';
  const campus = user?.email?.includes('rguktong') ? 'Ongole' : 'RK Valley';
  const [feedbackCount, setFeedbackCount] = useState(null);

  useEffect(() => {
    getMyFeedback().then((res) => setFeedbackCount(res.data.length)).catch(() => setFeedbackCount(0));
  }, []);

  return (
    <>
      <StudentNavbar />
      <div className="page">
        <div className="welcome-card">
          <h2>Welcome, {user?.name}! 👋</h2>
          <p>Your feedback helps improve teaching quality at RGUKT {campus} campus.</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem', position: 'relative', zIndex: 1 }}>
            <div className="roll-badge">🎓 {rollNo}</div>
            <div className="roll-badge">🏫 {campus}</div>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-value">{feedbackCount ?? '—'}</div><div className="stat-label">Feedback Submitted</div></div>
          <div className="stat-card"><div className="stat-icon">🏫</div><div className="stat-value">2</div><div className="stat-label">Campuses</div></div>
          <div className="stat-card"><div className="stat-icon">📚</div><div className="stat-value">8</div><div className="stat-label">Branches</div></div>
          <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-value">5</div><div className="stat-label">Rating Criteria</div></div>
        </div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/feedback" className="action-card">
            <div className="action-icon">📝</div>
            <h3>Submit Feedback</h3>
            <p>Rate your faculty for the current semester</p>
          </Link>
          <Link to="/my-feedback" className="action-card">
            <div className="action-icon">📋</div>
            <h3>View My Feedback</h3>
            <p>See all feedback you have submitted</p>
          </Link>
        </div>
        <div className="card" style={{ maxWidth: 640 }}>
          <div className="card-title">📌 How to Submit Feedback</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['1️⃣','Select your Year, Semester, Branch, and Campus'],['2️⃣','Subject cards appear automatically based on your selection'],['3️⃣','Choose the faculty for each subject'],['4️⃣','Rate faculty on 5 criteria using stars (1–5)'],['5️⃣','Provide specific improvement suggestions'],['6️⃣','Submit all feedback in one click']].map(([num, text]) => (
              <div key={num} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}><span>{num}</span><span>{text}</span></div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#f0f4ff', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--primary)' }}>
            ℹ️ Feedback is confidential. You can submit once per semester per combination.
          </div>
        </div>
      </div>
    </>
  );
}