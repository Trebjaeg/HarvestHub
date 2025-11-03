const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub';

async function checkAndUpdateOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database');

    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

    // Check all recent orders
    const allOrders = await Order.find({}).sort({ orderDate: -1 }).limit(10).lean();
    
    console.log('\n📦 Recent Orders:');
    allOrders.forEach(o => {
      console.log(`\n- Order: ${o.orderNumber}`);
      console.log(`  Status: ${o.status}`);
      console.log(`  Payment Status: ${o.paymentStatus}`);
    });

    // Update delivered orders
    console.log('\n\n🔄 Updating payment status...\n');
    
    const delivered = await Order.updateMany(
      { status: 'delivered', paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid' } }
    );
    console.log(`✅ Delivered orders updated: ${delivered.modifiedCount}`);

    const completed = await Order.updateMany(
      { status: 'completed', paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid' } }
    );
    console.log(`✅ Completed orders updated: ${completed.modifiedCount}`);

    const cancelled = await Order.updateMany(
      { status: 'cancelled', paymentStatus: { $ne: 'refunded' } },
      { $set: { paymentStatus: 'refunded' } }
    );
    console.log(`✅ Cancelled orders updated: ${cancelled.modifiedCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndUpdateOrders();
