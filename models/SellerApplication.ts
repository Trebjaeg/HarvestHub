import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISellerApplication extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  // Government ID - Front Side
  governmentIdFrontKey: string;
  governmentIdFrontOriginalName: string;
  governmentIdFrontSize: number;
  governmentIdFrontMimeType: string;
  // Government ID - Back Side
  governmentIdBackKey: string;
  governmentIdBackOriginalName: string;
  governmentIdBackSize: number;
  governmentIdBackMimeType: string;
  // BIR Document
  birDocumentKey: string;
  birDocumentOriginalName: string;
  birDocumentSize: number;
  birDocumentMimeType: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  auditTrail: {
    action: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    reason?: string;
    metadata?: Record<string, any>;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SellerApplicationSchema = new Schema<ISellerApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
    // Government ID - Front Side
    governmentIdFrontKey: {
      type: String,
      required: true,
    },
    governmentIdFrontOriginalName: {
      type: String,
      required: true,
    },
    governmentIdFrontSize: {
      type: Number,
      required: true,
    },
    governmentIdFrontMimeType: {
      type: String,
      required: true,
    },
    // Government ID - Back Side
    governmentIdBackKey: {
      type: String,
      required: true,
    },
    governmentIdBackOriginalName: {
      type: String,
      required: true,
    },
    governmentIdBackSize: {
      type: Number,
      required: true,
    },
    governmentIdBackMimeType: {
      type: String,
      required: true,
    },
    // BIR Document
    birDocumentKey: {
      type: String,
      required: true,
    },
    birDocumentOriginalName: {
      type: String,
      required: true,
    },
    birDocumentSize: {
      type: Number,
      required: true,
    },
    birDocumentMimeType: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    auditTrail: [
      {
        action: {
          type: String,
          enum: ['submitted', 'approved', 'rejected', 'resubmitted'],
          required: true,
        },
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        performedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        reason: String,
        metadata: Schema.Types.Mixed,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one active application per user
SellerApplicationSchema.index({ userId: 1, status: 1 });

// Add audit trail entry before saving
SellerApplicationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'submitted',
      performedBy: this.userId,
      performedAt: new Date(),
      metadata: {
        governmentIdName: this.governmentIdOriginalName,
        birDocumentName: this.birDocumentOriginalName,
      },
    });
  }
  next();
});

const SellerApplication: Model<ISellerApplication> =
  mongoose.models.SellerApplication ||
  mongoose.model<ISellerApplication>('SellerApplication', SellerApplicationSchema);

export default SellerApplication;
