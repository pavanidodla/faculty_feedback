import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { getAdminSummary, getFacultyStats } from '../api';
import { toast } from 'react-toastify';

const BRANCHES   = ['CSE','AI/ML','ECE','EEE','CIVIL','MECH','CHEMICAL','MME'];
const YEARS      = ['E1','E2','E3','E4'];
const CAMPUSES   = ['RK Valley','Ongole'];
const BADGE_CLS  = { Excellent:'badge-excellent', Average:'badge-average', Poor:'badge-poor' };


/* ── Helpers ── */
function RatingBar({ value ,max=5}) {
  const color = value >= 4 ? '#10b981' : value >= 3 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
      <div style={{ flex:1, height:6, background:'#e5e7eb', borderRadius:99 }}>
        <div style={{ width:`${(value/max)*100}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.4s' }}/>
      </div>
      <span style={{ fontSize:'0.82rem', fontWeight:700, color, minWidth:32 }}>{value}/{max}</span>
    </div>
  );
}



/* ── Single Faculty Card ── */
function FacultyCard({ stat }) {
  const [open, setOpen] = useState(false);

  // Show name if it differs from ID (i.e. name was resolved)
  const hasName = stat.facultyName && stat.facultyName !== stat.facultyId;

  return (
    <div style={{ background:'white', borderRadius:12, border:'1px solid var(--border)', boxShadow:'var(--shadow)', overflow:'hidden', marginBottom:'1rem' }}>

      {/* ── Card Header ── */}
      <div style={{ background:'linear-gradient(135deg,#1a56db 0%,#0f172a 100%)', padding:'1.25rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          {/* Faculty Name (big) */}
          <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Faculty</div>
          <div style={{ fontSize:'1.2rem', fontWeight:800, color:'white', fontFamily:'Space Grotesk,sans-serif', lineHeight:1.2 }}>
            {hasName ? stat.facultyName : stat.facultyId}
          </div>
          {/* Faculty ID (smaller, below name) */}
          {hasName && (
            <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.55)', marginTop:3, fontFamily:'monospace', letterSpacing:'0.04em' }}>
              ID: {stat.facultyId}
            </div>
          )}
          <div style={{ marginTop:'0.5rem', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
            {stat.campuses.map(c => (
              <span key={c} style={{ background:'rgba(255,255,255,0.15)', color:'white', padding:'2px 8px', borderRadius:20, fontSize:'0.72rem', fontWeight:600 }}>
                🏫 {c}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2rem', fontWeight:800, color:'white', lineHeight:1 }}>{stat.overallAvg}</div>
            <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', marginTop:2 }}>Avg / 5</div>
          </div>
          <span className={`badge ${BADGE_CLS[stat.classification]}`} style={{ fontSize:'0.8rem' }}>
            {stat.classification}
          </span>
          
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:'white', lineHeight:1 }}>{stat.totalResponses}</div>
            <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', marginTop:2 }}>Responses</div>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div
  style={{
    padding: '1rem 1.5rem',
    background: '#f8faff',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    gap: '2rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  }}
>
  <div style={{ flex: 2, minWidth: 200 }}>
    <div
      style={{
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.4rem'
      }}
    >
      Overall Rating
    </div>
    <RatingBar value={stat.overallAvg} />
  </div>

  {stat.classification !== 'Excellent' && (
    <div>
      <div
        style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '0.4rem'
        }}
      >
        Weak Area
      </div>
      <div
        style={{
          fontSize: '0.82rem',
          color: 'var(--danger)',
          fontWeight: 600
        }}
      >
        ⚠ {stat.weakArea}
      </div>
    </div>
  )}
</div>

      {/* ── Per-criterion ratings ── */}
      <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' }}>Rating Breakdown</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'0.6rem' }}>
          {['Concept Explanation','Subject Knowledge','Interactivity','Doubt Clearing','Punctuality','Teaching Speed',
  'Satisfied teaching'].map((q,i) => (
            <div key={i}>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>{q}</div>
              <RatingBar value={stat.avgRatings[i]||0} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Subjects Handled (expandable) ── */}
      <div style={{ padding:'0.875rem 1.5rem' }}>
        <button onClick={() => setOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', fontFamily:'inherit', color:'var(--primary)', fontWeight:600, fontSize:'0.875rem', padding:0 }}>
          📚 {stat.subjects.length} Subject{stat.subjects.length!==1?'s':''} handled
          <span style={{ fontSize:'0.75rem' }}>{open ? '▲ collapse' : '▼ expand'}</span>
        </button>

        {open && (
          <div style={{ marginTop:'0.875rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {stat.subjects.map((sub,si) => (
              <div key={si} style={{ background:'#f9fafb', borderRadius:8, padding:'0.875rem 1rem', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.75rem' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{sub.subjectName}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>
                    {sub.branches.join(', ')} · {sub.years.join(', ')} · {sub.responses} response{sub.responses!==1?'s':''}
                  </div>
                </div>
              
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function AdminDashboard() {
  const [summary,  setSummary]  = useState(null);
  const [stats,    setStats]    = useState([]);
  const [filters,  setFilters]  = useState({ branch:'', year:'', campus:'' });
  const [loading,  setLoading]  = useState(true);
  const [viewMode, setViewMode] = useState('cards');

  const loadData = useCallback(() => {
    setLoading(true);
    const clean = Object.fromEntries(Object.entries(filters).filter(([,v])=>v));
    Promise.all([getAdminSummary(), getFacultyStats(clean)])
      .then(([s,f]) => { setSummary(s.data); setStats(f.data); })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);
  const setFilter = (f) => (e) => setFilters(p => ({ ...p, [f]: e.target.value }));

  const exportCSV = () => {
  if (!stats.length) return toast.info('No data to export');

  const headers = [
    'Faculty ID',
    'Faculty Name',
    'Campuses',
    'Subjects',
    'Total Responses',
    'Q1-Explanation',
    'Q2-Knowledge',
    'Q3-Interactive',
    'Q4-Doubts',
    'Q5-Punctuality',
    'Q6-Teaching Speed',
    'Q7-Satisfied teaching',
    'Overall Avg',
    'Classification',
    'Weak Area'
  ];

  const rows = stats.map((s) => {
    const hasName = s.facultyName && s.facultyName !== s.facultyId;

    return [
      s.facultyId,
      hasName ? s.facultyName : '',
      s.campuses.join('; '),
      s.subjects.map((sub) => sub.subjectName).join('; '),
      s.totalResponses,
      ...s.avgRatings,
      s.overallAvg,
      s.classification,
      s.classification === 'Excellent' ? '' : s.weakArea
    ];
  });

  const csv = [headers, ...rows]
    .map((r) =>
      r.map((c) => `"${String(c ?? '').replace(/"/g, "'")}"`).join(',')
    )
    .join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv' })
  );
  a.download = `faculty_dashboard_${Date.now()}.csv`;
  a.click();

  toast.success('Exported!');
};

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">

        <div className="page-header">
          <div>
            <div className="page-title">📊 Admin Dashboard</div>
            <div className="page-subtitle">Faculty performance overview</div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
            <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
              {['cards','table'].map(m => (
                <button key={m} onClick={()=>setViewMode(m)} style={{ padding:'0.45rem 0.9rem', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.82rem', background:viewMode===m?'var(--primary)':'white', color:viewMode===m?'white':'var(--text-muted)' }}>
                  {m==='cards'?'🃏 Cards':'📋 Table'}
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📤 CSV</button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="stats-grid" style={{ marginBottom:'1.5rem' }}>
            <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{summary.totalStudents}</div><div className="stat-label">Students</div></div>
            <div className="stat-card"><div className="stat-icon">📚</div><div className="stat-value">{summary.totalSubjects}</div><div className="stat-label">Subjects</div></div>
            <div className="stat-card"><div className="stat-icon">📝</div><div className="stat-value">{summary.totalFeedbacks}</div><div className="stat-label">Feedback Records</div></div>
            <div className="stat-card"><div className="stat-icon">👨‍🏫</div><div className="stat-value">{stats.length}</div><div className="stat-label">Faculty Members</div></div>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="filter-row">
            {[{f:'branch',label:'Branch',opts:BRANCHES},{f:'year',label:'Year',opts:YEARS},{f:'campus',label:'Campus',opts:CAMPUSES}].map(({f,label,opts}) => (
              <div className="filter-group" key={f}>
                <label>{label}</label>
                <select className="form-control" value={filters[f]} onChange={setFilter(f)}>
                  <option value="">All {label}s</option>
                  {opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="filter-group"><label>&nbsp;</label>
              <button className="btn btn-secondary btn-sm" onClick={()=>setFilters({branch:'',year:'',campus:''})}>Reset</button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading" style={{ height:'30vh' }}>Loading...</div>
        ) : stats.length===0 ? (
          <div className="card empty-state"><div className="empty-icon">📊</div><h3>No data yet</h3><p>Stats appear once students submit feedback.</p></div>
        ) : viewMode==='cards' ? (
          <div>{stats.map((s,i)=><FacultyCard key={i} stat={s}/>)}</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Faculty ID</th><th>Faculty Name</th><th>Campuses</th>
                  <th>Subjects</th><th>Responses</th><th>Overall</th>
                  <th>Status</th><th>Weak Area</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s,i)=>{
                  
                  const hasName = s.facultyName && s.facultyName !== s.facultyId;
                  return (
                    <tr key={i}>
                      <td><code style={{ fontSize:'0.78rem', color:'var(--text-muted)', background:'#f3f4f6', padding:'1px 5px', borderRadius:4 }}>{s.facultyId}</code></td>
                      <td><strong>{hasName ? s.facultyName : '—'}</strong></td>
                      <td style={{ fontSize:'0.82rem' }}>{s.campuses.join(', ')}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-muted)', maxWidth:180 }}>{s.subjects.map(sub=>sub.subjectName).join(', ')}</td>
                      <td><strong>{s.totalResponses}</strong></td>
                      <td style={{ minWidth:130 }}><RatingBar value={s.overallAvg}/></td>
                      
          
                      <td><span className={`badge ${BADGE_CLS[s.classification]}`}>{s.classification}</span></td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>
                          {s.classification === 'Excellent' ? '—' : `⚠ ${s.weakArea}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}