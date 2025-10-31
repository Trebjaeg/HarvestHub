import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../../lib/mongodb';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';
import jwt from 'jsonwebtoken';
import inventoryManager from '../../../../../lib/inventory-manager';
import mongoose from 'mongoose';
import { cache } from '../../../../../lib/memory-cache';
import { sendOrderConfirmationEmail } from '../../../../../lib/email-service-sendgrid';
import { sendOrderModificationEmail } from '../../../../../lib/email-service-sendgrid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract and verify JWT token
    const token = req.cookies.token || 
                 req.cookies['auth-token'] || 
                 req.cookies['hh_token'] ||
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const sellerId = decoded.userId || decoded.id;

    if (!sellerId) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Connect to database
    await dbConnect();

    const { orderId } = req.query;
    const { status, notes } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify seller owns this order
    if (order.sellerId !== sellerId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this order' });
    }

    // Validate status transitions
    const currentStatus = order.status;
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': ['completed'],
      'cancelled': [],
      'completed': []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot transition from ${currentStatus} to ${status}` 
      });
    }

    // Prepare inventory items from order
    const inventoryItems = order.products.map((p: any) => ({
      productId: typeof p.productId === 'string' ? p.productId : p.productId.toString(),
      quantity: p.quantity
    }));

    // Start transaction for atomic status + inventory update
    const session = await mongoose.startSession();
    session.startTransaction();

    // Track deleted products and original amount across the transaction
    let deletedProductsInfo: any[] = [];
    let originalAmount = order.totalAmount;

    try {
      // Handle inventory transitions based on status change
      if (status === 'confirmed' && currentStatus === 'pending') {
        // First, ensure products have inventory fields and check if inventory was reserved
        let needsReservation = false;
        const deletedProducts: any[] = [];
        const availableItems: typeof inventoryItems = [];
        
        for (const item of inventoryItems) {
          // Try to find product with proper ObjectId conversion
          let product;
          try {
            product = await Product.findById(item.productId).session(session);
          } catch (err) {
            // If ObjectId is invalid, mark as deleted
            const orderProduct = order.products.find((p: any) => 
              (typeof p.productId === 'string' ? p.productId : p.productId.toString()) === item.productId
            );
            deletedProducts.push(orderProduct);
            continue;
          }
          
          if (!product) {
            // Product was deleted - mark it
            const orderProduct = order.products.find((p: any) => 
              (typeof p.productId === 'string' ? p.productId : p.productId.toString()) === item.productId
            );
            deletedProducts.push(orderProduct);
            continue;
          }
          
          // Product exists - add to available items
          availableItems.push(item);
          
          // Migrate if needed
          if ((product.inventory_on_hand === undefined || product.inventory_on_hand === 0) && product.stock > 0) {
            await Product.findByIdAndUpdate(
              item.productId,
              {
                $set: {
                  inventory_on_hand: product.stock,
                  inventory_available: product.stock,
                  inventory_reserved: 0,
                  inventory_committed: 0
                }
              },
              { session }
            );
            needsReservation = true;
          } else if ((product.inventory_reserved ?? 0) === 0) {
            // Inventory not reserved for this order (old order before migration)
            needsReservation = true;
          }
        }
        
        // If ALL products are deleted, abort - cannot confirm empty order
        if (availableItems.length === 0) {
          await session.abortTransaction();
          session.endSession();
          
          return res.status(400).json({
            success: false,
            message: 'Cannot confirm order. All products have been deleted.',
            details: deletedProducts.map((p: any) => ({
              productName: p.productName,
              reason: 'Product no longer exists'
            }))
          });
        }
        
        // If SOME products are deleted, remove them from order and recalculate
        if (deletedProducts.length > 0) {
          // Remove deleted products from order
          const remainingProducts = order.products.filter((p: any) => {
            const prodId = typeof p.productId === 'string' ? p.productId : p.productId.toString();
            return availableItems.some(item => item.productId === prodId);
          });
          
          // Recalculate order totals
          const newTotalAmount = remainingProducts.reduce((sum: number, p: any) => 
            sum + (p.price * p.quantity), 0
          );
          const deliveryFee = order.deliveryFee || 0;
          const newFinalAmount = newTotalAmount + deliveryFee;
          
          // Update order products and totals
          await Order.findByIdAndUpdate(
            orderId,
            {
              $set: {
                products: remainingProducts,
                totalAmount: newTotalAmount,
                finalAmount: newFinalAmount,
                notes: `${order.notes || ''}\n\nNote: ${deletedProducts.length} product(s) were removed as they are no longer available: ${deletedProducts.map((p: any) => p.productName).join(', ')}`
              }
            },
            { session }
          );
          
          // Update the order object for later use
          order.products = remainingProducts;
          order.totalAmount = newTotalAmount;
          order.finalAmount = newFinalAmount;
          
          // Store deleted products info for response
          deletedProductsInfo = deletedProducts.map((p: any) => ({
            productName: p.productName,
            quantity: p.quantity,
            price: p.price
          }));
        }
        
        // If inventory wasn't reserved, reserve it now from available stock
        if (needsReservation) {
          const reserveResult = await inventoryManager.reserveInventory(availableItems, session);
          if (!reserveResult.success) {
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
              success: false,
              message: 'Cannot confirm order. Insufficient stock available.',
              details: reserveResult.failedItems
            });
          }
        }
        
        // Now commit: reserved → committed (only for available items)
        const commitResult = await inventoryManager.commitInventory(availableItems, session);
        if (!commitResult.success) {
          await session.abortTransaction();
          session.endSession();
          
          // Get detailed product info for debugging
          const productDetails = await Promise.all(
            inventoryItems.map(async (item) => {
              const product = await Product.findById(item.productId).select('name inventory_reserved inventory_committed inventory_available').lean();
              return {
                productId: item.productId,
                requestedQty: item.quantity,
                product: product ? {
                  name: product.name,
                  reserved: product.inventory_reserved,
                  committed: product.inventory_committed,
                  available: product.inventory_available
                } : null
              };
            })
          );
          
          return res.status(400).json({
            success: false,
            message: 'Failed to commit inventory. Please check if products have sufficient reserved stock.',
            details: commitResult.failedItems,
            productDetails
          });
        }
      } else if (status === 'cancelled' && currentStatus === 'pending') {
        // Seller cancels before confirm: Try to release reserved inventory (if any)
        // Don't fail if products don't exist - order might be old or products deleted
        try {
          const releaseResult = await inventoryManager.releaseReservedInventory(inventoryItems, session);
          // Even if release fails, allow cancellation (products might be deleted)
        } catch (err) {
          // Ignore inventory release errors on cancellation
        }
      } else if (status === 'cancelled' && currentStatus === 'confirmed') {
        // Seller cancels after confirm: Try to release committed inventory
        try {
          const releaseResult = await inventoryManager.releaseCommittedInventory(inventoryItems, session);
          // Even if release fails, allow cancellation
        } catch (err) {
          // Ignore inventory release errors on cancellation
        }
      } else if (status === 'completed' && currentStatus === 'delivered') {
        // Order completed: committed → removed from on_hand
        const fulfillResult = await inventoryManager.fulfillOrder(inventoryItems, session);
        if (!fulfillResult.success) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: 'Failed to fulfill order',
            details: fulfillResult.failedItems
          });
        }
      }

      // Update order
      const updateData: any = { status };

      // Add notes if provided
      if (notes) {
        updateData.notes = notes;
      }

      // Set actual delivery date when delivered
      if (status === 'delivered') {
        updateData.actualDelivery = new Date();
      }

      // Set estimated delivery when confirmed (7 days from now)
      if (status === 'confirmed' && !order.estimatedDelivery) {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
        updateData.estimatedDelivery = estimatedDelivery;
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, session }
      ).lean();

      // Commit transaction - both inventory and order status update succeed
      await session.commitTransaction();

      // Send order confirmation email to buyer when order is confirmed
      if (status === 'confirmed') {
        try {
          // If products were deleted, send modification email instead
          if (deletedProductsInfo.length > 0) {
            await sendOrderModificationEmail(updatedOrder.buyerEmail, {
              orderNumber: updatedOrder.orderNumber,
              buyerName: updatedOrder.buyerName,
              sellerName: updatedOrder.sellerName || 'Seller',
              deletedProducts: deletedProductsInfo,
              remainingProducts: updatedOrder.products.map((p: any) => ({
                productName: p.productName,
                quantity: p.quantity,
                price: p.price,
                unit: p.unit || 'pcs'
              })),
              originalAmount: originalAmount,
              newTotalAmount: updatedOrder.totalAmount,
              deliveryFee: updatedOrder.deliveryFee || 0,
              newFinalAmount: updatedOrder.finalAmount,
              deliveryAddress: updatedOrder.deliveryAddress,
              estimatedDelivery: updatedOrder.estimatedDelivery
            });
          } else {
            // Normal confirmation email
            await sendOrderConfirmationEmail(updatedOrder.buyerEmail, {
              orderNumber: updatedOrder.orderNumber,
              buyerName: updatedOrder.buyerName,
              sellerName: updatedOrder.sellerName || 'Seller',
              products: updatedOrder.products.map((p: any) => ({
                productName: p.productName,
                quantity: p.quantity,
                price: p.price,
                unit: p.unit || 'pcs'
              })),
              totalAmount: updatedOrder.totalAmount,
              deliveryFee: updatedOrder.deliveryFee || 0,
              finalAmount: updatedOrder.finalAmount,
              deliveryAddress: updatedOrder.deliveryAddress,
              estimatedDelivery: updatedOrder.estimatedDelivery,
              paymentMethod: updatedOrder.paymentMethod || 'Cash on Delivery'
            });
          }
        } catch (emailError) {
          // Don't fail the request if email fails - just continue
        }
      }

      // Clear all order-related caches for real-time updates
      const cachePatterns = [
        `orders:*`,
        `order:${orderId}`,
        `seller:orders:${sellerId}:*`,
        `buyer:orders:${updatedOrder.buyerId}:*`,
        `products:*`, // Product inventory changed
        `product:*`
      ];
      
      for (const pattern of cachePatterns) {
        try {
          cache.delPattern(pattern);
        } catch (e) {
          // Silent fail - cache clear is not critical
        }
      }

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        order: {
          _id: updatedOrder._id.toString(),
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          estimatedDelivery: updatedOrder.estimatedDelivery,
          actualDelivery: updatedOrder.actualDelivery,
          notes: updatedOrder.notes
        },
        ...(deletedProductsInfo.length > 0 && {
          warning: `${deletedProductsInfo.length} product(s) were removed from this order as they are no longer available.`,
          deletedProducts: deletedProductsInfo
        })
      });

    } catch (transactionError) {
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: process.env.NODE_ENV === 'development' ? (transactionError as Error).message : undefined
      });
    } finally {
      session.endSession();
    }

  } catch (error) {
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Authentication token expired';
      statusCode = 401;
    }

    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage
    });
  }
}
