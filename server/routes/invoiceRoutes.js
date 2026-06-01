import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  getInvoiceBySharingToken,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  duplicateInvoice,
  cancelInvoice,
  downloadInvoicePDF,
  sendInvoiceEmail,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible routes (for client portal and downloads)
router.get('/public/:token', getInvoiceBySharingToken);
router.get('/:id/pdf', downloadInvoicePDF);

// Protected routes
router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, authorize('super_admin'), deleteInvoice);

router.post('/:id/duplicate', protect, duplicateInvoice);
router.post('/:id/cancel', protect, cancelInvoice);
router.post('/:id/send', protect, sendInvoiceEmail);

export default router;
