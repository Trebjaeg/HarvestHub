/**
 * Scheduled script to check for low stock products and send notifications
 * This can be run as a cron job or scheduled task
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for low stock monitoring');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check for low stock products
const checkLowStockProducts = async () => {
  try {
    // Dynamic import to use ES modules
    const { default: Product } = await import('../models/Product.js');
    const { default: Notification } = await import('../models/Notification.js');
    const { notifyLowStock } = await import('../lib/notification-utils.js');

    console.log('🔍 Checking for low stock products...');

    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockAlert"] }
    }).select('name stock lowStockAlert unit farmerId _id').lean();

    console.log(`📦 Found ${lowStockProducts.length} products with low stock`);

    let notificationsSent = 0;

    for (const product of lowStockProducts) {
      // Check for recent notifications to avoid spam
      const recentAlert = await Notification.findOne({
        userId: product.farmerId,
        type: 'low_stock_alert',
        'metadata.productId': product._id.toString(),
        'metadata.currentStock': product.stock,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).lean();

      if (!recentAlert) {
        await notifyLowStock(
          product.farmerId,
          product.name,
          product._id.toString(),
          product.stock,
          product.lowStockAlert || 5,
          product.unit || 'pcs'
        );
        notificationsSent++;
        
        console.log(`📢 Sent low stock alert for ${product.name} (${product.stock} ${product.unit} remaining)`);
      }
    }

    console.log(`✅ Low stock monitoring completed. ${notificationsSent} notifications sent.`);
    return {
      productsChecked: lowStockProducts.length,
      notificationsSent
    };
  } catch (error) {
    console.error('❌ Error in low stock monitoring:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    const results = await checkLowStockProducts();
    
    console.log('\n📊 Low Stock Monitoring Results:');
    console.log(`• Products checked: ${results.productsChecked}`);
    console.log(`• Notifications sent: ${results.notificationsSent}`);
    
  } catch (error) {
    console.error('❌ Low stock monitoring failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkLowStockProducts,
  connectDB
};