const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getValidUserId } = require('../utils/userUtils');

// Get all companies (all authenticated users can view)
router.get('/', auth, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create company (ADMIN ONLY)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const company = new Company({
      ...req.body,
      createdBy: getValidUserId(req.user._id)
    });
    const savedCompany = await company.save();
    
    // Populate creator info for response
    await savedCompany.populate('createdBy', 'username email');
    
    res.status(201).json({
      message: 'Company created successfully',
      company: savedCompany
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Company name already exists',
        field: 'name'
      });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Get company by ID (all authenticated users can view)
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update company (ADMIN ONLY)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Company updated successfully',
      company: company
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Company name already exists',
        field: 'name'
      });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete company (ADMIN ONLY) - Soft delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: getValidUserId(req.user._id)
      },
      { new: true }
    );
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Company deleted successfully',
      company: company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restore company (ADMIN ONLY)
router.patch('/:id/restore', auth, adminOnly, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('createdBy', 'username email');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({
      message: 'Company restored successfully',
      company: company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get deleted companies (ADMIN ONLY)
router.get('/deleted/list', auth, adminOnly, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: false })
      .populate('createdBy', 'username email')
      .populate('deletedBy', 'username email')
      .sort({ deletedAt: -1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;