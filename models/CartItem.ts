import mongoose from 'mongoose';

export interface ICartItem {
  _id?: string;
  userId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new mongoose.Schema<ICartItem>({
  userId: {
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },
  imageUrl: {
    type: String
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  sellerName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for faster queries
CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.models.CartItem || mongoose.model<ICartItem>('CartItem', CartItemSchema);
