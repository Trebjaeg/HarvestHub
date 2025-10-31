import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import jwt from 'jsonwebtoken';
import inventoryManager from '../../../../../lib/inventory-manager';
import mongoose from 'mongoose';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { orderId } = req.query;

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const buyerId = decoded.userId || decoded.id;

    if (!buyerId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      buyerId: buyerId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Buyer can cancel if status is 'pending' or 'confirmed' (with different restrictions)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: order.status === 'preparing' || order.status === 'shipped' || order.status === 'delivered'
          ? 'Order has been confirmed by seller and is being processed - cannot be cancelled'
          : 'Order cannot be cancelled at this stage',
        locked: true
      });
    }

    // For confirmed orders, add additional restrictions
    if (order.status === 'confirmed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order has been confirmed by seller and cannot be cancelled',
        locked: true
      });
    }

    // Prepare inventory items from order (if inventory management is available)
    let inventoryItems = [];
    if (order.products && Array.isArray(order.products)) {
      inventoryItems = order.products.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity
      }));
    }

    // Start transaction for atomic cancel + inventory release (if inventory manager is available)
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      // Try to release reserved inventory back to available (if inventory manager exists)
      if (inventoryItems.length > 0 && inventoryManager) {
        try {
          const releaseResult = await inventoryManager.releaseReservedInventory(inventoryItems, session);
          
          if (!releaseResult.success) {
            console.warn('Failed to release some inventory items:', releaseResult.failedItems);
            // Continue with cancellation even if inventory release partially fails
          }
        } catch (inventoryError) {
          console.warn('Inventory release failed, continuing with order cancellation:', inventoryError);
          // Continue with cancellation even if inventory system fails
        }
      }

      // Update order status to cancelled
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { 
          status: 'cancelled',
          updatedAt: new Date()
        },
        { new: true, session }
      ).lean();

      // Commit transaction
      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully' + (inventoryItems.length > 0 ? '. Inventory has been released.' : ''),
        order: {
          _id: updatedOrder._id.toString(),
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status
        }
      });

    } catch (transactionError) {
      if (session) {
        await session.abortTransaction();
      }
      console.error('Transaction error:', transactionError);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
        error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
      });
    } finally {
      if (session) {
        session.endSession();
      }
    }

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}