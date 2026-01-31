const mongoose = require('mongoose');

const voucherEntrySchema = new mongoose.Schema({
  ledger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['Dr', 'Cr'],
    required: true
  }
});

const voucherSchema = new mongoose.Schema({
  voucherNumber: {
    type: String,
    required: true
  },
  voucherType: {
    type: String,
    required: true,
    enum: ['Payment', 'Receipt', 'Journal', 'Sales', 'Purchase', 'Contra']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  entries: [voucherEntrySchema],
  narration: {
    type: String,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Voucher', voucherSchema);