const Subject = require('../models/Subject');

// GET /api/subjects?year=E1&semester=Sem1&branch=CSE&campus=RK Valley
exports.getSubjects = async (req, res) => {
  try {
    const { year, semester, branch, campus } = req.query;

    // Base filter for year, semester, branch
    const filter = {};
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (branch) filter.branch = branch;

    let subjects = await Subject.find(filter).lean();

    if (campus) {
      // Keep only faculty for selected campus
      subjects = subjects
        .map(sub => ({
          ...sub,
          facultyList: sub.facultyList?.filter(f => f.campus === campus) || []
        }))
        .filter(sub => sub.facultyList.length > 0); // remove subjects with no faculty for that campus
    }

    res.json(subjects);
  } catch (err) {
    console.error('getSubjects error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};