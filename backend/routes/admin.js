const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject');
const User = require('../models/User');

router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSubjects = await Subject.countDocuments();
    const totalFeedbacks = await Feedback.countDocuments();
    res.json({ totalStudents, totalSubjects, totalFeedbacks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;