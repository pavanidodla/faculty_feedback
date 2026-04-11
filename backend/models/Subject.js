const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subject: { type: String, trim: true },
  year: { type: String },      // E1, E2, E3, E4
  semester: { type: String },  // Sem1, Sem2
  branch: { type: String },    // CSE, ECE, etc.
  facultyList: [
    {
      facultyId: { type: String },
      name: { type: String },
      campus: { type: String }, // 'RK Valley' or 'Ongole'
    }
  ],
}, { timestamps: true, strict: false });

// Export the model ONLY
module.exports = mongoose.model('Subject', subjectSchema, 'subjects');