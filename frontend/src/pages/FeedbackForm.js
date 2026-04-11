import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StudentNavbar from '../components/StudentNavbar';
import StarRating from '../components/StarRating';
import { getSubjects, submitFeedback } from '../api';
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";

const QUESTIONS = [
  'How well does the faculty explain concepts?',
  "How is the faculty's subject knowledge?",
  'How interactive are the classes?',
  'How well does the faculty clear doubts?',
  'How punctual is the faculty?',
  'Is the teaching speed comfortable for you',
  'Are you satisfied with the teaching overall'
];
const YEARS = ['E1','E2','E3','E4'];
const SEMESTERS = ['Sem1','Sem2'];
const CAMPUSES = ['RK Valley','Ongole'];
const BRANCHES = ['CSE','AI/ML','ECE','EEE','CIVIL','MECH','CHEMICAL','MME'];
const TOTAL_FIELDS = QUESTIONS.length + 1; 
// +1 because faculty selection is also required
const makeEntry = (subject) => ({
  subjectId: subject._id,
  subjectName: subject.subject,
  faculty: subject.facultyList[0]?.facultyId || '', // optional: pre-select first faculty
  ratings: Array(QUESTIONS.length).fill(0),
  improvement: ''
});

export default function FeedbackForm() {
  const { user } = useAuth();
  const rollNo = user?.email?.split('@')[0] || '';
  const [filters, setFilters] = useState({ year:'', semester:'', branch:'', campus:'' });
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allFilled = filters.year && filters.semester && filters.branch && filters.campus;
  const setFilter = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!allFilled) { setSubjects([]); setEntries([]); return; }
    setLoadingSubjects(true);
    getSubjects(filters)
      .then((res) => { setSubjects(res.data); setEntries(res.data.map(makeEntry)); })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoadingSubjects(false));
  }, [filters.year, filters.semester, filters.branch, filters.campus]);

  const updateEntry = (idx, field, value) =>
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  const updateRating = (eIdx, qIdx, val) =>
    setEntries(prev => prev.map((e, i) => {
      if (i !== eIdx) return e;
      const ratings = [...e.ratings]; ratings[qIdx] = val;
      return { ...e, ratings };
    }));

 const entryProgress = (entry) => {
  let s = 0;
  if (entry.faculty) s++;
  s += entry.ratings.filter((r) => r > 0).length;
  return s;
};
  const handleSubmit = async () => {
  for (const entry of entries) {
    if (!entry.faculty) {
      return toast.error(`Select faculty for "${entry.subjectName}"`);
    }

    if (entry.ratings.some((r) => r === 0)) {
      return toast.error(
        `Complete all ratings for "${entry.subjectName}"`
      );
    }
  }

  setSubmitting(true);

  try {
    await submitFeedback({ ...filters, entries });
    setSubmitted(true);
    toast.success('Feedback submitted successfully!');
  } catch (err) {
    toast.error(
      err.response?.data?.message || 'Submission failed'
    );
  } finally {
    setSubmitting(false);
  }
};

  if (submitted) return (
    <>
      <StudentNavbar />
      <div className="page" style={{ textAlign:'center', paddingTop:'5rem' }}>
        <div style={{ fontSize:'5rem', marginBottom:'1.5rem' }}>🎉</div>
        <h2 style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>Feedback Submitted!</h2>
        <p style={{ color:'var(--text-muted)', marginBottom:'2rem' }}>Thank you for your valuable feedback.</p>
        <Link to="/dashboard" className="btn btn-primary">
  ← Back to Dashboard
</Link>
      </div>
    </>
  );

  const completedCount = entries.filter(
  (e) => entryProgress(e) === TOTAL_FIELDS
).length;


  return (
    <>
      <StudentNavbar />
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">📝 Submit Feedback</div>
            <div className="page-subtitle">Rate your faculty for the current semester</div>
          </div>
          {entries.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontSize:'0.9rem', color:'var(--text-muted)' }}>{completedCount}/{entries.length} completed</span>
              <div style={{ width:120, height:8, background:'#e5e7eb', borderRadius:99 }}>
                <div style={{ width:`${(completedCount/entries.length)*100}%`, height:'100%', background:'var(--success)', borderRadius:99, transition:'width 0.4s' }} />
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom:'1.75rem' }}>
          <div className="card-title">Step 1 — Select Your Details</div>
          <div className="filter-row">
            <div className="form-group" style={{ minWidth:140 }}>
              <label>Student ID</label>
              <input className="form-control" value={rollNo.toUpperCase()} disabled />
            </div>
            {[{field:'year',label:'Year',opts:YEARS},{field:'semester',label:'Semester',opts:SEMESTERS},{field:'campus',label:'Campus',opts:CAMPUSES},{field:'branch',label:'Branch',opts:BRANCHES}].map(({field,label,opts}) => (
              <div className="form-group" key={field} style={{ minWidth:120 }}>
                <label>{label}</label>
                <select className="form-control" value={filters[field]} onChange={setFilter(field)}>
                  <option value="">Select {label}</option>
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          {!allFilled && <div style={{ color:'var(--text-muted)', fontSize:'0.875rem', marginTop:'0.5rem' }}>ℹ️ Please select all fields above to load subjects.</div>}
        </div>

        {loadingSubjects && <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>⏳ Loading subjects...</div>}
        {!loadingSubjects && allFilled && subjects.length === 0 && (
          <div className="card empty-state"><div className="empty-icon">📭</div><h3>No subjects found</h3><p>No subjects configured for this combination. Contact admin.</p></div>
        )}

        {!loadingSubjects && entries.length > 0 && (
          <>
            <div style={{ marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div className="page-subtitle" style={{ margin:0 }}>Step 2 — Rate Each Subject</div>
              <span className="badge badge-blue">{subjects.length} subjects</span>
            </div>
            <div className="subjects-grid">
              {entries.map((entry, eIdx) => {
                const subject = subjects[eIdx] || {};
                const isComplete = entryProgress(entry) === TOTAL_FIELDS;
                return (
                  <div key={eIdx} className={`subject-card ${isComplete ? 'completed' : ''}`}>
                    <div className="subject-card-header">
                      <div className="subject-name-wrap">
                        <div className="subject-number">{eIdx+1}</div>
                        <div>
                          <div className="subject-name">{entry.subjectName}</div>
                        </div>
                      </div>
                      {isComplete ? <span className="completed-badge">✓ Complete</span> : <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{entryProgress(entry)}/{TOTAL_FIELDS}</span>}
                    </div>
                    <div className="form-group">
                      <label>👨‍🏫 Select Faculty</label>
                      <select className="form-control" value={entry.faculty} onChange={(e) => updateEntry(eIdx,'faculty',e.target.value)}>
                        <option value="">-- Select Faculty --</option>
                        {subject.facultyList?.map((f) => (
                          <option key={f.facultyId} value={f.facultyId || f.name}>{f.name}({f.facultyId})</option>
                        ))}
                      </select>
                    </div>
                    <div className="rating-section">
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                        ⭐ Rate Each Criterion (1 = Poor, 5 = Excellent)
                      </div>
                      {QUESTIONS.map((question, qIdx) => (
                        <div className="rating-row" key={qIdx}>
                          <span className="rating-label"><strong>{qIdx+1}.</strong> {question}</span>
                          <StarRating value={entry.ratings[qIdx]} onChange={(val) => updateRating(eIdx,qIdx,val)} />
                        </div>
                      ))}
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
  <label>💬 Suggestions for Improvement (Optional)</label>

  <textarea
    className="form-control"
    rows={3}
    placeholder="Optional: Share any suggestions to improve teaching..."
    value={entry.improvement}
    onChange={(e) =>
      updateEntry(eIdx, 'improvement', e.target.value)
    }
  />

  <div
    style={{
      display: 'flex',
      justifyContent: 'flex-end',
      fontSize: '0.78rem',
      marginTop: '0.25rem'
    }}
  >
    <span style={{ color: 'var(--text-muted)' }}>
      {entry.improvement.length} chars
    </span>
  </div>
</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:'2rem', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'1rem' }}>
              {completedCount < entries.length && <span style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>{entries.length - completedCount} subject(s) still incomplete</span>}
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ padding:'0.875rem 2rem', fontSize:'1rem' }}>
                {submitting ? 'Submitting...' : `Submit All ${entries.length} Feedbacks →`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
