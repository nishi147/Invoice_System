import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Salaries', 'Marketing', 'Software', 'Office', 'Travel', 'Utilities', 'Other'],
      required: true,
      default: 'Other',
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Expense amount must be greater than zero'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Card', 'UPI', 'Cheque', 'Other'],
      required: true,
      default: 'Card',
    },
    vendor: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String, // Path to receipt image/PDF uploaded
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
