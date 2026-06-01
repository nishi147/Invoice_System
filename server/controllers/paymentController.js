import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { sendNotification } from '../services/socketService.js';

// @desc    Record a payment against an invoice
// @route   POST /api/payments
// @access  Private (Super Admin, Accountant)
export const recordPayment = async (req, res) => {
  const { invoiceId, amount, paymentDate, paymentMode, transactionId, notes } = req.body;

  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.balanceDue <= 0) {
      return res.status(400).json({ success: false, message: 'This invoice is already fully paid' });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds balance due (${invoice.balanceDue})`,
      });
    }

    // 1. Create payment entry
    const payment = new Payment({
      invoice: invoiceId,
      amount: paymentAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMode,
      transactionId,
      notes,
      recordedBy: req.user._id,
    });

    await payment.save();

    // 2. Update Invoice totals
    invoice.paidAmount += paymentAmount;
    invoice.balanceDue = invoice.grandTotal - invoice.paidAmount;

    // Determine status
    if (invoice.balanceDue <= 0.01) {
      invoice.balanceDue = 0;
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }

    await invoice.save();

    // 3. Create Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'PAYMENT_RECORD',
      details: `Recorded payment of ${paymentAmount} for invoice ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
    });

    // 4. Create real-time notification
    const alert = await Notification.create({
      title: 'Payment Received',
      message: `Payment of ${invoice.currency} ${paymentAmount} received for invoice ${invoice.invoiceNumber}`,
      type: 'success',
      recipientRole: 'all',
      link: `/invoices/${invoice._id}`,
    });
    sendNotification(alert);

    res.status(201).json({ success: true, data: payment, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment history for a specific invoice
// @route   GET /api/payments/invoice/:invoiceId
// @access  Private
export const getPaymentsByInvoice = async (req, res) => {
  try {
    const payments = await Payment.find({ invoice: req.params.invoiceId })
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a payment (and reverse invoice balance)
// @route   DELETE /api/payments/:id
// @access  Private (Super Admin Only)
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      // Reverse payment totals
      invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
      invoice.balanceDue = invoice.grandTotal - invoice.paidAmount;

      if (invoice.paidAmount === 0) {
        invoice.status = 'sent'; // revert back to sent
      } else {
        invoice.status = 'partially_paid';
      }

      await invoice.save();
    }

    await Payment.findByIdAndDelete(req.params.id);

    // Audit Log
    await AuditLog.create({
      user: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: 'PAYMENT_DELETE',
      details: `Deleted payment of ${payment.amount} for invoice ${invoice ? invoice.invoiceNumber : 'unknown'}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Payment deleted and invoice balance reverted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
