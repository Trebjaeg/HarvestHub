import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  _id: string;
  productId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  buyerName: string;
  sellerId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: string[]; // URLs to uploaded review images
  helpful: number; // Count of helpful votes
  verified: boolean; // Verified purchase
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  followUpReviews?: Array<{
    comment: string;
    createdAt: Date;
  }>;
  status: 'active' | 'flagged' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 5; // Max 5 images per review
        },
        message: 'Maximum 5 images allowed per review',
      },
    },
    helpful: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: true, // Always true if linked to order
    },
    sellerResponse: {
      comment: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      respondedAt: Date,
    },
    followUpReviews: [
      {
        comment: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'flagged', 'removed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reviews per order
ReviewSchema.index({ orderId: 1, productId: 1, buyerId: 1 }, { unique: true });

// Index for efficient queries
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

// Index for buyer testimonials query (status + verified + rating + createdAt)
ReviewSchema.index({ status: 1, verified: 1, rating: -1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
