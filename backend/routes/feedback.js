const express = require('express');
const router = express.Router();
const { submitFeedback, getMyFeedback, getAllFeedback, getFacultyStats } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, submitFeedback);
router.get('/mine', protect, getMyFeedback);
router.get('/all', protect, adminOnly, getAllFeedback);
router.get('/stats', protect, adminOnly, getFacultyStats);

module.exports = router;