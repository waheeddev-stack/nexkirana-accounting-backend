const express = require('express');
const router = express.Router();
const Ledger = require('../models/Ledger');
const auth = require('../middleware/auth');

// Get all ledgers for a company
router.get('/', auth, async (req, res) => {
  try {
    const { companyId } = req.query;
    const query = companyId ? { company: companyId, isActive: true } : { isActive: true };
    const ledgers = await Ledger.find(query).populate('company', 'name');
    res.json(ledgers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create ledger
router.post('/', auth, async (req, res) => {
  try {
    const ledger = new Ledger({
      ...req.body,
      createdBy: req.user._id
    });
    const savedLedger = await ledger.save();
    res.status(201).json(savedLedger);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get ledger by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id).populate('company', 'name');
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ledger
router.put('/:id', auth, async (req, res) => {
  try {
    const ledger = await Ledger.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }
    res.json(ledger);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;