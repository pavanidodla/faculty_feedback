const mongoose = require('mongoose');

const feedbackEntrySchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subjectName: String,
  faculty: String,
  ratings: [{ type: Number, min: 1, max: 5 }],
  improvement: String,
  averageRating: Number,
  
});

const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentEmail: String,
  studentRollNo: String,
  year: { type: String, enum: ['E1','E2','E3','E4'] },
  semester: { type: String, enum: ['Sem1','Sem2'] },
  branch: String,
  campus: String,
  entries: [feedbackEntrySchema],
  submittedAt: { type: Date, default: Date.now }
});

feedbackSchema.index({ studentId: 1, year: 1, semester: 1, branch: 1, campus: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);