const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Removed inline validator — validation is done in the controller
    // so we get clean 400 errors not 500 Mongoose ValidationErrors
  },
  password: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save: hash password only when it has been set/changed
// Pre-save: hash password only when it has been set/changed
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);