import mongoose from 'mongoose';

export interface IProduct {
  _id?: string;
  name: string;
  category: string;
  price: number;
  unit: string; // 'kg', 'piece', 'bundle', etc.
  originalPrice?: number; // For showing discounts
  image: string;
  images?: string[]; // For multiple images
  description?: string;
  farmerId: string; // Reference to the farmer who posted
  farmerName: string;
  location?: string;
  stock: number;
  status?: string; // 'Available', 'Out of Stock', 'Coming Soon'
  isOrganic: boolean;
  harvestDate?: Date;
  isActive: boolean;
  tags?: string[];
  featured: boolean;
  rating?: number; // Average rating from reviews
  reviews?: number; // Total number of reviews
  lowStockAlert?: number; // Stock level threshold for low stock alerts
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new mongoose.Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required']
  },
  farmerName: {
    type: String,
    required: [true, 'Farmer name is required']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative']
  },
  status: {
    type: String,
    default: 'Available'
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  harvestDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  reviews: {
    type: Number,
    min: [0, 'Reviews count cannot be negative'],
    default: 0
  },
  lowStockAlert: {
    type: Number,
    min: [0, 'Low stock alert cannot be negative'],
    default: 5
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ category: 1, isActive: 1 }); // Category filtering
ProductSchema.index({ farmerId: 1, isActive: 1 }); // Farmer's products
ProductSchema.index({ featured: 1, isActive: 1 }); // Featured products
ProductSchema.index({ name: 'text', description: 'text' }); // Text search
ProductSchema.index({ createdAt: -1 }); // Sort by newest
ProductSchema.index({ price: 1 }); // Sort by price
ProductSchema.index({ stock: 1, lowStockAlert: 1 }); // Low stock alerts

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);