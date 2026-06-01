import Client from '../models/Client.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get all clients (paginated with search)
// @route   GET /api/clients
// @access  Private (Super Admin, Accountant, Staff)
export const getClients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search || '';
    const filter = {};

    if (searchQuery) {
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { company: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const totalClients = await Client.countDocuments(filter);
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalClients / limit),
        totalClients,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get client profile with financial summary
// @route   GET /api/clients/:id
// @access  Private
export const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Get statistics
    const invoices = await Invoice.find({ client: client._id });
    
    let totalRevenue = 0;
    let outstandingAmount = 0;
    const invoiceIds = invoices.map(inv => inv._id);

    invoices.forEach((inv) => {
      totalRevenue += inv.paidAmount;
      outstandingAmount += inv.balanceDue;
    });

    // Get payment history associated with client's invoices
    const payments = await Payment.find({ invoice: { $in: invoiceIds } })
      .populate({
        path: 'invoice',
        select: 'invoiceNumber currency grandTotal',
      })
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        client,
        stats: {
          totalInvoicesCount: invoices.length,
          totalRevenueGenerated: totalRevenue,
          outstandingPayments: outstandingAmount,
        },
        invoices,
        paymentHistory: payments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Super Admin, Accountant, Staff)
export const createClient = async (req, res) => {
  const { name, company, email, phone, gstNumber, address } = req.body;

  try {
    const client = await Client.create({
      name,
      company,
      email,
      phone,
      gstNumber,
      address,
      owner: req.user._id,
    });

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'CLIENT_CREATE',
      details: `Created client: ${name} (${company})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update client details
// @route   PUT /api/clients/:id
// @access  Private (Super Admin, Accountant, Staff)
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'CLIENT_UPDATE',
      details: `Updated client profile: ${client.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: updatedClient });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete client (checks for invoices first)
// @route   DELETE /api/clients/:id
// @access  Private (Super Admin, Accountant)
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Check if client has invoices
    const hasInvoices = await Invoice.exists({ client: client._id });
    if (hasInvoices) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client. This client is associated with existing invoices.',
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'CLIENT_DELETE',
      details: `Deleted client: ${client.name}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
