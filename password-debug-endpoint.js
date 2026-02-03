// Temporary endpoint to debug password in production
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Debug endpoint to check admin password
router.get('/admin-password-debug', async (req, res) => {
  try {
    // Find admin user
    const admin = await User.findOne({ email: 'admin@nexkirana.com' });
    
    if (!admin) {
      return res.json({
        error: 'Admin user not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Test common passwords
    const commonPasswords = [
      'Admin123!',
      'admin123',
      'Admin123',
      'admin',
      'password',
      'Admin@123',
      'nexkirana123',
      'tallyprime123'
    ];
    
    const passwordTests = {};
    
    for (const testPassword of commonPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPassword, admin.password);
        passwordTests[testPassword] = isMatch;
      } catch (error) {
        passwordTests[testPassword] = `Error: ${error.message}`;
      }
    }
    
    // Find the correct password
    const correctPassword = Object.keys(passwordTests).find(pwd => passwordTests[pwd] === true);
    
    res.json({
      message: 'Admin password debug information',
      adminUser: {
        email: admin.email,
        username: admin.username,
        role: admin.role,
        department: admin.department,
        isActive: admin.isActive,
        created: admin.createdAt,
        updated: admin.updatedAt
      },
      passwordHash: {
        full: admin.password,
        length: admin.password.length,
        algorithm: admin.password.split('$')[1] || 'unknown',
        rounds: admin.password.split('$')[2] || 'unknown',
        preview: admin.password.substring(0, 20) + '...'
      },
      passwordTests: passwordTests,
      correctPassword: correctPassword || 'None found',
      recommendation: correctPassword ? 
        `Use: admin@nexkirana.com / ${correctPassword}` : 
        'Password needs to be reset',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Reset admin password endpoint
router.post('/reset-admin-password', async (req, res) => {
  try {
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.updateOne(
      { email: 'admin@nexkirana.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      message: 'Admin password reset successfully',
      credentials: {
        email: 'admin@nexkirana.com',
        password: newPassword
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Password reset failed',
      message: error.message
    });
  }
});

module.exports = router;