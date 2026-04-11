const mongoose = require('mongoose');
const User = require('../models/User'); // adjust path if needed
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB (no extra options needed)
    await mongoose.connect(process.env.MONGO_URI);

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@rguktrkv.ac.in' });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Create admin (pre-save hook will hash password)
    const admin = new User({
      name: 'Admin',
      email: 'admin@rguktrkv.ac.in',
      password: 'Admin@123', // plain password
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();