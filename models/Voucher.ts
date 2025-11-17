import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  description: string;
  type: 'free_delivery' | 'percentage' | 'fixed_amount';
  value: number; // percentage (e.g., 10 for 10%) or fixed amount
  minimumPurchase: number;
  maxDiscount?: number; // maximum discount for percentage vouchers
  maxUsage: number; // 0 = unlimited
  currentUsage: number;
  maxUsagePerUser: number; // 0 = unlimited
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  forNewUsersOnly: boolean;
  usedBy: Array<{
    userId: string;
    usedAt: Date;
    orderId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['free_delivery', 'percentage', 'fixed_amount'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscount: {
      type: Number,
      min: 0
    },
    maxUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    maxUsagePerUser: {
      type: Number,
      default: 1,
      min: 0
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    forNewUsersOnly: {
      type: Boolean,
      default: false
    },
    usedBy: [{
      userId: {
        type: String,
        required: true
      },
      usedAt: {
        type: Date,
        default: Date.now
      },
      orderId: String
    }]
  },
  {
    timestamps: true
  }
);

// Index for faster lookups
VoucherSchema.index({ code: 1 });
VoucherSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

const Voucher: Model<IVoucher> = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);

export default Voucher;
