import CompanySettings from '../models/CompanySettings.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get company settings (create if none exist)
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();

    if (!settings) {
      // Create a default settings document
      settings = await CompanySettings.create({
        name: 'Manshu Finance & Invoice Management System',
        email: 'billing@manshufinance.com',
        phone: '+91 99999 99999',
        address: {
          street: '123 Business Park',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India',
        },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update company settings
// @route   PUT /api/settings
// @access  Private (Super Admin, Accountant)
export const updateSettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();

    if (!settings) {
      settings = new CompanySettings(req.body);
    } else {
      settings = await CompanySettings.findByIdAndUpdate(
        settings._id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    await settings.save();

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'SETTINGS_UPDATE',
      details: 'Updated company configuration settings',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    System backup (Export database collections as JSON)
// @route   GET /api/settings/backup
// @access  Private (Super Admin Only)
export const exportBackup = async (req, res) => {
  try {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      users: await User.find({}),
      clients: await Client.find({}),
      invoices: await Invoice.find({}),
      payments: await Payment.find({}),
      expenses: await Expense.find({}),
      settings: await CompanySettings.find({}),
      notifications: await Notification.find({}),
      auditLogs: await AuditLog.find({}),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=manshu_finance_backup_${Date.now()}.json`);
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    System restore (Import database collections from JSON)
// @route   POST /api/settings/restore
// @access  Private (Super Admin Only)
export const importRestore = async (req, res) => {
  try {
    const { users, clients, invoices, payments, expenses, settings, notifications, auditLogs } = req.body;

    if (!users || !clients || !invoices || !expenses) {
      return res.status(400).json({ success: false, message: 'Invalid backup format' });
    }

    // Clear existing collections
    await User.deleteMany({});
    await Client.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await CompanySettings.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    // Import collections
    if (users.length) await User.insertMany(users);
    if (clients.length) await Client.insertMany(clients);
    if (invoices.length) await Invoice.insertMany(invoices);
    if (payments.length) await Payment.insertMany(payments);
    if (expenses.length) await Expense.insertMany(expenses);
    if (settings.length) await CompanySettings.insertMany(settings);
    if (notifications.length) await Notification.insertMany(notifications);
    if (auditLogs.length) await AuditLog.insertMany(auditLogs);

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'SYSTEM_RESTORE',
      details: 'Full system restore executed from backup file',
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'System database successfully restored!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
