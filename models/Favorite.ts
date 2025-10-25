import mongoose from 'mongoose';

export interface IFavorite {
  _id?: string;
  buyerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  productCategory: string;
  sellerId: string;
  sellerName: string;
  isActive: boolean; // To handle if product is still available
  dateAdded: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new mongoose.Schema<IFavorite>({
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true,
    min: 0
  },
  productImage: {
    type: String,
    default: null
  },
  productCategory: {
    type: String,
    required: true
  },
  sellerId: {
    type: String,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites
FavoriteSchema.index({ buyerId: 1, productId: 1 }, { unique: true });

// Indexes for better performance
FavoriteSchema.index({ buyerId: 1, dateAdded: -1 });
FavoriteSchema.index({ buyerId: 1, productPrice: 1 });
FavoriteSchema.index({ buyerId: 1, productCategory: 1 });

export default mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);