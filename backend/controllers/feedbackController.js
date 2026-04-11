const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject'); // ✅ ADDED
const { sendFeedbackConfirmationEmail } = require('../utils/email');
const QUESTIONS = [
  'Concept Explanation',
  'Subject Knowledge',
  'Interactivity',
  'Doubt Clearing',
  'Punctuality',
  'Teaching Speed',
  'Satisfied teaching'
];


// ── Submit Feedback ──────────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const { year, semester, branch, campus, entries } = req.body;
    const studentId     = req.user._id;
    const studentEmail  = req.user.email;
    const studentName   = req.user.name;
    const studentRollNo = studentEmail.split('@')[0];

    const existing = await Feedback.findOne({ studentId, year, semester, branch, campus });
    if (existing)
      return res.status(400).json({ message: 'Feedback already submitted for this combination' });

    for (const entry of entries) {
  if (!entry.faculty)
    return res.status(400).json({ message: `Please select faculty for "${entry.subjectName}"` });

  if (
  !entry.ratings ||
  entry.ratings.length !== QUESTIONS.length ||
  entry.ratings.some(r => r < 1 || r > 5)
) {
  return res.status(400).json({
    message: `Please complete all ${QUESTIONS.length} ratings for "${entry.subjectName}"`
  });
}

  // Improvement is optional → no validation
  entry.improvement = entry.improvement?.trim() || '';

  // Average rating only
  entry.averageRating = +(
    entry.ratings.reduce((a, b) => a + b, 0) / entry.ratings.length
  ).toFixed(2);

  // Remove sentiment completely
  entry.sentiment = undefined;
  entry.sentimentScore = undefined;
}

    const feedback = await Feedback.create({
      studentId, studentEmail, studentRollNo,
      year, semester, branch, campus, entries
    });

    res.status(201).json({ message: 'Feedback submitted successfully!', feedback });

    sendFeedbackConfirmationEmail({
      to: studentEmail,
      studentName: studentName || studentRollNo,
      rollNo: studentRollNo,
      year, semester, branch, campus,
      entries,
      submittedAt: feedback.submittedAt,
    }).catch(err => console.error('Email failed:', err.message));

  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'Feedback already submitted for this combination' });

    console.error('Submit feedback error:', err.message);
    return res.status(500).json({ message: err.message });
  }
};

// ── My Feedback ──────────────────────────────────────────────────────────────
exports.getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ studentId: req.user._id })
      .sort({ submittedAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── All Feedback ─────────────────────────────────────────────────────────────
exports.getAllFeedback = async (req, res) => {
  try {
    const { year, semester, branch, campus } = req.query;

    const filter = {};
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (branch) filter.branch = branch;
    if (campus) filter.campus = campus;

    const feedbacks = await Feedback.find(filter)
      .sort({ submittedAt: -1 });

    res.json(feedbacks);
  } catch (err) {
    console.error('getAllFeedback error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── Faculty Stats (UPDATED WITH NAME) ─────────────────────────────────────────
exports.getFacultyStats = async (req, res) => {
  try {
    const { branch, year, campus } = req.query;

    const filter = {};
    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (campus) {
      filter.$or = [
        { campus: campus },
        { campus: 'RK Valley/Ongole' },
        { campus: 'Ongole/RK Valley' },
      ];
    }

    // ✅ Fetch feedback
    const feedbacks = await Feedback.find(filter);

    // ✅ Fetch subjects → map facultyId → name
    const subjects = await Subject.find();
    const facultyNameMap = {};

    subjects.forEach(sub => {
      sub.facultyList.forEach(f => {
        facultyNameMap[f.facultyId] = f.name;
      });
    });

    const facultyMap = {};

    feedbacks.forEach(fb => {
      fb.entries.forEach(entry => {
        const key = entry.faculty;

        if (!facultyMap[key]) {
          facultyMap[key] = {
            facultyId: key,
            facultyName: facultyNameMap[key] || key, // ✅ FIX
            subjectDetails: {},
            campuses: new Set(),
            totalResponses: 0,
            totalRatings: Array(QUESTIONS.length).fill(0),
            ratingCount: 0,
            
          };
        }

        const fm = facultyMap[key];

        if (!fm.subjectDetails[entry.subjectName]) {
          fm.subjectDetails[entry.subjectName] = {
            subjectName: entry.subjectName,
            branches: new Set(),
            years: new Set(),
            responses: 0,
            totalRatings: Array(QUESTIONS.length).fill(0),
          };
        }

        const sd = fm.subjectDetails[entry.subjectName];
        sd.branches.add(fb.branch);
        sd.years.add(fb.year);
        sd.responses++;
        entry.ratings.forEach((r, i) => sd.totalRatings[i] += r);

        fm.campuses.add(fb.campus);
        fm.totalResponses++;
        entry.ratings.forEach((r, i) => fm.totalRatings[i] += r);
        fm.ratingCount++;

        
      });
    });

    
    const result = Object.values(facultyMap).map(f => {
      const avgRatings = f.totalRatings.map(r => +(r / f.ratingCount).toFixed(2));
      const overallAvg = +(
  avgRatings.reduce((a, b) => a + b, 0) / QUESTIONS.length
).toFixed(2);

      const classification =
        overallAvg >= 4 ? 'Excellent' :
        overallAvg >= 3 ? 'Average' : 'Poor';

      const weakAreaIdx = avgRatings.indexOf(Math.min(...avgRatings));

      

      const subjects = Object.values(f.subjectDetails).map(sd => ({
        subjectName: sd.subjectName,
        branches: [...sd.branches],
        years: [...sd.years],
        responses: sd.responses,
        avgRatings: sd.totalRatings.map(r => +(r / sd.responses).toFixed(2)),
        overallAvg: +(
  sd.totalRatings.reduce((a, b) => a + b, 0) /
  sd.responses /
  QUESTIONS.length
).toFixed(2),
      }));

      return {
        facultyId: f.facultyId,
        facultyName: f.facultyName, // ✅ INCLUDED
        subjects,
        campuses: [...f.campuses],
        totalResponses: f.totalResponses,
        avgRatings,
        overallAvg,
        classification,
        weakArea: QUESTIONS[weakAreaIdx],
        
      };
    });

    result.sort((a, b) => b.overallAvg - a.overallAvg);

    res.json(result);

  } catch (err) {
    console.error('getFacultyStats error:', err.message);
    res.status(500).json({ message: err.message });
  }
};