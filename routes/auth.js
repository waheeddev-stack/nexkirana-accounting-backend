const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { authLimiter, createAccountLimiter } = require('../middleware/rateLimiter');
const { auditLogger } = require('../middleware/auditLogger');

// Register (admin only for internal use)
router.post('/register', [
  auth, // Require authentication
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    // Only admin can create new accounts for internal use
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can create new accounts.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'user', department = 'accounts' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({ 
      username, 
      email, 
      password, 
      role,
      department,
      createdBy: req.user._id
    });
    await user.save();

    res.status(201).json({
      message: 'User account created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔍 LOGIN ATTEMPT - SIMPLIFIED VERSION');
    console.log('Request body:', req.body);
    
    // Basic validation
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ MISSING EMAIL OR PASSWORD');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    console.log('🔍 SEARCHING FOR USER:', email);
    
    // Check if user exists and is active
    const user = await User.findOne({ email, isActive: true });
    
    if (!user) {
      console.log('❌ USER NOT FOUND OR INACTIVE');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ USER FOUND:', {
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive
    });

    // Check password
    console.log('🔍 COMPARING PASSWORD...');
    const isMatch = await user.comparePassword(password);
    console.log('🔑 PASSWORD MATCH:', isMatch);
    
    if (!isMatch) {
      console.log('❌ PASSWORD MISMATCH');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ LOGIN SUCCESSFUL - GENERATING TOKEN');

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    console.log('✅ TOKEN GENERATED SUCCESSFULLY');

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      },
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;