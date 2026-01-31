const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  group: {
    type: String,
    required: true,
    enum: [
      'Assets', 'Liabilities', 'Income', 'Expenses',
      'Current Assets', 'Fixed Assets', 'Current Liabilities',
      'Capital Account', 'Sales Accounts', 'Purchase Accounts',
      'Direct Expenses', 'Indirect Expenses', 'Direct Incomes',
      'Indirect Incomes', 'Bank Accounts', 'Cash-in-Hand',
      'Sundry Debtors', 'Sundry Creditors'
    ]
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  balanceType: {
    type: String,
    enum: ['Dr', 'Cr'],
    default: 'Dr'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ledger', ledgerSchema);