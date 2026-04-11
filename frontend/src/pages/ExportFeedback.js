import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { getAllFeedback, getFacultyStats, getSubjects } from '../api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const BRANCHES = ['CSE','AI/ML','ECE','EEE','CIVIL','MECH','CHEMICAL','MME'];
const QUESTIONS = [
  'Concept Explanation',
  'Subject Knowledge',
  'Interactivity',
  'Doubt Clearing',
  'Punctuality',
  'Teaching Speed',
  'Satisfied teaching'

];
function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g,"'")}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export default function ExportFeedback() {
  const [filters, setFilters] = useState({ year:'', semester:'', branch:'', campus:'' });
  const [loading, setLoading] = useState({ feedback: false, stats: false });
  const [facultyMap, setFacultyMap] = useState({}); // facultyId -> facultyName

  const setFilter = (field) => (e) => setFilters(prev => ({ ...prev, [field]: e.target.value }));

  const cleanFilters = () => Object.fromEntries(Object.entries(filters).filter(([,v]) => v));

  // Load faculty map from subjects
  const loadFacultyMap = useCallback(async () => {
    try {
      const res = await getSubjects();
      const map = {};
      res.data.forEach(sub => sub.facultyList.forEach(f => { map[f.facultyId] = f.name; }));
      setFacultyMap(map);
    } catch {
      toast.error('Failed to load faculty names');
    }
  }, []);

  useEffect(() => { loadFacultyMap(); }, [loadFacultyMap]);

const exportRawFeedback = async () => {
  setLoading((l) => ({ ...l, feedback: true }));

  try {
    const res = await getAllFeedback(cleanFilters());
    const data = res.data;

    if (!data.length) {
      toast.info('No feedback found');
      return;
    }

    const studentMap = {};

    data.forEach((fb) => {
      const studentId =
        fb.studentRollNo ||
        fb.email?.split('@')[0] ||
        'Unknown';

      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          studentId,
          year: fb.year,
          semester: fb.semester,
          branch: fb.branch,
          campus: fb.campus,
          subjects: []
        };
      }

      (fb.entries || []).forEach((e) => {
        studentMap[studentId].subjects.push({
          subjectName: e.subjectName || '',
          facultyName: facultyMap[e.faculty] || 'Unknown',
          facultyId: e.faculty || '',
          ratings: e.ratings || Array(QUESTIONS.length).fill(0),
          avg: e.averageRating || '',
          improvement: e.improvement || ''
        });
      });
    });

    const YEAR_ORDER = { E1: 1, E2: 2, E3: 3, E4: 4 };
const SEM_ORDER = { Sem1: 1, Sem2: 2 };

const allStudents = Object.values(studentMap).sort((a, b) => {
  const yearDiff =
    (YEAR_ORDER[a.year] || 99) - (YEAR_ORDER[b.year] || 99);

  if (yearDiff !== 0) return yearDiff;

  const semDiff =
    (SEM_ORDER[a.semester] || 99) - (SEM_ORDER[b.semester] || 99);

  if (semDiff !== 0) return semDiff;

  return String(a.studentId).localeCompare(String(b.studentId));
});
    const maxSubjects = Math.max(...allStudents.map((s) => s.subjects.length));

    const headers = ['Student ID', 'Year', 'Semester', 'Branch', 'Campus'];

    for (let i = 1; i <= maxSubjects; i++) {
      headers.push(
  `Subject ${i} Name`,
  `Faculty Name-${i}`,
  `Faculty ID-${i}`,
  ...QUESTIONS.map((_, qIdx) => `Q${qIdx + 1}-${i}`),
  `Avg-${i}`,
  `Improvement-${i}`
);
    }

    const rows = allStudents.map((s) => {
      const row = [
        s.studentId,
        s.year,
        s.semester,
        s.branch,
        s.campus
      ];

      s.subjects.forEach((sub) => {
        row.push(
          sub.subjectName,
          sub.facultyName,
          sub.facultyId,
          ...sub.ratings,
          sub.avg,
          sub.improvement
        );
      });

      const remaining = maxSubjects - s.subjects.length;

      for (let i = 0; i < remaining; i++) {
        row.push(...Array(QUESTIONS.length + 5).fill(''));
      }

      return row;
    });

    downloadCSV([headers, ...rows], `raw_feedback_${Date.now()}.csv`);

    toast.success('Raw feedback export successful');
  } catch (err) {
    toast.error('Export failed');
  } finally {
    setLoading((l) => ({ ...l, feedback: false }));
  }
};

  const exportFacultyStats = async () => {
  setLoading((l) => ({ ...l, stats: true }));

  try {
    const res = await getAllFeedback(cleanFilters());
    const data = res.data;

    if (!data.length) {
      toast.info('No feedback found');
      return;
    }

    const facultySheets = {};

    data.forEach((fb) => {
      (fb.entries || []).forEach((entry) => {
        const facultyId = entry.faculty || 'Unknown';
        const facultyName = facultyMap[facultyId] || 'Unknown';

        let sheetName = facultyName.substring(0, 31);
        if (!sheetName.trim()) {
          sheetName = `Faculty_${facultyId}`;
        }

        if (!facultySheets[sheetName]) {
          facultySheets[sheetName] = {};
        }

        const key = [
          fb.year || '',
          fb.semester || '',
          fb.branch || '',
          fb.campus || '',
          entry.subjectName || ''
        ].join('_');

        if (!facultySheets[sheetName][key]) {
          facultySheets[sheetName][key] = {
            FacultyID: facultyId,
            FacultyName: facultyName,
            Year: fb.year || '',
            Semester: fb.semester || '',
            Branch: fb.branch || '',
            Campus: fb.campus || '',
            SubjectName: entry.subjectName || '',
            
            Avg: 0,
            count: 0
          };
        }

        const row = facultySheets[sheetName][key];

      
        row.Avg += entry.averageRating ?? 0;
        row.count += 1;
      });
    });

    const workbook = XLSX.utils.book_new();

    const YEAR_ORDER = { E1: 1, E2: 2, E3: 3, E4: 4 };
const SEM_ORDER = { Sem1: 1, Sem2: 2 };

Object.keys(facultySheets).forEach((sheetName) => {
  const sortedItems = Object.values(facultySheets[sheetName]).sort((a, b) => {
    const yearDiff =
      (YEAR_ORDER[a.Year] || 99) - (YEAR_ORDER[b.Year] || 99);
    if (yearDiff !== 0) return yearDiff;

    const semDiff =
      (SEM_ORDER[a.Semester] || 99) - (SEM_ORDER[b.Semester] || 99);
    if (semDiff !== 0) return semDiff;

    return a.SubjectName.localeCompare(b.SubjectName);
  });

  const finalRows = sortedItems.map((item) => {
  const row = {
    FacultyID: item.FacultyID,
    FacultyName: item.FacultyName,
    Year: item.Year,
    Semester: item.Semester,
    Branch: item.Branch,
    Campus: item.Campus,
    SubjectName: item.SubjectName,
    Responses: item.count,
  };

  

  row.Overall_Avg = (item.Avg / item.count).toFixed(2);

  return row;
});

      const worksheet = XLSX.utils.json_to_sheet(finalRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    saveAs(file, `faculty_feedback_${Date.now()}.xlsx`);

    toast.success('Faculty-wise averaged Excel exported successfully');
  } catch (err) {
    toast.error(
      'Export failed: ' + (err.response?.data?.message || err.message)
    );
  } finally {
    setLoading((l) => ({ ...l, stats: false }));
  }
};
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="page-header">
          <div>
            <div className="page-title">📤 Export Feedback</div>
            <div className="page-subtitle">Download data as CSV with campus-aware filtering</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-title">🔍 Filter Options</div>
          <div className="filter-row">
            {[
              { field:'year', opts:['E1','E2','E3','E4'] },
              { field:'semester', opts:['Sem1','Sem2'] },
              { field:'branch', opts:BRANCHES },
              { field:'campus', opts:['RK Valley','Ongole'] },
            ].map(({ field, opts }) => (
              <div className="filter-group" key={field}>
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <select className="form-control" value={filters[field]} onChange={setFilter(field)}>
                  <option value="">All</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="filter-group">
              <label>&nbsp;</label>
              <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ year:'', semester:'', branch:'', campus:'' })}>Reset</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Raw Feedback Data</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Each student appears once, subjects displayed as columns.</p>
            <button className="btn btn-primary" onClick={exportRawFeedback} disabled={loading.feedback} style={{ width:'100%' }}>
              {loading.feedback ? '⏳ Exporting...' : '📥 Export Raw Feedback CSV'}
            </button>
          </div>

          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Faculty Statistics</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Aggregated stats with faculty names.</p>
            <button className="btn btn-success" onClick={exportFacultyStats} disabled={loading.stats} style={{ width:'100%' }}>
              {loading.stats ? '⏳ Exporting...' : '📥 Export Faculty-wise Excel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}