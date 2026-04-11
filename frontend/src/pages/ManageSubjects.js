import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api';
import { toast } from 'react-toastify';

const YEARS = ['E1','E2','E3','E4'];
const SEMESTERS = ['Sem1','Sem2'];
const BRANCHES = ['CSE','AI/ML','ECE','EEE','CIVIL','MECH','CHEMICAL','MME'];
const CAMPUSES = ['RK Valley','Ongole'];

// Blank subject template
const BLANK = {
  subject: '',
  code: '',
  year: 'E1',
  semester: 'Sem1',
  branch: 'CSE',
  campus: 'RK Valley',
  facultyList: [{ facultyId: '', name: '', campus: 'RK Valley' }],
};

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({ year:'', semester:'', branch:'', campus:'' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load subjects
  const load = useCallback(() => {
    setLoading(true);
    const clean = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
    getSubjects(clean)
      .then(res => setSubjects(res.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setField = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const setFilter = (field) => (e) => setFilters(f => ({ ...f, [field]: e.target.value }));

  // Faculty handlers
  const addFaculty = () => setForm(f => ({ ...f, facultyList: [...f.facultyList, { facultyId:'', name:'', campus:'RK Valley' }] }));
  const removeFaculty = (i) => setForm(f => ({ ...f, facultyList: f.facultyList.filter((_, idx) => idx !== i) }));
  const updateFaculty = (i, field, value) => {
    const fl = [...form.facultyList];
    fl[i][field] = value;
    setForm({ ...form, facultyList: fl });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error('Subject name is required');
    const cleanFaculty = form.facultyList.filter(f => f.name.trim());
    if (cleanFaculty.length === 0) return toast.error('At least one faculty name is required');

    setSaving(true);
    try {
      const payload = { ...form, facultyList: cleanFaculty };
      if (editId) {
        await updateSubject(editId, payload);
        toast.success('Subject updated');
      } else {
        await createSubject(payload);
        toast.success('Subject added');
      }
      setForm(BLANK);
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleEdit = (s) => {
    setForm({
      subject: s.subject || '',
      code: s.code || '',
      year: s.year || 'E1',
      semester: s.semester || 'Sem1',
      branch: s.branch || 'CSE',
      campus: s.campus || 'RK Valley',
      facultyList: (s.facultyList || []).map(f => ({
      facultyId: f.facultyId || '',
      name: f.name || '',
      campus: f.campus || 'RK Valley'   // ✅ fallback fix
    }))
    });
    setEditId(s._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteSubject(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="page-title" style={{ marginBottom: '1.5rem' }}>📚 Manage Subjects</div>

        {/* Add/Edit Form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-title">{editId ? '✏️ Edit Subject' : '➕ Add New Subject'}</div>
          <form onSubmit={handleSubmit}>
            <div className="filter-row" style={{ marginBottom: '1rem', flexWrap:'wrap', gap:'1rem' }}>
              <div className="form-group" style={{ flex:2, minWidth:180 }}>
                <label>Subject Name *</label>
                <input className="form-control" value={form.subject} onChange={setField('subject')} placeholder="e.g. Discrete Mathematics" required />
              </div>

              {[{ field:'year', opts:YEARS }, { field:'semester', opts:SEMESTERS }, { field:'branch', opts:BRANCHES }]
                .map(({ field, opts }) => (
                  <div className="form-group" key={field} style={{ minWidth:120 }}>
                    <label style={{ textTransform:'capitalize' }}>{field} *</label>
                    <select className="form-control" value={form[field]} onChange={setField(field)}>
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))
              }
            </div>

            {/* Faculty List */}
            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontWeight:600, fontSize:'0.85rem', marginBottom:'0.6rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <span>👨‍🏫 Faculty Members *</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addFaculty}>+ Add Faculty</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {form.facultyList.map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                    <input
                      className="form-control"
                      placeholder={`Faculty name ${i+1} *`}
                      value={f.name}
                      onChange={(e) => updateFaculty(i,'name',e.target.value)}
                      style={{ flex:1 }}
                      required
                    />
                    <input
                      className="form-control"
                      placeholder={`Faculty ID ${i+1}`}
                      value={f.facultyId}
                      onChange={(e) => updateFaculty(i,'facultyId',e.target.value)}
                      style={{ width: '120px' }}
                    />
                    <select
                      className="form-control"
                      value={f.campus}
                      onChange={(e) => updateFaculty(i,'campus',e.target.value)}
                      style={{ width:'140px' }}
                    >
                      {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form.facultyList.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFaculty(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : editId ? '✓ Update Subject' : '+ Add Subject'}
              </button>
              {editId && <button className="btn btn-secondary" type="button" onClick={() => { setForm(BLANK); setEditId(null); }}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1rem' }}>
          <div style={{ fontWeight:700 }}>All Subjects ({subjects.length})</div>
          <div className="filter-row" style={{ margin:0, display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {[{ field:'year', opts:YEARS }, { field:'semester', opts:SEMESTERS }, { field:'branch', opts:BRANCHES }, { field:'campus', opts:CAMPUSES }]
              .map(({field,opts}) => (
                <div key={field} style={{ minWidth:100 }}>
                  <label style={{ textTransform:'capitalize' }}>{field}</label>
                  <select className="form-control" value={filters[field]} onChange={setFilter(field)}>
                    <option value="">All</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))
            }
          </div>
        </div>

        {/* Subject Cards */}
        {loading ? (
          <div className="loading" style={{ height:'20vh' }}>Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="card empty-state"><div className="empty-icon">📚</div><h3>No subjects found</h3><p>Add subjects using the form above.</p></div>
        ) : (
          <div style={{ display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))' }}>
            {subjects.map((s, i) => (
              <div key={s._id} className="card">
                <h3>{s.subject} {s.code ? `(${s.code})` : ''}</h3>
                <div style={{ fontSize:'0.85rem', marginBottom:'0.5rem' }}>
                  {s.year}, {s.semester}, {s.branch}
                </div>
                <div style={{ fontSize:'0.85rem', marginBottom:'0.5rem' }}>
                  <strong>Faculty:</strong> 
                  {(s.facultyList || []).map(f => `${f.name} (${f.facultyId || '—'}, ${f.campus})`).join(', ')}
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(s)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.subject)}>🗑 Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}