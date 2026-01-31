const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const auth = require('../middleware/auth');

// Get all vouchers
router.get('/', auth, async (req, res) => {
  try {
    const { companyId, voucherType, startDate, endDate } = req.query;
    let query = {};
    
    if (companyId) query.company = companyId;
    if (voucherType) query.voucherType = voucherType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const vouchers = await Voucher.find(query)
      .populate('entries.ledger', 'name group')
      .populate('company', 'name')
      .sort({ date: -1 });
    
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create voucher
router.post('/', auth, async (req, res) => {
  try {
    const voucher = new Voucher({
      ...req.body,
      createdBy: req.user._id
    });
    const savedVoucher = await voucher.save();
    res.status(201).json(savedVoucher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get voucher by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('entries.ledger', 'name group')
      .populate('company', 'name');
    
    if (!voucher) {
      return res.status(404).json({ message: 'Voucher not found' });
    }
    res.json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;