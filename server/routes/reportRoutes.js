import express from 'express';
import {
  getDashboardStats,
  exportReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/export', protect, exportReport);

export default router;
