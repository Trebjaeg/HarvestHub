// Quick script to check database status
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check Users collection
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const totalUsers = await User.countDocuments();
    const sellers = await User.countDocuments({ role: { $in: ['seller', 'farmer'] } });
    const activeSellers = await User.countDocuments({ 
      role: { $in: ['seller', 'farmer'] },
      accountStatus: 'active'
    });

    console.log('\n📊 USER STATS:');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total sellers/farmers: ${sellers}`);
    console.log(`Active sellers/farmers: ${activeSellers}`);

    // Get first active seller
    const firstSeller = await User.findOne({ 
      role: { $in: ['seller', 'farmer'] },
      accountStatus: 'active'
    }).select('_id firstName lastName email role');

    if (firstSeller) {
      console.log('\n✅ FIRST ACTIVE SELLER:');
      console.log(`ID: ${firstSeller._id}`);
      console.log(`Name: ${firstSeller.firstName} ${firstSeller.lastName}`);
      console.log(`Email: ${firstSeller.email}`);
      console.log(`Role: ${firstSeller.role}`);
      console.log(`\n🔗 TEST URL: http://localhost:3000/seller/${firstSeller._id}`);
    } else {
      console.log('\n❌ NO ACTIVE SELLERS FOUND');
    }

    // Check Products collection
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    console.log('\n📦 PRODUCT STATS:');
    console.log(`Total products: ${totalProducts}`);
    console.log(`Active products: ${activeProducts}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
