import express from 'express';
import {
  getSettings,
  updateSettings,
  exportBackup,
  importRestore,
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('super_admin', 'accountant'), updateSettings);

router.get('/backup', protect, authorize('super_admin'), exportBackup);
router.post('/restore', protect, authorize('super_admin'), importRestore);

export default router;
