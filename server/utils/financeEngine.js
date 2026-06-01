import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';

export const calculateFinanceSummary = async () => {
  // 1. Fetch all invoices and expenses
  const invoices = await Invoice.find({ status: { $ne: 'draft' } });
  const expenses = await Expense.find({});

  // 2. Core variables
  let totalRevenue = 0;
  let outstandingAmount = 0;
  let totalOverdueAmount = 0;
  let unpaidInvoiceCount = 0;

  const now = new Date();

  // 3. Process invoices
  invoices.forEach((inv) => {
    // Revenue is calculated as the sum of recorded paid amounts (cash inflow)
    totalRevenue += inv.paidAmount;
    outstandingAmount += inv.balanceDue;

    if (inv.balanceDue > 0) {
      unpaidInvoiceCount += 1;
      // Overdue calculation
      if (new Date(inv.dueDate) < now && inv.status !== 'paid') {
        totalOverdueAmount += inv.balanceDue;
      }
    }
  });

  // 4. Process expenses
  let totalExpenses = 0;
  expenses.forEach((exp) => {
    totalExpenses += exp.amount;
  });

  // 5. Net Profit
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // 6. Calculate monthly numbers
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Filter items for current month
  const currentMonthInvoices = invoices.filter(inv => new Date(inv.invoiceDate) >= currentMonthStart);
  const currentMonthExpenses = expenses.filter(exp => new Date(exp.date) >= currentMonthStart);

  // Filter items for previous month (for growth metrics)
  const prevMonthInvoices = invoices.filter(inv => {
    const d = new Date(inv.invoiceDate);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  let currentMonthRevenue = 0;
  currentMonthInvoices.forEach(inv => {
    currentMonthRevenue += inv.paidAmount;
  });

  let prevMonthRevenue = 0;
  prevMonthInvoices.forEach(inv => {
    prevMonthRevenue += inv.paidAmount;
  });

  let currentMonthExpensesSum = 0;
  currentMonthExpenses.forEach(exp => {
    currentMonthExpensesSum += exp.amount;
  });

  // Growth rates
  let revenueGrowthPercent = 0;
  if (prevMonthRevenue > 0) {
    revenueGrowthPercent = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
  } else if (currentMonthRevenue > 0) {
    revenueGrowthPercent = 100; // 100% growth if starting from zero
  }

  // Monthly average (historical)
  // Let's group invoices by month/year to find the average
  const revenueByMonth = {};
  invoices.forEach(inv => {
    const key = `${new Date(inv.invoiceDate).getFullYear()}-${new Date(inv.invoiceDate).getMonth() + 1}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + inv.paidAmount;
  });

  const activeMonths = Object.keys(revenueByMonth).length;
  const averageMonthlyRevenue = activeMonths > 0 
    ? Object.values(revenueByMonth).reduce((a, b) => a + b, 0) / activeMonths 
    : 0;

  // Expense breakdown by category
  const expenseBreakdown = {
    Salaries: 0,
    Marketing: 0,
    Software: 0,
    Office: 0,
    Travel: 0,
    Utilities: 0,
    Other: 0
  };

  expenses.forEach(exp => {
    if (expenseBreakdown[exp.category] !== undefined) {
      expenseBreakdown[exp.category] += exp.amount;
    } else {
      expenseBreakdown['Other'] += exp.amount;
    }
  });

  return {
    totalRevenue,
    currentMonthRevenue,
    revenueGrowthPercent,
    outstandingAmount,
    totalOverdueAmount,
    unpaidInvoiceCount,
    totalExpenses,
    currentMonthExpenses: currentMonthExpensesSum,
    expenseBreakdown,
    netProfit,
    profitMarginPercent,
    averageMonthlyRevenue,
    cashFlow: {
      receivables: outstandingAmount,
      payables: 0, // Mock or match with expenses pending if any
    }
  };
};
