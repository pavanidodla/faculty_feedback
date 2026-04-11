const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, adminOnly } = require('../middleware/auth');
const Subject = require('../models/Subject');

// Debug route — visit http://localhost:5000/api/subjects/debug to verify data
router.get('/debug', async (req, res) => {
  try {
    const count  = await Subject.countDocuments();
    const sample = await Subject.find().limit(5).lean();

    // Show all unique campus values stored in your DB
    const allDocs    = await Subject.find().lean();
    const campusValues = [...new Set(allDocs.map(d => d.campus).filter(Boolean))];

    res.json({
      collection:     'subjects',
      totalDocuments: count,
      uniqueCampusValues: campusValues,
      sampleDocuments: sample,
      message: count === 0
        ? 'EMPTY — check MONGO_URI in .env points to correct database'
        : `Found ${count} documents. Campus values in DB: ${campusValues.join(', ')}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/',       protect,             getSubjects);
router.post('/',      protect, adminOnly,  createSubject);
router.put('/:id',    protect, adminOnly,  updateSubject);
router.delete('/:id', protect, adminOnly,  deleteSubject);

module.exports = router;