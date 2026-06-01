import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/socketService.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all expenses (paginated with search & category filters)
// @route   GET /api/expenses
// @access  Private (Super Admin, Accountant, Staff)
export const getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, search, startDate, endDate } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const totalExpenses = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalExpenses / limit),
        totalExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private (Super Admin, Accountant, Staff)
export const createExpense = async (req, res) => {
  const { title, category, amount, date, paymentMethod, vendor, notes } = req.body;

  try {
    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const expense = new Expense({
      title,
      category,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      vendor,
      notes,
      receiptUrl,
      recordedBy: req.user._id,
    });

    await expense.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'EXPENSE_CREATE',
      details: `Created expense: ${title} (${category}) for ${amount}`,
      ipAddress: req.ip,
    });

    // Notify accountants/admins
    const alert = await Notification.create({
      title: 'Expense Recorded',
      message: `${req.user.name} recorded an expense of ${amount} for ${title} (${category})`,
      type: 'warning',
      recipientRole: 'accountant',
      link: '/expenses',
    });
    sendNotification(alert);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private (Super Admin, Accountant)
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.file) {
      // Remove old receipt file if it exists
      if (expense.receiptUrl) {
        const oldPath = path.join(process.cwd(), expense.receiptUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      req.body.receiptUrl = `/uploads/${req.file.filename}`;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'EXPENSE_UPDATE',
      details: `Updated expense: ${expense.title}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: updatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private (Super Admin, Accountant)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Delete receipt file physically if exists
    if (expense.receiptUrl) {
      const filePath = path.join(process.cwd(), expense.receiptUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Expense.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'EXPENSE_DELETE',
      details: `Deleted expense: ${expense.title} of ${expense.amount}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
