import mongoose, { Schema, Document } from 'mongoose';

export interface IBestSellerConfig extends Document {
  _id: string;
  banner: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    heroImage: string;
    backgroundColor?: string;
    textColor?: string;
    enabled: boolean;
  };
  filters: {
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      enabled: boolean;
      order: number;
    }>;
    priceRange: {
      min: number;
      max: number;
      step: number;
    };
    ratings: {
      enabled: boolean;
      minRating: number;
      maxRating: number;
    };
  };
  sorting: {
    options: Array<{
      id: string;
      name: string;
      field: string;
      direction: 'asc' | 'desc';
      enabled: boolean;
      order: number;
    }>;
    defaultSort: string;
  };
  bestSellerCriteria: {
    salesCountWeight: number;
    ratingWeight: number;
    viewsWeight: number;
    recentSalesWeight: number;
    minSalesForBestSeller: number;
    minRatingForBestSeller: number;
    minViewsForBestSeller: number;
    timeframeDays: number;
  };
  pagination: {
    itemsPerPage: number;
    maxItemsPerPage: number;
  };
  cacheSettings: {
    ttlMinutes: number;
    enabled: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BestSellerConfigSchema = new Schema<IBestSellerConfig>({
  banner: {
    title: { type: String, required: true, default: 'Our Best Sellers' },
    subtitle: { type: String, required: true, default: 'Most loved farm-fresh picks by our customers this season' },
    buttonText: { type: String, required: true, default: 'Shop Now' },
    buttonLink: { type: String, required: true, default: '#products' },
    heroImage: { type: String, required: true, default: '/images/best-sellers-hero.jpg' },
    backgroundColor: { type: String, default: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)' },
    textColor: { type: String, default: '#1E3A2F' },
    enabled: { type: Boolean, default: true }
  },
  filters: {
    categories: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      slug: { type: String, required: true },
      enabled: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
    priceRange: {
      min: { type: Number, default: 10 },
      max: { type: Number, default: 1500 },
      step: { type: Number, default: 10 }
    },
    ratings: {
      enabled: { type: Boolean, default: true },
      minRating: { type: Number, default: 1 },
      maxRating: { type: Number, default: 5 }
    }
  },
  sorting: {
    options: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      field: { type: String, required: true },
      direction: { type: String, enum: ['asc', 'desc'], required: true },
      enabled: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
    defaultSort: { type: String, default: 'best_seller_rank' }
  },
  bestSellerCriteria: {
    salesCountWeight: { type: Number, default: 0.4 },
    ratingWeight: { type: Number, default: 0.3 },
    viewsWeight: { type: Number, default: 0.2 },
    recentSalesWeight: { type: Number, default: 0.1 },
    minSalesForBestSeller: { type: Number, default: 10 },
    minRatingForBestSeller: { type: Number, default: 4.0 },
    minViewsForBestSeller: { type: Number, default: 100 },
    timeframeDays: { type: Number, default: 30 }
  },
  pagination: {
    itemsPerPage: { type: Number, default: 12 },
    maxItemsPerPage: { type: Number, default: 50 }
  },
  cacheSettings: {
    ttlMinutes: { type: Number, default: 30 },
    enabled: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'bestsellerconfigs'
});

// Ensure only one active config exists
BestSellerConfigSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    await this.constructor.updateMany({ isActive: true }, { isActive: false });
  }
  next();
});

export default mongoose.models.BestSellerConfig || mongoose.model<IBestSellerConfig>('BestSellerConfig', BestSellerConfigSchema);