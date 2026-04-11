const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendOTPEmail } = require('../utils/email');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const ALLOWED_DOMAINS = ['rguktrkv.ac.in', 'rguktong.ac.in'];

const isAllowedEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

const isStrongPassword = (password) => {
  if (!password || password.length < 8) return false;
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
};

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!isAllowedEmail(email)) {
      return res.status(400).json({ message: 'Only rguktrkv.ac.in or rguktong.ac.in emails are allowed' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be 8+ characters with at least one letter, number, and symbol' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'This email is already registered. Please login.' });
    }

    await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    return res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (err) {
    console.error('Register error:', err.message);
    // Handle mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This email is already registered. Please login.' });
    }
    return res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-in. Please use the Google button.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
};

// ── Google Auth ───────────────────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name, email, sub: googleId } = payload;

    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        message: 'Only RGUKT college Google accounts (rguktrkv.ac.in or rguktong.ac.in) are allowed'
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user._id);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
   console.error('REGISTER FULL ERROR:', err); // 🔥 FULL ERROR
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'This email is already registered. Please login.'
    });
  }
  return res.status(500).json({
    message: err.message
  });
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  return res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
  });
};

// ── Forgot Password: Send OTP ─────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success message to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If this email is registered, an OTP has been sent.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await OTP.deleteMany({ email: email.toLowerCase() });
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOTPEmail(email, otp);

    return res.json({ message: 'OTP sent to your email. Valid for 10 minutes.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({ message: 'Failed to send OTP. Please check email configuration.' });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const record = await OTP.findOne({
      email: email.toLowerCase(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) return res.status(400).json({ message: 'OTP is invalid or has expired. Please request a new one.' });
    if (record.otp !== otp.toString()) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

    const resetToken = jwt.sign(
      { email: email.toLowerCase(), purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    record.used = true;
    await record.save();

    return res.json({ message: 'OTP verified successfully', resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ message: 'Password must be 8+ chars with letter, number, and symbol' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Reset session expired. Please request a new OTP.' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password reset successfully! Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};