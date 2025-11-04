const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub';

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

// Order Schema (simplified)
const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function updateDeliveredOrdersPaymentStatus() {
  try {
    await connectDB();
    console.log('✅ Connected to database...');

    // Update all delivered orders with pending payment to paid
    const result = await Order.updateMany(
      { 
        status: 'delivered', 
        paymentStatus: 'pending' 
      },
      { 
        $set: { paymentStatus: 'paid' } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} delivered order(s) to 'paid' payment status`);

    // Also update completed orders
    const result2 = await Order.updateMany(
      { 
        status: 'completed', 
        paymentStatus: 'pending' 
      },
      { 
        $set: { paymentStatus: 'paid' } 
      }
    );

    console.log(`✅ Updated ${result2.modifiedCount} completed order(s) to 'paid' payment status`);

    // Update cancelled orders to refunded
    const result3 = await Order.updateMany(
      { 
        status: 'cancelled', 
        paymentStatus: 'pending' 
      },
      { 
        $set: { paymentStatus: 'refunded' } 
      }
    );

    console.log(`✅ Updated ${result3.modifiedCount} cancelled order(s) to 'refunded' payment status`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating orders:', error);
    process.exit(1);
  }
}

updateDeliveredOrdersPaymentStatus();
