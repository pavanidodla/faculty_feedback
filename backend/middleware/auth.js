const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Protect Middleware
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next(); // ✅ continue to next middleware
  } catch (err) {
    console.error('Auth middleware error:', err); // 🔥 important for debugging
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// 🔒 Admin Only Middleware
exports.adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next(); // ✅ continue
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};