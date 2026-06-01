import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `receipt-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter (images & pdfs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Images (jpeg/jpg/png) and PDFs are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

router.route('/')
  .get(protect, getExpenses)
  .post(protect, upload.single('receipt'), createExpense);

router.route('/:id')
  .get(protect, getExpenseById)
  .put(protect, upload.single('receipt'), updateExpense)
  .delete(protect, authorize('super_admin', 'accountant'), deleteExpense);

export default router;
