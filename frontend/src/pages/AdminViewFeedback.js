import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { getAllFeedback, getSubjects } from '../api';
import { toast } from 'react-toastify';

const BADGE = { Excellent:'badge-excellent', Average:'badge-average', Poor:'badge-poor' };
const BRANCHES = ['CSE','AI/ML','ECE','EEE','CIVIL','MECH','CHEMICAL','MME'];
const classify = (avg) => avg >= 4 ? 'Excellent' : avg >= 3 ? 'Average' : 'Poor';

export default function AdminViewFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [filters, setFilters] = useState({ year:'', semester:'', branch:'', campus:'' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);

    const clean = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));

    Promise.all([
      getAllFeedback(clean),
      getSubjects() // fetch subjects to map faculty IDs → names
    ])
    .then(([fbRes, subRes]) => {
      setFeedbacks(fbRes.data);

      // Build facultyId → name map
      const map = {};
      subRes.data.forEach(sub => {
        sub.facultyList.forEach(f => {
          map[f.facultyId] = f.name;
        });
      });
      setFacultyMap(map);
    })
    .catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false));

  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (field) => (e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }));

  const rows = feedbacks.flatMap((fb) => fb.entries.map((e) => ({
    rollNo: fb.studentRollNo, 
    year: fb.year, 
    semester: fb.semester, 
    branch: fb.branch, 
    campus: fb.campus,
    subject: e.subjectName, 
    faculty: facultyMap[e.faculty] ? `${facultyMap[e.faculty]} (${e.faculty})` : e.faculty,
    avg: e.averageRating,
    classification: classify(e.averageRating || 0), 
    improvement: e.improvement, 
    date: fb.submittedAt,
  })));

  const filtered = search ? rows.filter((r) =>
    r.faculty?.toLowerCase().includes(search.toLowerCase()) ||
    r.subject?.toLowerCase().includes(search.toLowerCase()) ||
    r.rollNo?.toLowerCase().includes(search.toLowerCase())
  ) : rows;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="page-header">
          <div>
            <div className="page-title">📋 All Feedback</div>
            <div className="page-subtitle">{filtered.length} records</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="filter-row">
            <div className="filter-group" style={{ minWidth:200 }}>
              <label>Search</label>
              <input className="form-control" placeholder="Faculty / Subject / Roll No" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {[{field:'year',opts:['E1','E2','E3','E4']},{field:'semester',opts:['Sem1','Sem2']},{field:'branch',opts:BRANCHES},{field:'campus',opts:['RK Valley','Ongole']}].map(({field,opts}) => (
              <div className="filter-group" key={field}>
                <label style={{ textTransform:'capitalize' }}>{field}</label>
                <select className="form-control" value={filters[field]} onChange={setFilter(field)}>
                  <option value="">All</option>
                  {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="filter-group">
              <label>&nbsp;</label>
              <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({year:'',semester:'',branch:'',campus:''}); setSearch(''); }}>Reset</button>
            </div>
          </div>
        </div>

        {loading ? <div className="loading" style={{ height:'30vh' }}>Loading...</div>
          : filtered.length === 0 ? <div className="card empty-state"><div className="empty-icon">📭</div><h3>No records found</h3><p>Try adjusting filters.</p></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Year/Sem</th>
                    <th>Branch/Campus</th>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Avg Rating</th>
                    <th>Status</th>
                    <th>Improvement</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.rollNo}</strong></td>
                      <td>{row.year} / {row.semester}</td>
                      <td>
                        <div>{row.branch}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{row.campus}</div>
                      </td>
                      <td>{row.subject}</td>
                      <td><strong>{row.faculty}</strong></td>
                      <td>
                        <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--primary)' }}>{row.avg?.toFixed(1)}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>out of 5</div>
                      </td>
                      <td><span className={`badge ${BADGE[row.classification]}`}>{row.classification}</span></td>
                      <td style={{ maxWidth:200, fontSize:'0.82rem' }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={row.improvement}>{row.improvement}</div>
                      </td>
                      <td style={{ fontSize:'0.82rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(row.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}