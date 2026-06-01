import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import CompanySettings from '../models/CompanySettings.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';
import { sendNotification } from '../services/socketService.js';

// Helper to calculate totals server-side for integrity
const calculateInvoiceTotals = (items, discountRate = 0, tdsRate = 0) => {
  let subtotal = 0;
  let taxAmount = 0;

  items.forEach((item) => {
    const itemSubtotal = item.quantity * item.rate;
    item.amount = itemSubtotal;
    subtotal += itemSubtotal;

    const itemTax = (itemSubtotal * (item.taxRate || 0)) / 100;
    taxAmount += itemTax;
  });

  const discountAmount = (subtotal * discountRate) / 100;
  const tdsAmount = (subtotal * tdsRate) / 100;
  const grandTotal = subtotal + taxAmount - discountAmount - tdsAmount;

  return {
    items,
    subtotal,
    taxAmount,
    discountAmount,
    tdsAmount,
    grandTotal,
  };
};

// @desc    Get all invoices (paginated with search & filters)
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;
    const filter = {};

    // Apply Status Filter
    if (status) {
      filter.status = status;
    }

    // Apply Date Range Filter
    if (startDate && endDate) {
      filter.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Apply Search Filter (Client Name or Invoice Number)
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'clientDetailsSnapshot.name': { $regex: search, $options: 'i' } },
        { 'clientDetailsSnapshot.company': { $regex: search, $options: 'i' } },
      ];
    }

    const totalInvoices = await Invoice.countDocuments(filter);
    const invoices = await Invoice.find(filter)
      .populate('client', 'name company email')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalInvoices / limit),
        totalInvoices,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice by sharing token (Public portal)
// @route   GET /api/invoices/public/:token
// @access  Public
export const getInvoiceBySharingToken = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ sharingToken: req.params.token }).populate('client');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found or invalid link' });
    }

    // Update status to "viewed" if it was "sent"
    if (invoice.status === 'sent') {
      invoice.status = 'viewed';
      await invoice.save();

      // Audit Log
      await AuditLog.create({
        action: 'INVOICE_VIEWED_PUBLIC',
        details: `Invoice ${invoice.invoiceNumber} viewed by client via shared portal link`,
        ipAddress: req.ip,
      });

      // Notify users
      const alert = await Notification.create({
        title: 'Invoice Viewed',
        message: `Client viewed invoice ${invoice.invoiceNumber}`,
        type: 'info',
        recipientRole: 'all',
        link: `/invoices/${invoice._id}`,
      });
      sendNotification(alert);
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  const { client, invoiceDate, dueDate, items, discountRate, tdsRate, templateType, currency, notes, terms, invoiceNumber } = req.body;

  try {
    const clientData = await Client.findById(client);
    if (!clientData) {
      return res.status(404).json({ success: false, message: 'Selected client not found' });
    }

    // Server-side calculations
    const totals = calculateInvoiceTotals(items, discountRate, tdsRate);

    const invoice = new Invoice({
      invoiceNumber,
      client,
      clientDetailsSnapshot: {
        name: clientData.name,
        company: clientData.company,
        email: clientData.email,
        phone: clientData.phone,
        gstNumber: clientData.gstNumber,
        address: clientData.address,
      },
      invoiceDate,
      dueDate,
      items: totals.items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountRate,
      discountAmount: totals.discountAmount,
      tdsRate,
      tdsAmount: totals.tdsAmount,
      grandTotal: totals.grandTotal,
      balanceDue: totals.grandTotal, // initially balance = total
      templateType,
      currency,
      notes,
      terms,
      createdBy: req.user._id,
    });

    await invoice.save();

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_CREATE',
      details: `Created invoice: ${invoice.invoiceNumber} for client: ${clientData.name}`,
      ipAddress: req.ip,
    });

    // Notify team
    const alert = await Notification.create({
      title: 'New Invoice Created',
      message: `Invoice ${invoice.invoiceNumber} has been drafted by ${req.user.name}`,
      type: 'info',
      recipientRole: 'all',
      link: `/invoices/${invoice._id}`,
    });
    sendNotification(alert);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid' && req.body.status !== 'draft') {
      // Prevent editing paid invoices without reason, but allow admin
      if (req.user.role !== 'super_admin') {
        return res.status(400).json({ success: false, message: 'Cannot edit fully paid invoices' });
      }
    }

    const { items, discountRate, tdsRate, client } = req.body;
    let computedTotals = {};

    if (items) {
      computedTotals = calculateInvoiceTotals(items, discountRate || invoice.discountRate, tdsRate || invoice.tdsRate);
      req.body.subtotal = computedTotals.subtotal;
      req.body.taxAmount = computedTotals.taxAmount;
      req.body.discountAmount = computedTotals.discountAmount;
      req.body.tdsAmount = computedTotals.tdsAmount;
      req.body.grandTotal = computedTotals.grandTotal;
      req.body.balanceDue = computedTotals.grandTotal - (req.body.paidAmount || invoice.paidAmount);
    }

    if (client && client !== invoice.client.toString()) {
      const clientData = await Client.findById(client);
      if (clientData) {
        req.body.clientDetailsSnapshot = {
          name: clientData.name,
          company: clientData.company,
          email: clientData.email,
          phone: clientData.phone,
          gstNumber: clientData.gstNumber,
          address: clientData.address,
        };
      }
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_UPDATE',
      details: `Updated invoice: ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: updatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate invoice
// @route   POST /api/invoices/:id/duplicate
// @access  Private
export const duplicateInvoice = async (req, res) => {
  try {
    const srcInvoice = await Invoice.findById(req.params.id);

    if (!srcInvoice) {
      return res.status(404).json({ success: false, message: 'Source invoice not found' });
    }

    // Build new clone object
    const clonedInvoiceObj = srcInvoice.toObject();
    delete clonedInvoiceObj._id;
    delete clonedInvoiceObj.invoiceNumber;
    delete clonedInvoiceObj.paidAmount;
    delete clonedInvoiceObj.createdAt;
    delete clonedInvoiceObj.updatedAt;

    clonedInvoiceObj.invoiceDate = new Date();
    // Default due date to +15 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    clonedInvoiceObj.dueDate = dueDate;

    clonedInvoiceObj.status = 'draft';
    clonedInvoiceObj.createdBy = req.user._id;

    const newInvoice = new Invoice(clonedInvoiceObj);
    await newInvoice.save();

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_DUPLICATE',
      details: `Duplicated invoice ${srcInvoice.invoiceNumber} as ${newInvoice.invoiceNumber}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel invoice
// @route   POST /api/invoices/:id/cancel
// @access  Private
export const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'cancelled';
    await invoice.save();

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_CANCEL',
      details: `Cancelled invoice: ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Invoice cancelled successfully', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Public (so clients can download their PDFs easily without logging in, or authenticated users)
export const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch company settings
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({}); // fallback default settings
    }

    const pdfBuffer = await generateInvoicePDF(invoice, settings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send invoice PDF by email
// @route   POST /api/invoices/:id/send
// @access  Private
export const sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch company settings
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    const clientInfo = invoice.clientDetailsSnapshot || invoice.client;

    if (!clientInfo.email) {
      return res.status(400).json({ success: false, message: "Client profile has no email address configured" });
    }

    // Generate PDF Buffer
    const pdfBuffer = await generateInvoicePDF(invoice, settings);

    // Email Body HTML
    const portalUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/portal/invoice/${invoice.sharingToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Invoice from ${settings.name}</h2>
        <p>Dear ${clientInfo.name},</p>
        <p>We appreciate your business. Here is invoice <strong>${invoice.invoiceNumber}</strong> amounting to <strong>${invoice.currency} ${invoice.grandTotal.toFixed(2)}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #4b5563; padding: 4px 0;">Invoice Number:</td>
              <td style="font-weight: bold; text-align: right; padding: 4px 0;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="color: #4b5563; padding: 4px 0;">Due Date:</td>
              <td style="font-weight: bold; text-align: right; padding: 4px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="color: #4b5563; padding: 4px 0;">Total Amount:</td>
              <td style="font-weight: bold; text-align: right; color: #4f46e5; padding: 4px 0;">${invoice.currency} ${invoice.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="color: #4b5563; padding: 4px 0;">Balance Due:</td>
              <td style="font-weight: bold; text-align: right; color: #dc2626; padding: 4px 0;">${invoice.currency} ${invoice.balanceDue.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 25px 0; text-align: center;">
          <a href="${portalUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View & Pay Invoice</a>
        </p>

        <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
          Note: We have also attached a professional PDF copy of the invoice for your reference.
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Powered by Manshu Finance Systems</p>
      </div>
    `;

    // Send the email
    const emailResult = await sendEmail({
      to: clientInfo.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${settings.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Update status to Sent (if it was draft)
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    // Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_SEND_EMAIL',
      details: `Emailed invoice ${invoice.invoiceNumber} to client: ${clientInfo.email}`,
      ipAddress: req.ip,
    });

    // Notify team
    const alert = await Notification.create({
      title: 'Invoice Sent to Client',
      message: `Invoice ${invoice.invoiceNumber} was successfully emailed to ${clientInfo.email}`,
      type: 'success',
      recipientRole: 'all',
      link: `/invoices/${invoice._id}`,
    });
    sendNotification(alert);

    res.json({
      success: true,
      message: `Invoice emailed successfully to ${clientInfo.email}`,
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Super Admin Only)
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'INVOICE_DELETE',
      details: `Deleted invoice: ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
