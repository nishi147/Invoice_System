import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema({
  accountName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  bankName: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, default: '' },
  swiftCode: { type: String, trim: true, default: '' },
});

const companySettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      default: 'Manshu Finance Corp',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: 'billing@manshufinance.com',
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 99999 99999',
    },
    website: {
      type: String,
      trim: true,
      default: 'www.manshufinance.com',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    panNumber: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
    },
    signatureUrl: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: String,
      default: 'Thank you for your business. Payment is due within the stipulated time frame.',
    },
  },
  {
    timestamps: true,
  }
);

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

export default CompanySettings;
