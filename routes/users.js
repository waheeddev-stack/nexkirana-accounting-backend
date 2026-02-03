const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { getValidUserId } = require('../utils/userUtils');

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create user (admin/manager only)
router.post('/', [
  auth,
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['admin', 'manager', 'accountant', 'user']).withMessage('Invalid role'),
  body('department').isIn(['accounts', 'sales', 'purchase', 'inventory', 'admin']).withMessage('Invalid department')
], async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin or Manager only.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, department, permissions } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Set default permissions based on role
    let defaultPermissions = {
      canCreateCompany: false,
      canDeleteVouchers: false,
      canViewReports: true,
      canManageUsers: false
    };

    if (role === 'admin') {
      defaultPermissions = {
        canCreateCompany: true,
        canDeleteVouchers: true,
        canViewReports: true,
        canManageUsers: true
      };
    } else if (role === 'manager') {
      defaultPermissions = {
        canCreateCompany: true,
        canDeleteVouchers: true,
        canViewReports: true,
        canManageUsers: false
      };
    }

    // Create user
    const user = new User({ 
      username, 
      email, 
      password, 
      role, 
      department,
      permissions: permissions || defaultPermissions,
      createdBy: getValidUserId(req.user._id)
    });
    
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin/manager only)
router.put('/:id', [
  auth,
  body('role').optional().isIn(['admin', 'manager', 'accountant', 'user']),
  body('department').optional().isIn(['accounts', 'sales', 'purchase', 'inventory', 'admin'])
], async (req, res) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Admin or Manager only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role, department, permissions, isActive } = req.body;

    if (role) user.role = role;
    if (department) user.department = department;
    if (permissions) user.permissions = { ...user.permissions, ...permissions };
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Deactivate user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;