import mongoose, { Schema, Document } from 'mongoose';

export interface ITopFarmersConfig extends Document {
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
    performance: Array<{
      id: string;
      name: string;
      enabled: boolean;
      order: number;
    }>;
    categories: Array<{
      id: string;
      name: string;
      slug: string;
      enabled: boolean;
      order: number;
    }>;
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
  topFarmersCriteria: {
    salesWeight: number;
    ratingWeight: number;
    productCountWeight: number;
    reviewCountWeight: number;
    recentActivityWeight: number;
    minSalesForTopFarmer: number;
    minRatingForTopFarmer: number;
    minProductsForTopFarmer: number;
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

const TopFarmersConfigSchema = new Schema<ITopFarmersConfig>({
  banner: {
    title: { type: String, required: true, default: 'Top Farmers' },
    subtitle: { type: String, required: true, default: 'Meet our highest-rated and most productive farmers' },
    buttonText: { type: String, required: true, default: 'Explore Farmers' },
    buttonLink: { type: String, required: true, default: '#farmers' },
    heroImage: { 
      type: String, 
      required: true, 
      default: process.env.DEFAULT_TOP_FARMERS_HERO_IMAGE || '/images/top-farmers-hero.jpg' 
    },
    backgroundColor: { type: String, default: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)' },
    textColor: { type: String, default: '#1E3A2F' },
    enabled: { type: Boolean, default: true }
  },
  filters: {
    performance: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      enabled: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
    categories: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      slug: { type: String, required: true },
      enabled: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
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
    defaultSort: { type: String, default: 'top_rated' }
  },
  topFarmersCriteria: {
    salesWeight: { type: Number, default: 0.3 },
    ratingWeight: { type: Number, default: 0.3 },
    productCountWeight: { type: Number, default: 0.2 },
    reviewCountWeight: { type: Number, default: 0.1 },
    recentActivityWeight: { type: Number, default: 0.1 },
    minSalesForTopFarmer: { type: Number, default: 5 },
    minRatingForTopFarmer: { type: Number, default: 4.0 },
    minProductsForTopFarmer: { type: Number, default: 3 },
    timeframeDays: { type: Number, default: 30 }
  },
  pagination: {
    itemsPerPage: { type: Number, default: 10 },
    maxItemsPerPage: { type: Number, default: 50 }
  },
  cacheSettings: {
    ttlMinutes: { type: Number, default: 30 },
    enabled: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'topfarmersconfigs'
});

// Ensure only one active config exists
TopFarmersConfigSchema.pre('save', async function(next) {
  if (this.isActive && this.isNew) {
    await (this.constructor as mongoose.Model<ITopFarmersConfig>).updateMany({ isActive: true }, { isActive: false });
  }
  next();
});

export default mongoose.models.TopFarmersConfig || mongoose.model<ITopFarmersConfig>('TopFarmersConfig', TopFarmersConfigSchema);