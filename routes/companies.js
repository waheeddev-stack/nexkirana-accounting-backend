const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const auth = require('../middleware/auth');

// Get all companies
router.get('/', auth, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create company
router.post('/', auth, async (req, res) => {
  try {
    const company = new Company({
      ...req.body,
      createdBy: req.user._id
    });
    const savedCompany = await company.save();
    res.status(201).json(savedCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get company by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update company
router.put('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;