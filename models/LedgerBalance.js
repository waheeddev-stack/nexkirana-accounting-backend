const mongoose = require('mongoose');

const ledgerBalanceSchema = new mongoose.Schema({
  ledger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ledger',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  debitBalance: {
    type: Number,
    default: 0
  },
  creditBalance: {
    type: Number,
    default: 0
  },
  runningBalance: {
    type: Number,
    default: 0
  },
  balanceType: {
    type: String,
    enum: ['Dr', 'Cr'],
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
ledgerBalanceSchema.index({ ledger: 1, date: 1 });
ledgerBalanceSchema.index({ company: 1, date: 1 });

module.exports = mongoose.model('LedgerBalance', ledgerBalanceSchema);