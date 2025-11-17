import Notification, { INotification } from '@/models/Notification';
import { getIO } from './socket-server';
import dbConnect from './mongodb';

interface CreateNotificationParams {
  userId: string;
  userRole: 'buyer' | 'seller' | 'admin';
  type: INotification['type'];
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  metadata?: INotification['metadata'];
}

/**
 * Create a notification and emit it via Socket.IO
 */
export async function createNotification(params: CreateNotificationParams): Promise<INotification | null> {
  try {
    await dbConnect();
    
    const notification = await Notification.create({
      userId: params.userId,
      userRole: params.userRole,
      type: params.type,
      title: params.title,
      message: params.message,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      relatedUserId: params.relatedUserId,
      relatedUserName: params.relatedUserName,
      metadata: params.metadata,
      isRead: false
    });

    // Emit via Socket.IO if available
    const io = getIO();
    if (io) {
      const notificationPayload = {
        id: notification._id.toString(),
        title: notification.title,
        message: notification.message,
        type: notification.type,
        orderId: notification.orderId,
        orderNumber: notification.orderNumber,
        metadata: notification.metadata,
        createdAt: notification.createdAt.toISOString()
      };

      // Emit to user's personal room
      io.to(`user:${params.userId}`).emit('notifications:new', notificationPayload);
      
      // Also emit updated unread count
      const unreadCount = await getUnreadCount(params.userId);
      io.to(`user:${params.userId}`).emit('notifications:count', { unread: unreadCount });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    await dbConnect();
    return await Notification.countDocuments({ userId, isRead: false });
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Mark notifications as read
 */
export async function markAsRead(userId: string, notificationIds: string[]): Promise<boolean> {
  try {
    await dbConnect();
    
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        userId // Security: only mark user's own notifications
      },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );

    // Emit updated count via Socket.IO
    const io = getIO();
    if (io) {
      const unreadCount = await getUnreadCount(userId);
      io.to(`user:${userId}`).emit('notifications:count', { unread: unreadCount });
    }

    return true;
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return false;
  }
}

/**
 * Create notification for new order (notify seller)
 */
export async function notifyNewOrder(
  sellerId: string,
  orderNumber: string,
  orderId: string,
  buyerName: string,
  productNames: string[],
  totalAmount: number
): Promise<void> {
  const productCount = productNames.length;
  const productList = productCount === 1 
    ? productNames[0] 
    : `${productNames[0]} and ${productCount - 1} other${productCount > 2 ? 's' : ''}`;

  await createNotification({
    userId: sellerId,
    userRole: 'seller',
    type: 'order_created',
    title: 'New Order Received',
    message: `${buyerName} placed an order for ${productList}`,
    orderId,
    orderNumber,
    relatedUserId: '', // We don't store buyerId for privacy
    relatedUserName: buyerName,
    metadata: {
      productNames,
      productCount,
      totalAmount,
      actionUrl: `/seller/orders/${orderId}`
    }
  });
}

/**
 * Create notification for low stock alert (notify seller)
 */
export async function notifyLowStock(
  sellerId: string,
  productName: string,
  productId: string,
  currentStock: number,
  criticalLevel: number,
  unit: string
): Promise<void> {
  await createNotification({
    userId: sellerId,
    userRole: 'seller',
    type: 'low_stock_alert',
    title: 'Low Stock Alert',
    message: `${productName} is running low (${currentStock} ${unit} remaining)`,
    relatedUserId: productId,
    relatedUserName: productName,
    metadata: {
      productId,
      productName,
      currentStock,
      criticalLevel,
      unit,
      alertLevel: currentStock <= criticalLevel / 2 ? 'critical' : 'warning',
      actionUrl: `/products?edit=${productId}`
    }
  });
}

/**
 * Create notification for order status update (notify buyer)
 */
export async function notifyOrderStatusUpdate(
  buyerId: string,
  orderNumber: string,
  orderId: string,
  status: string,
  sellerName: string
): Promise<void> {
  const statusMessages: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Order Confirmed',
      message: `${sellerName} confirmed your order ${orderNumber}`
    },
    preparing: {
      title: 'Order Being Prepared',
      message: `${sellerName} is preparing your order ${orderNumber}`
    },
    shipped: {
      title: 'Order Shipped',
      message: `Your order ${orderNumber} has been shipped by ${sellerName}`
    },
    delivered: {
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered`
    },
    cancelled: {
      title: 'Order Cancelled',
      message: `Your order ${orderNumber} has been cancelled`
    },
    completed: {
      title: 'Order Completed',
      message: `Your order ${orderNumber} is complete. Thank you for your purchase!`
    }
  };

  const statusInfo = statusMessages[status];
  if (!statusInfo) return;

  const typeMap: Record<string, INotification['type']> = {
    confirmed: 'order_confirmed',
    preparing: 'order_preparing',
    shipped: 'order_shipped',
    delivered: 'order_delivered',
    cancelled: 'order_cancelled',
    completed: 'order_completed'
  };

  await createNotification({
    userId: buyerId,
    userRole: 'buyer',
    type: typeMap[status] || 'system',
    title: statusInfo.title,
    message: statusInfo.message,
    orderId,
    orderNumber,
    relatedUserId: '', // We don't store sellerId for privacy
    relatedUserName: sellerName,
    metadata: {
      status,
      actionUrl: `/orders/${orderId}`
    }
  });
}
