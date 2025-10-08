import mongoose from 'mongoose';

export interface IProduct {
  _id?: string;
  name: string;
  category: string;
  price: number;
  unit: string; // 'kg', 'piece', 'bundle', etc.
  originalPrice?: number; // For showing discounts
  image: string;
  description?: string;
  farmerId: string; // Reference to the farmer who posted
  farmerName: string;
  location?: string;
  stock: number;
  isOrganic: boolean;
  harvestDate?: Date;
  isActive: boolean;
  tags?: string[];
  featured: boolean;
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
    enum: [
      'Fresh Vegetables',
      'Fruits',
      'Leafy Greens', 
      'Root Crops',
      'Grains and Rice',
      'Spices and Aromatics',
      'Eggplant and Gourds',
      'Herbs',
      'Others'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'piece', 'bundle', 'grams', 'lbs']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
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
  }
}, {
  timestamps: true
});

// Index for better performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ farmerId: 1 });
ProductSchema.index({ featured: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);