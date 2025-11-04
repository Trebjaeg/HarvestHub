import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Database connection
    await dbConnect();
    console.log('✅ Database connected successfully');
    
    // Test 2: Check if models are working
    console.log('🔍 Testing models...');
    
    // Count total documents in each collection
    const userCount = await User.countDocuments();
    console.log('✅ Users in database:', userCount);
    
    const productCount = await Product.countDocuments();
    console.log('✅ Products in database:', productCount);
    
    const orderCount = await Order.countDocuments();
    console.log('✅ Orders in database:', orderCount);
    
    // Test 3: Find some sample data
    console.log('🔍 Finding sample data...');
    
    const sampleUser = await User.findOne().select('_id name email role');
    console.log('✅ Sample user:', sampleUser);
    
    const sampleProduct = await Product.findOne().select('_id name farmerId isActive');
    console.log('✅ Sample product:', sampleProduct);
    
    const sampleOrder = await Order.findOne().select('_id sellerId status totalAmount');
    console.log('✅ Sample order:', sampleOrder);
    
    // Test 4: Test specific seller queries
    if (sampleProduct?.farmerId) {
      console.log('🔍 Testing seller-specific queries...');
      
      const sellerProducts = await Product.countDocuments({ 
        farmerId: sampleProduct.farmerId 
      });
      console.log('✅ Products for farmerId', sampleProduct.farmerId, ':', sellerProducts);
      
      if (sampleOrder?.sellerId) {
        const sellerOrders = await Order.countDocuments({ 
          sellerId: sampleOrder.sellerId 
        });
        console.log('✅ Orders for sellerId', sampleOrder.sellerId, ':', sellerOrders);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Database connection test completed successfully',
      data: {
        userCount,
        productCount,
        orderCount,
        sampleUser: sampleUser ? {
          id: sampleUser._id,
          name: sampleUser.name,
          role: sampleUser.role
        } : null,
        sampleProduct: sampleProduct ? {
          id: sampleProduct._id,
          name: sampleProduct.name,
          farmerId: sampleProduct.farmerId
        } : null,
        sampleOrder: sampleOrder ? {
          id: sampleOrder._id,
          sellerId: sampleOrder.sellerId,
          status: sampleOrder.status,
          amount: sampleOrder.totalAmount
        } : null
      }
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      }
    });
  }
}