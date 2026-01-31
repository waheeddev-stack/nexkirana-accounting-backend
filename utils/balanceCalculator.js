const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');

class BalanceCalculator {
  static async calculateLedgerBalance(ledgerId, companyId, upToDate = new Date()) {
    try {
      // Get ledger details
      const ledger = await Ledger.findById(ledgerId);
      if (!ledger) {
        throw new Error('Ledger not found');
      }

      // Start with opening balance
      let debitTotal = ledger.balanceType === 'Dr' ? ledger.openingBalance : 0;
      let creditTotal = ledger.balanceType === 'Cr' ? ledger.openingBalance : 0;

      // Get all vouchers affecting this ledger up to the specified date
      const vouchers = await Voucher.find({
        company: companyId,
        'entries.ledger': ledgerId,
        date: { $lte: upToDate }
      }).sort({ date: 1 });

      // Calculate running totals
      vouchers.forEach(voucher => {
        voucher.entries.forEach(entry => {
          if (entry.ledger.toString() === ledgerId.toString()) {
            if (entry.type === 'Dr') {
              debitTotal += entry.amount;
            } else {
              creditTotal += entry.amount;
            }
          }
        });
      });

      // Determine final balance
      const netBalance = debitTotal - creditTotal;
      const balanceType = netBalance >= 0 ? 'Dr' : 'Cr';
      const balanceAmount = Math.abs(netBalance);

      return {
        ledger: ledger.name,
        group: ledger.group,
        debitTotal,
        creditTotal,
        balance: balanceAmount,
        balanceType,
        openingBalance: ledger.openingBalance,
        openingBalanceType: ledger.balanceType
      };
    } catch (error) {
      throw error;
    }
  }

  static async generateTrialBalance(companyId, startDate, endDate) {
    try {
      const ledgers = await Ledger.find({ company: companyId, isActive: true });
      const trialBalance = [];

      for (const ledger of ledgers) {
        const balance = await this.calculateLedgerBalance(ledger._id, companyId, endDate);
        
        // Only include ledgers with non-zero balances or transactions
        if (balance.debitTotal > 0 || balance.creditTotal > 0) {
          trialBalance.push({
            ledger: balance.ledger,
            group: balance.group,
            debit: balance.balanceType === 'Dr' ? balance.balance : 0,
            credit: balance.balanceType === 'Cr' ? balance.balance : 0
          });
        }
      }

      return trialBalance;
    } catch (error) {
      throw error;
    }
  }

  static async generateProfitLoss(companyId, startDate, endDate) {
    try {
      const incomeGroups = ['Sales Accounts', 'Direct Incomes', 'Indirect Incomes', 'Income'];
      const expenseGroups = ['Purchase Accounts', 'Direct Expenses', 'Indirect Expenses', 'Expenses'];

      const ledgers = await Ledger.find({ 
        company: companyId, 
        isActive: true,
        group: { $in: [...incomeGroups, ...expenseGroups] }
      });

      let totalIncome = 0;
      let totalExpenses = 0;
      const incomeDetails = [];
      const expenseDetails = [];

      for (const ledger of ledgers) {
        const balance = await this.calculateLedgerBalance(ledger._id, companyId, endDate);
        
        if (incomeGroups.includes(ledger.group)) {
          const amount = balance.balanceType === 'Cr' ? balance.balance : -balance.balance;
          totalIncome += amount;
          if (amount !== 0) {
            incomeDetails.push({
              ledger: balance.ledger,
              group: balance.group,
              amount: Math.abs(amount)
            });
          }
        } else if (expenseGroups.includes(ledger.group)) {
          const amount = balance.balanceType === 'Dr' ? balance.balance : -balance.balance;
          totalExpenses += amount;
          if (amount !== 0) {
            expenseDetails.push({
              ledger: balance.ledger,
              group: balance.group,
              amount: Math.abs(amount)
            });
          }
        }
      }

      const netProfit = totalIncome - totalExpenses;

      return {
        income: {
          details: incomeDetails,
          total: totalIncome
        },
        expenses: {
          details: expenseDetails,
          total: totalExpenses
        },
        netProfit,
        isProfit: netProfit >= 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = BalanceCalculator;