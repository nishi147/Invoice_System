import express from 'express';
import {
  recordPayment,
  getPaymentsByInvoice,
  deletePayment,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('super_admin', 'accountant'), recordPayment);

router.route('/invoice/:invoiceId')
  .get(protect, getPaymentsByInvoice);

router.route('/:id')
  .delete(protect, authorize('super_admin'), deletePayment);

export default router;
