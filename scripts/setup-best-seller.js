/**
 * Script to initialize the Best Seller configuration in the database
 * Run this script to set up the default configuration for the Best Seller page
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define the BestSellerConfig schema directly in the script
const BestSellerConfigSchema = new mongoose.Schema({
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

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize Best Seller configuration
const initializeBestSellerConfig = async () => {
  try {
    console.log('🔍 Checking for existing Best Seller configuration...');
    
    const BestSellerConfig = mongoose.model('BestSellerConfig', BestSellerConfigSchema);
    
    // Check if configuration already exists
    const existingConfig = await BestSellerConfig.findOne({ isActive: true });
    
    if (existingConfig) {
      console.log('✅ Best Seller configuration already exists');
      console.log('Current configuration:');
      console.log('- Banner Title:', existingConfig.banner.title);
      console.log('- Categories:', existingConfig.filters.categories.length);
      console.log('- Sort Options:', existingConfig.sorting.options.length);
      return;
    }

    console.log('📝 Creating default Best Seller configuration...');

    const defaultConfig = new BestSellerConfig({
      banner: {
        title: 'Our Best Sellers',
        subtitle: 'Most loved farm-fresh picks by our customers this season',
        buttonText: 'Shop Now',
        buttonLink: '#products',
        heroImage: '/images/best-sellers-hero.jpg',
        backgroundColor: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)',
        textColor: '#1E3A2F',
        enabled: true
      },
      filters: {
        categories: [
          { id: 'all', name: 'All', slug: 'all', enabled: true, order: 0 },
          { id: 'leafy-greens', name: 'Leafy Greens', slug: 'leafy-greens', enabled: true, order: 1 },
          { id: 'root-crops', name: 'Root Crops', slug: 'root-crops', enabled: true, order: 2 },
          { id: 'fruits', name: 'Fruits', slug: 'fruits', enabled: true, order: 3 },
          { id: 'spices-aromatics', name: 'Spices & Aromatics', slug: 'spices-aromatics', enabled: true, order: 4 },
          { id: 'eggplant-gourds', name: 'Eggplant & Gourds', slug: 'eggplant-gourds', enabled: true, order: 5 },
          { id: 'grains-rice', name: 'Grains & Rice', slug: 'grains-rice', enabled: true, order: 6 }
        ],
        priceRange: { min: 10, max: 1500, step: 10 },
        ratings: { enabled: true, minRating: 1, maxRating: 5 }
      },
      sorting: {
        options: [
          { id: 'best_seller_rank', name: 'Best Seller Rank', field: 'bestSellerScore', direction: 'desc', enabled: true, order: 0 },
          { id: 'price_asc', name: 'Price: Low to High', field: 'currentPrice', direction: 'asc', enabled: true, order: 1 },
          { id: 'price_desc', name: 'Price: High to Low', field: 'currentPrice', direction: 'desc', enabled: true, order: 2 },
          { id: 'newest', name: 'Newest', field: 'createdAt', direction: 'desc', enabled: true, order: 3 },
          { id: 'name', name: 'Name', field: 'name', direction: 'asc', enabled: true, order: 4 }
        ],
        defaultSort: 'best_seller_rank'
      },
      bestSellerCriteria: {
        salesCountWeight: 0.4,
        ratingWeight: 0.3,
        viewsWeight: 0.2,
        recentSalesWeight: 0.1,
        minSalesForBestSeller: 10,
        minRatingForBestSeller: 4.0,
        minViewsForBestSeller: 100,
        timeframeDays: 30
      },
      pagination: { itemsPerPage: 12, maxItemsPerPage: 50 },
      cacheSettings: { ttlMinutes: 30, enabled: true },
      isActive: true
    });

    await defaultConfig.save();
    
    console.log('✅ Default Best Seller configuration created successfully!');
    console.log('📊 Configuration details:');
    console.log('- Banner Title:', defaultConfig.banner.title);
    console.log('- Categories configured:', defaultConfig.filters.categories.length);
    console.log('- Sort options:', defaultConfig.sorting.options.length);
    console.log('- Best seller criteria weights:');
    console.log('  • Sales Count: 40%');
    console.log('  • Rating: 30%');
    console.log('  • Views: 20%');
    console.log('  • Recent Activity: 10%');
    console.log('- Cache TTL:', defaultConfig.cacheSettings.ttlMinutes, 'minutes');

  } catch (error) {
    console.error('❌ Error creating Best Seller configuration:', error);
    throw error;
  }
};

// Define Product schema
const ProductSchema = new mongoose.Schema({
  name: String,
  status: String,
  salesCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

// Update existing products with best seller metrics (for demo purposes)
const updateProductMetrics = async () => {
  try {
    console.log('📈 Updating product metrics for best seller demonstration...');
    
    const Product = mongoose.model('Product', ProductSchema);
    
    // Get some products to make them best sellers
    const products = await Product.find({ status: 'active' }).limit(20);
    
    if (products.length === 0) {
      console.log('⚠️  No products found to update. Please seed products first.');
      return;
    }

    // Update products with varying metrics to demonstrate best seller algorithm
    const updates = products.map((product, index) => {
      const salesCount = Math.floor(Math.random() * 100) + 10; // 10-110 sales
      const views = Math.floor(Math.random() * 1000) + 100; // 100-1100 views
      const averageRating = Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0-5.0 rating
      
      return Product.updateOne(
        { _id: product._id },
        { 
          $set: { 
            salesCount,
            views,
            averageRating,
            updatedAt: new Date()
          }
        }
      );
    });

    await Promise.all(updates);
    
    console.log(`✅ Updated ${products.length} products with best seller metrics`);
    console.log('📊 Products now have randomized:');
    console.log('- Sales counts (10-110)');
    console.log('- View counts (100-1100)');
    console.log('- Average ratings (3.0-5.0)');

  } catch (error) {
    console.error('❌ Error updating product metrics:', error);
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Initializing Best Seller Page Configuration...\n');
    
    await connectDB();
    await initializeBestSellerConfig();
    await updateProductMetrics();
    
    console.log('\n🎉 Best Seller page is now ready!');
    console.log('🌐 Visit /best-seller to see the dynamic page in action');
    console.log('⚙️  Configuration can be updated through the database or admin panel');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { initializeBestSellerConfig, updateProductMetrics };