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
  stock: number; // Legacy field - kept for backward compatibility (equals inventory_on_hand)
  // New inventory management fields
  inventory_on_hand: number; // Total physical inventory
  inventory_available: number; // Available for purchase (on_hand - reserved - committed)
  inventory_reserved: number; // Reserved by pending orders (not yet confirmed by seller)
  inventory_committed: number; // Committed to confirmed orders (seller confirmed)
  sku?: string; // Stock Keeping Unit - unique identifier
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
    min: [0, 'Stock cannot be negative'],
    default: function() {
      return this.inventory_on_hand || 0;
    }
  },
  // New inventory tracking fields
  inventory_on_hand: {
    type: Number,
    required: [true, 'Inventory on hand is required'],
    min: [0, 'Inventory on hand cannot be negative'],
    default: 0
  },
  inventory_available: {
    type: Number,
    required: [true, 'Inventory available is required'],
    min: [0, 'Inventory available cannot be negative'],
    default: function() {
      return this.inventory_on_hand || 0;
    }
  },
  inventory_reserved: {
    type: Number,
    min: [0, 'Inventory reserved cannot be negative'],
    default: 0
  },
  inventory_committed: {
    type: Number,
    min: [0, 'Inventory committed cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values for backward compatibility
    trim: true,
    uppercase: true,
    maxlength: [50, 'SKU cannot exceed 50 characters']
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
ProductSchema.index({ inventory_available: 1 }); // Available inventory queries
ProductSchema.index({ inventory_reserved: 1 }); // Reserved inventory tracking
ProductSchema.index({ inventory_committed: 1 }); // Committed inventory tracking
// Compound indexes for common queries
ProductSchema.index({ category: 1, isActive: 1, createdAt: -1 }); // Category + active + newest
ProductSchema.index({ category: 1, isActive: 1, price: 1 }); // Category + active + price
ProductSchema.index({ isActive: 1, featured: 1, createdAt: -1 }); // Active featured products
ProductSchema.index({ farmerId: 1, isActive: 1, createdAt: -1 }); // Farmer products sorted
ProductSchema.index({ farmerId: 1, inventory_available: 1 }); // Farmer inventory management
ProductSchema.index({ isActive: 1, inventory_available: 1 }); // Top-rated products query
// Note: sku index is automatically created by unique: true in schema definition

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

/**
 * Check for low stock products and send notifications
 */
export async function checkLowStockAlerts(sellerId?: string): Promise<void> {
  try {
    const query: any = {
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    };
    
    if (sellerId) {
      query.farmerId = sellerId;
    }

    const lowStockProducts = await mongoose.models.Product.find(query)
      .select('name stock lowStockAlert unit farmerId')
      .lean();

    // Import notification function dynamically to avoid circular imports
    const { notifyLowStock } = await import('../lib/notification-utils');

    for (const product of lowStockProducts) {
      // Check if we already sent a notification for this stock level
      const Notification = (await import('../models/Notification')).default;
      const recentAlert = await Notification.findOne({
        userId: product.farmerId,
        type: 'low_stock_alert',
        'metadata.productId': product._id.toString(),
        'metadata.currentStock': product.stock,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).lean();

      // Only send notification if we haven't sent one for this stock level recently
      if (!recentAlert) {
        await notifyLowStock(
          product.farmerId,
          product.name,
          product._id.toString(),
          product.stock,
          product.lowStockAlert || 5,
          product.unit || 'pcs'
        );
      }
    }
  } catch (error) {
    console.error('Error checking low stock alerts:', error);
  }
}