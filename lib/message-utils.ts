import dbConnect from '@/lib/mongodb';
import Message from '@/models/Message';

interface CreateMessageParams {
  recipientId: string;
  senderName: string;
  subject: string;
  content: string;
  category: 'order_update' | 'promotion' | 'system_notification' | 'general' | 'support';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  senderType?: 'system' | 'admin' | 'seller' | 'buyer';
  senderId?: string;
  relatedOrderId?: string;
  relatedProductId?: string;
  metadata?: Record<string, string | number | boolean | Date>;
}

export async function createBuyerMessage(params: CreateMessageParams) {
  try {
    await dbConnect();

    const message = new Message({
      recipientId: params.recipientId,
      recipientType: 'buyer',
      senderId: params.senderId || null,
      senderType: params.senderType || 'system',
      senderName: params.senderName,
      subject: params.subject,
      content: params.content,
      category: params.category,
      priority: params.priority || 'medium',
      relatedOrderId: params.relatedOrderId,
      relatedProductId: params.relatedProductId,
      metadata: params.metadata || {},
      isRead: false,
      isArchived: false
    });

    await message.save();
    return message;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Pre-built message templates
export const MessageTemplates = {
  orderConfirmed: (buyerId: string, orderId: string, productName: string, totalAmount: number) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub System',
    subject: 'Order Confirmed - Thank You for Your Purchase!',
    content: `Great news! Your order has been confirmed and is being prepared for delivery.

Order Details:
• Product: ${productName}
• Total Amount: ₱${totalAmount.toFixed(2)}
• Order ID: ${orderId}

Your seller will process your order and update you on the delivery status. You can track your order progress in your Orders page.

Thank you for choosing HarvestHub to support local farmers!`,
    category: 'order_update' as const,
    priority: 'medium' as const,
    relatedOrderId: orderId,
    metadata: {
      orderStatus: 'confirmed',
      productName,
      totalAmount
    }
  }),

  orderShipped: (buyerId: string, orderId: string, productName: string, trackingNumber?: string) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub System',
    subject: 'Your Order is On the Way! 🚚',
    content: `Exciting news! Your order has been shipped and is on its way to you.

Order Details:
• Product: ${productName}
• Order ID: ${orderId}
${trackingNumber ? `• Tracking Number: ${trackingNumber}` : ''}

Your fresh produce will be delivered soon. Please ensure someone is available to receive the delivery.

Thank you for supporting local farmers through HarvestHub!`,
    category: 'order_update' as const,
    priority: 'medium' as const,
    relatedOrderId: orderId,
    metadata: {
      orderStatus: 'shipped',
      productName,
      trackingNumber
    }
  }),

  orderDelivered: (buyerId: string, orderId: string, productName: string) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub System',
    subject: 'Order Delivered Successfully! 📦',
    content: `Your order has been delivered successfully! We hope you enjoy your fresh ${productName}.

Order Details:
• Product: ${productName}
• Order ID: ${orderId}
• Status: Delivered

Please take a moment to rate your experience and leave a review for the seller. Your feedback helps other buyers and supports our farming community.

Thank you for choosing HarvestHub!`,
    category: 'order_update' as const,
    priority: 'low' as const,
    relatedOrderId: orderId,
    metadata: {
      orderStatus: 'delivered',
      productName
    }
  }),

  welcomeNewBuyer: (buyerId: string, buyerName: string) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub Team',
    subject: `Welcome to HarvestHub, ${buyerName}! 🌱`,
    content: `Welcome to HarvestHub! We're excited to have you join our community of buyers supporting local farmers.

Here's what you can do:
• Browse fresh produce from local farmers
• Add items to your favorites for easy access
• Track your orders in real-time
• Connect directly with farmers
• Enjoy farm-fresh quality delivered to your door

Start exploring our marketplace and discover the freshest produce in your area. If you have any questions, our support team is here to help.

Happy shopping!

The HarvestHub Team`,
    category: 'system_notification' as const,
    priority: 'low' as const,
    metadata: {
      welcomeMessage: true
    }
  }),

  promotionAlert: (buyerId: string, title: string, description: string, promoCode: string, expiryDate: Date) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub Promotions',
    subject: `Special Offer: ${title} 🎉`,
    content: `Don't miss out on this special promotion!

${title}

${description}

Use promo code: ${promoCode}
Valid until: ${expiryDate.toLocaleDateString()}

Shop now and save on fresh, locally-grown produce. This offer won't last long!

Terms and conditions apply. Visit our website for full details.`,
    category: 'promotion' as const,
    priority: 'medium' as const,
    metadata: {
      promotionCode: promoCode,
      expiryDate: expiryDate.toISOString(),
      promotionTitle: title
    }
  }),

  sellerMessage: (buyerId: string, sellerId: string, sellerName: string, subject: string, content: string, relatedOrderId?: string) => ({
    recipientId: buyerId,
    senderName: sellerName,
    senderType: 'seller' as const,
    senderId: sellerId,
    subject,
    content,
    category: 'general' as const,
    priority: 'medium' as const,
    relatedOrderId
  }),

  systemMaintenance: (buyerId: string, maintenanceDate: Date, duration: string) => ({
    recipientId: buyerId,
    senderName: 'HarvestHub System',
    subject: 'Scheduled Maintenance Notification',
    content: `We will be performing scheduled maintenance to improve your HarvestHub experience.

Maintenance Details:
• Date: ${maintenanceDate.toLocaleDateString()}
• Time: ${maintenanceDate.toLocaleTimeString()}
• Duration: ${duration}

During this time, the platform may be temporarily unavailable. We apologize for any inconvenience and appreciate your patience.

All services will be fully restored after the maintenance window.

Thank you for your understanding.`,
    category: 'system_notification' as const,
    priority: 'low' as const,
    metadata: {
      maintenanceDate: maintenanceDate.toISOString(),
      duration
    }
  })
};

// Bulk message sending utility
export async function sendBulkMessages(messages: CreateMessageParams[]) {
  try {
    await dbConnect();
    
    const messagePromises = messages.map(params => createBuyerMessage(params));
    const results = await Promise.all(messagePromises);
    
    return {
      success: true,
      sent: results.length,
      messages: results
    };
  } catch (error) {
    console.error('Error sending bulk messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}