import React, { useEffect, useState } from 'react';
import StudentNavbar from '../components/StudentNavbar';
import { getMyFeedback } from '../api';
import { toast } from 'react-toastify';

const Q_SHORT = ['Concept Explanation','Subject Knowledge','Interactivity','Doubt Clearing','Punctuality','Teaching Speed',
  'Satisfied teaching'];

function StarDisplay({ value }) {
  return <span>{[1,2,3,4,5].map((s) => <span key={s} style={{ color: s<=value?'#f59e0b':'#d1d5db', fontSize:'1rem' }}>★</span>)} <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{value}/5</span></span>;
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getMyFeedback().then((res) => { setFeedbacks(res.data); if (res.data.length > 0) setExpanded({ 0: true }); })
      .catch(() => toast.error('Failed to load feedback')).finally(() => setLoading(false));
  }, []);

  const toggle = (idx) => setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <><StudentNavbar />
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">📋 My Submitted Feedback</div><div className="page-subtitle">{feedbacks.length} record(s) found</div></div>
      </div>
      {loading ? <div className="loading" style={{ height:'40vh' }}>Loading...</div>
        : feedbacks.length === 0 ? (
          <div className="card empty-state"><div className="empty-icon">📭</div><h3>No feedback yet</h3><p>Submit feedback from the Feedback page.</p></div>
        ) : feedbacks.map((fb, idx) => (
          <div key={fb._id} className="card" style={{ marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' }} onClick={() => toggle(idx)}>
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
                <span className="badge badge-blue">{fb.year}</span>
                <span className="badge badge-blue">{fb.semester}</span>
                <strong>{fb.branch}</strong><span style={{ color:'var(--text-muted)' }}>|</span>
                <span>{fb.campus}</span>
                <span style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{fb.entries.length} subject(s)</span>
              </div>
              <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
                <span style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>{new Date(fb.submittedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                <span style={{ fontSize:'1.2rem', color:'var(--text-muted)' }}>{expanded[idx]?'▲':'▼'}</span>
              </div>
            </div>
            {expanded[idx] && (
              <div style={{ marginTop:'1.25rem' }}>
                {fb.entries.map((entry, ei) => (
                  <div key={ei} style={{ border:'1px solid var(--border)', borderRadius:'8px', padding:'1.25rem', marginBottom:'1rem', background:'#f9fafb' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
                      <div><div style={{ fontWeight:700 }}>{entry.subjectName}</div><div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Faculty: <strong>{entry.faculty}</strong></div></div>
                      <div style={{ textAlign:'right' }}><div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--primary)' }}>{entry.averageRating?.toFixed(1)}</div><div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>avg / 5</div></div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'0.5rem', marginBottom:'1rem' }}>
                      {entry.ratings.map((r, ri) => (
                        <div key={ri} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{Q_SHORT[ri]}</span>
                          <StarDisplay value={r} />
                        </div>
                      ))}
                    </div>
                    <div style={{ background:'white', borderRadius:'6px', padding:'0.75rem', border:'1px solid var(--border)', fontSize:'0.875rem' }}>
                      <span style={{ fontWeight:600, color:'var(--text-muted)', fontSize:'0.78rem', textTransform:'uppercase' }}>Improvement: </span>{entry.improvement}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </div></>
  );
}