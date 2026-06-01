import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import XLSX from 'xlsx';
import { calculateFinanceSummary } from '../utils/financeEngine.js';

// Helper to format date
const formatDate = (date) => new Date(date).toLocaleDateString();

// @desc    Get aggregated financial dashboard stats
// @route   GET /api/reports/dashboard-stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const summary = await calculateFinanceSummary();

    // Generate Chart Data (Last 6 Months)
    const chartData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      // Fetch invoice revenue for this month
      const monthlyPaidInvoices = await Invoice.find({
        status: { $ne: 'draft' },
        invoiceDate: { $gte: monthStart, $lte: monthEnd }
      });
      let revenue = 0;
      monthlyPaidInvoices.forEach(inv => {
        revenue += inv.paidAmount;
      });

      // Fetch expenses for this month
      const monthlyExpenses = await Expense.find({
        date: { $gte: monthStart, $lte: monthEnd }
      });
      let expenses = 0;
      monthlyExpenses.forEach(exp => {
        expenses += exp.amount;
      });

      chartData.push({
        month: monthLabel,
        revenue,
        expenses,
        profit: revenue - expenses,
      });
    }

    // Invoice Status Counts
    const statusCounts = [
      { name: 'Paid', value: await Invoice.countDocuments({ status: 'paid' }), color: '#10b981' },
      { name: 'Pending', value: await Invoice.countDocuments({ status: { $in: ['sent', 'viewed', 'partially_paid'] } }), color: '#f59e0b' },
      { name: 'Overdue', value: await Invoice.countDocuments({ status: 'overdue' }), color: '#ef4444' },
      { name: 'Draft', value: await Invoice.countDocuments({ status: 'draft' }), color: '#6b7280' },
    ];

    res.json({
      success: true,
      data: {
        summary,
        chartData,
        statusCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export data to Excel/CSV/JSON
// @route   GET /api/reports/export
// @access  Private
export const exportReport = async (req, res) => {
  const { type, format } = req.query; // type = revenue, expenses, pandl, tax, outstanding; format = xlsx, csv

  try {
    let reportData = [];
    let filename = `report_${type}_${Date.now()}`;

    if (type === 'revenue') {
      const payments = await Payment.find({})
        .populate({
          path: 'invoice',
          populate: { path: 'client' },
        })
        .sort({ paymentDate: -1 });

      reportData = payments.map((pay) => ({
        'Payment Date': formatDate(pay.paymentDate),
        'Invoice Number': pay.invoice?.invoiceNumber || 'N/A',
        'Client Name': pay.invoice?.clientDetailsSnapshot?.name || pay.invoice?.client?.name || 'N/A',
        'Company': pay.invoice?.clientDetailsSnapshot?.company || pay.invoice?.client?.company || 'N/A',
        'Currency': pay.invoice?.currency || 'INR',
        'Total Invoice Amount': pay.invoice?.grandTotal || 0,
        'Amount Paid': pay.amount,
        'Payment Mode': pay.paymentMode,
        'Transaction ID': pay.transactionId || 'N/A',
        'Notes': pay.notes || '',
      }));
    } else if (type === 'expenses') {
      const expenses = await Expense.find({}).sort({ date: -1 });

      reportData = expenses.map((exp) => ({
        'Date': formatDate(exp.date),
        'Title': exp.title,
        'Category': exp.category,
        'Amount': exp.amount,
        'Payment Method': exp.paymentMethod,
        'Vendor': exp.vendor || 'N/A',
        'Notes': exp.notes || '',
      }));
    } else if (type === 'pandl') {
      // Monthly Profit & Loss Statement
      const invoices = await Invoice.find({ status: { $ne: 'draft' } });
      const expenses = await Expense.find({});

      // Group by month
      const months = {};
      invoices.forEach((inv) => {
        const key = `${new Date(inv.invoiceDate).getFullYear()}-${String(new Date(inv.invoiceDate).getMonth() + 1).padStart(2, '0')}`;
        if (!months[key]) months[key] = { revenue: 0, expenses: 0 };
        months[key].revenue += inv.paidAmount;
      });

      expenses.forEach((exp) => {
        const key = `${new Date(exp.date).getFullYear()}-${String(new Date(exp.date).getMonth() + 1).padStart(2, '0')}`;
        if (!months[key]) months[key] = { revenue: 0, expenses: 0 };
        months[key].expenses += exp.amount;
      });

      reportData = Object.keys(months)
        .sort()
        .map((month) => {
          const rev = months[month].revenue;
          const exp = months[month].expenses;
          return {
            'Month': month,
            'Revenue (Cash-in)': rev,
            'Expenses (Cash-out)': exp,
            'Net Profit': rev - exp,
            'Margin %': rev > 0 ? (((rev - exp) / rev) * 100).toFixed(2) + '%' : '0%',
          };
        });
    } else if (type === 'tax') {
      const invoices = await Invoice.find({ status: { $ne: 'draft' } }).sort({ invoiceDate: -1 });

      reportData = invoices.map((inv) => ({
        'Invoice Date': formatDate(inv.invoiceDate),
        'Invoice Number': inv.invoiceNumber,
        'Client Company': inv.clientDetailsSnapshot?.company || 'N/A',
        'Currency': inv.currency,
        'Subtotal': inv.subtotal,
        'GST / Tax Paid': inv.taxAmount,
        'TDS Deduction': inv.tdsAmount,
        'Grand Total': inv.grandTotal,
      }));
    } else if (type === 'outstanding') {
      const outstandingInvoices = await Invoice.find({
        status: { $in: ['sent', 'viewed', 'partially_paid', 'overdue'] },
        balanceDue: { $gt: 0 },
      }).sort({ dueDate: 1 });

      reportData = outstandingInvoices.map((inv) => {
        const daysOverdue = Math.max(0, Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)));
        return {
          'Invoice Number': inv.invoiceNumber,
          'Client Name': inv.clientDetailsSnapshot?.name || 'N/A',
          'Company': inv.clientDetailsSnapshot?.company || 'N/A',
          'Due Date': formatDate(inv.dueDate),
          'Days Overdue': daysOverdue,
          'Currency': inv.currency,
          'Grand Total': inv.grandTotal,
          'Paid Amount': inv.paidAmount,
          'Balance Due': inv.balanceDue,
          'Status': inv.status.toUpperCase(),
        };
      });
    }

    if (reportData.length === 0) {
      // Empty report helper row
      reportData.push({ 'Message': 'No data available for this report criteria' });
    }

    // Process formats
    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(reportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      return res.send(csv);
    } else {
      // Default to XLSX
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      return res.send(buffer);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
