import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  reportedBy: mongoose.Types.ObjectId;
  reporterName: string;
  reporterEmail: string;
  sellerId: mongoose.Types.ObjectId;
  sellerName: string;
  reason: 'scam' | 'fake_product' | 'misleading_info' | 'poor_quality' | 'counterfeit' | 'other';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productName: {
      type: String,
      required: true
    },
    productImage: {
      type: String
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reporterName: {
      type: String,
      required: true
    },
    reporterEmail: {
      type: String,
      required: true
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sellerName: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      enum: ['scam', 'fake_product', 'misleading_info', 'poor_quality', 'counterfeit', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    adminNotes: {
      type: String,
      maxlength: 2000
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ sellerId: 1, status: 1 });
ReportSchema.index({ priority: -1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
