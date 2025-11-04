import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  _id: string;
  title: string;
  subtitle: string;
  description?: string;
  discountPercentage: number; // e.g., 50 for 50% off
  discountType: 'percentage' | 'fixed'; // percentage or fixed amount
  discountValue: number; // actual discount amount
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableProducts?: string[]; // Product IDs
  applicableCategories?: string[]; // Category names
  minimumPurchase?: number; // Minimum amount for deal
  maxUsage?: number; // Maximum number of times deal can be used
  currentUsage: number; // Current usage count
  priority: number; // For ordering deals
  showCountdown: boolean;
  createdBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

const DealSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, 'Deal subtitle is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    buttonText: {
      type: String,
      required: [true, 'Button text is required'],
      default: 'Shop Now',
    },
    buttonLink: {
      type: String,
      required: [true, 'Button link is required'],
      default: '/deals',
    },
    backgroundColor: {
      type: String,
      default: '#DCFCE7', // Light green
    },
    textColor: {
      type: String,
      default: '#1E3A2F', // Dark green
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      index: true,
    },
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    applicableCategories: [{
      type: String,
      trim: true,
    }],
    minimumPurchase: {
      type: Number,
      min: [0, 'Minimum purchase cannot be negative'],
      default: 0,
    },
    maxUsage: {
      type: Number,
      min: [1, 'Max usage must be at least 1'],
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: [0, 'Current usage cannot be negative'],
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    showCountdown: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
DealSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
DealSchema.index({ priority: 1, startDate: 1 });
DealSchema.index({ applicableCategories: 1, isActive: 1 });

// Virtual for checking if deal is currently valid
DealSchema.virtual('isValid').get(function(this: IDeal) {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.maxUsage || this.currentUsage < this.maxUsage);
});

// Method to calculate time remaining
DealSchema.methods.getTimeRemaining = function(this: IDeal) {
  const now = new Date();
  const timeDiff = this.endDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: false };
};

export default mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);