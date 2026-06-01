import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate must be positive'],
  },
  taxRate: {
    type: Number,
    default: 0, // GST percentage e.g. 18 for 18%
  },
  amount: {
    type: Number,
    required: true,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    // Store snapshot of client details to preserve invoice history
    clientDetailsSnapshot: {
      name: String,
      company: String,
      email: String,
      phone: String,
      gstNumber: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    tdsAmount: {
      type: Number,
      default: 0,
    },
    tdsRate: {
      type: Number,
      default: 0, // TDS percentage e.g. 1% or 2%
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountRate: {
      type: Number,
      default: 0, // discount percentage
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    templateType: {
      type: String,
      enum: ['classic', 'modern', 'corporate', 'minimal'],
      default: 'modern',
    },
    currency: {
      type: String,
      default: 'INR', // INR, USD, EUR, etc.
    },
    sharingToken: {
      type: String,
      unique: true,
    },
    qrCodeContent: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    terms: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate sequential invoice number if not provided
invoiceSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate sharing token
    this.sharingToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    if (!this.invoiceNumber) {
      const year = new Date(this.invoiceDate).getFullYear();
      const count = await this.constructor.countDocuments({
        invoiceDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      });
      this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }
  }
  
  // Ensure math calculations are correct before saving
  this.balanceDue = Math.max(0, this.grandTotal - this.paidAmount);
  if (this.balanceDue === 0 && this.grandTotal > 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0 && this.balanceDue > 0) {
    this.status = 'partially_paid';
  }
  
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
