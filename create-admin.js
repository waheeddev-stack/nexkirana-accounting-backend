const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@nexkirana.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@nexkirana.com',
      password: 'Admin123!', // This will be hashed by the pre-save middleware
      role: 'admin',
      department: 'admin',
      isActive: true,
      permissions: {
        canCreateCompany: true,
        canDeleteVouchers: true,
        canViewReports: true,
        canManageUsers: true
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@nexkirana.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();