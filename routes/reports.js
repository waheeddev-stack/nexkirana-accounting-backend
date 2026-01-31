const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');
const BalanceCalculator = require('../utils/balanceCalculator');
const auth = require('../middleware/auth');

// Trial Balance
router.get('/trial-balance', auth, async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;
    const trialBalance = await BalanceCalculator.generateTrialBalance(
      companyId, 
      new Date(startDate), 
      new Date(endDate)
    );
    res.json(trialBalance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Day Book
router.get('/day-book', auth, async (req, res) => {
  try {
    const { companyId, date } = req.query;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const vouchers = await Voucher.find({
      company: companyId,
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('entries.ledger', 'name')
    .sort({ voucherNumber: 1 });

    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Profit & Loss Statement
router.get('/profit-loss', auth, async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;
    const profitLoss = await BalanceCalculator.generateProfitLoss(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );
    res.json(profitLoss);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Balance Sheet
router.get('/balance-sheet', auth, async (req, res) => {
  try {
    const { companyId, asOnDate } = req.query;
    
    const assetGroups = ['Current Assets', 'Fixed Assets', 'Assets'];
    const liabilityGroups = ['Current Liabilities', 'Capital Account', 'Liabilities'];
    
    const ledgers = await Ledger.find({ 
      company: companyId, 
      isActive: true,
      group: { $in: [...assetGroups, ...liabilityGroups] }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    const assets = [];
    const liabilities = [];

    for (const ledger of ledgers) {
      const balance = await BalanceCalculator.calculateLedgerBalance(
        ledger._id, 
        companyId, 
        new Date(asOnDate)
      );
      
      if (assetGroups.includes(ledger.group)) {
        const amount = balance.balanceType === 'Dr' ? balance.balance : -balance.balance;
        if (amount !== 0) {
          totalAssets += amount;
          assets.push({
            ledger: balance.ledger,
            group: balance.group,
            amount: Math.abs(amount)
          });
        }
      } else if (liabilityGroups.includes(ledger.group)) {
        const amount = balance.balanceType === 'Cr' ? balance.balance : -balance.balance;
        if (amount !== 0) {
          totalLiabilities += amount;
          liabilities.push({
            ledger: balance.ledger,
            group: balance.group,
            amount: Math.abs(amount)
          });
        }
      }
    }

    res.json({
      assets: {
        details: assets,
        total: totalAssets
      },
      liabilities: {
        details: liabilities,
        total: totalLiabilities
      },
      difference: totalAssets - totalLiabilities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ledger Statement
router.get('/ledger-statement', auth, async (req, res) => {
  try {
    const { ledgerId, companyId, startDate, endDate } = req.query;
    
    const ledger = await Ledger.findById(ledgerId);
    if (!ledger) {
      return res.status(404).json({ message: 'Ledger not found' });
    }

    const vouchers = await Voucher.find({
      company: companyId,
      'entries.ledger': ledgerId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    .populate('entries.ledger', 'name')
    .sort({ date: 1, voucherNumber: 1 });

    let runningBalance = ledger.balanceType === 'Dr' ? ledger.openingBalance : -ledger.openingBalance;
    const transactions = [];

    // Add opening balance entry
    transactions.push({
      date: startDate,
      voucherNumber: 'Opening',
      voucherType: 'Opening',
      particulars: 'Opening Balance',
      debit: ledger.balanceType === 'Dr' ? ledger.openingBalance : 0,
      credit: ledger.balanceType === 'Cr' ? ledger.openingBalance : 0,
      balance: Math.abs(runningBalance),
      balanceType: runningBalance >= 0 ? 'Dr' : 'Cr'
    });

    vouchers.forEach(voucher => {
      voucher.entries.forEach(entry => {
        if (entry.ledger._id.toString() === ledgerId.toString()) {
          const otherEntries = voucher.entries.filter(e => e.ledger._id.toString() !== ledgerId.toString());
          const particulars = otherEntries.map(e => e.ledger.name).join(', ');
          
          if (entry.type === 'Dr') {
            runningBalance += entry.amount;
          } else {
            runningBalance -= entry.amount;
          }

          transactions.push({
            date: voucher.date,
            voucherNumber: voucher.voucherNumber,
            voucherType: voucher.voucherType,
            particulars,
            debit: entry.type === 'Dr' ? entry.amount : 0,
            credit: entry.type === 'Cr' ? entry.amount : 0,
            balance: Math.abs(runningBalance),
            balanceType: runningBalance >= 0 ? 'Dr' : 'Cr',
            narration: voucher.narration
          });
        }
      });
    });

    res.json({
      ledger: ledger.name,
      group: ledger.group,
      openingBalance: ledger.openingBalance,
      openingBalanceType: ledger.balanceType,
      transactions,
      closingBalance: Math.abs(runningBalance),
      closingBalanceType: runningBalance >= 0 ? 'Dr' : 'Cr'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;