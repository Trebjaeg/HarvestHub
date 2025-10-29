/**
 * Sample script to demonstrate sending messages to buyers
 * This shows how to use the message utilities for different scenarios
 */

import { createBuyerMessage, MessageTemplates } from '@/lib/message-utils';

// Example: Send welcome message to new buyer
async function sendWelcomeMessage(buyerId: string, buyerName: string) {
  try {
    const welcomeMessage = MessageTemplates.welcomeNewBuyer(buyerId, buyerName);
    const result = await createBuyerMessage(welcomeMessage);
    console.log('Welcome message sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending welcome message:', error);
    throw error;
  }
}

// Example: Send order confirmation message
async function sendOrderConfirmation(buyerId: string, orderId: string, productName: string, totalAmount: number) {
  try {
    const orderMessage = MessageTemplates.orderConfirmed(buyerId, orderId, productName, totalAmount);
    const result = await createBuyerMessage(orderMessage);
    console.log('Order confirmation sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    throw error;
  }
}

// Example: Send promotion message
async function sendPromotionMessage(buyerId: string) {
  try {
    const promotionMessage = MessageTemplates.promotionAlert(
      buyerId,
      "Weekend Fresh Produce Sale",
      "Get 20% off on all fresh vegetables this weekend! Perfect time to stock up on healthy, farm-fresh produce.",
      "WEEKEND20",
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    );
    const result = await createBuyerMessage(promotionMessage);
    console.log('Promotion message sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending promotion message:', error);
    throw error;
  }
}

// Example: Send custom message from seller
async function sendSellerMessage(buyerId: string, sellerId: string, sellerName: string, orderId?: string) {
  try {
    const customMessage = MessageTemplates.sellerMessage(
      buyerId,
      sellerId,
      sellerName,
      "Your Order Update",
      `Hello! I wanted to personally thank you for your order. Your fresh vegetables are being harvested this morning and will be packed with care. 

I've included some extra herbs as a complimentary gift for being a valued customer. 

If you have any special requests or questions about your order, please don't hesitate to reach out!

Best regards,
${sellerName}
Green Valley Farm`,
      orderId
    );
    const result = await createBuyerMessage(customMessage);
    console.log('Seller message sent:', result);
    return result;
  } catch (error) {
    console.error('Error sending seller message:', error);
    throw error;
  }
}

// Example: Bulk send system notifications
async function sendSystemMaintenanceNotifications(buyerIds: string[]) {
  try {
    const maintenanceDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    
    const messages = buyerIds.map(buyerId => 
      MessageTemplates.systemMaintenance(buyerId, maintenanceDate, "2 hours")
    );
    
    const results = await Promise.all(messages.map(msg => createBuyerMessage(msg)));
    console.log(`System maintenance notifications sent to ${results.length} buyers`);
    return results;
  } catch (error) {
    console.error('Error sending system notifications:', error);
    throw error;
  }
}

// Example usage:
export async function demonstrateMessaging() {
  // Replace with actual buyer IDs from your database
  const sampleBuyerId = "buyer_123";
  const sampleBuyerName = "John Doe";
  const sampleOrderId = "order_456";
  const sampleSellerId = "seller_789";
  const sampleSellerName = "Maria Santos";

  console.log('🚀 Demonstrating HarvestHub Messaging System');
  
  // Send different types of messages
  try {
    await sendWelcomeMessage(sampleBuyerId, sampleBuyerName);
    await sendOrderConfirmation(sampleBuyerId, sampleOrderId, "Fresh Tomatoes (2kg)", 150);
    await sendPromotionMessage(sampleBuyerId);
    await sendSellerMessage(sampleBuyerId, sampleSellerId, sampleSellerName, sampleOrderId);
    
    console.log('✅ All messages sent successfully!');
  } catch (error) {
    console.error('❌ Error in demonstration:', error);
  }
}

export {
  sendWelcomeMessage,
  sendOrderConfirmation,
  sendPromotionMessage,
  sendSellerMessage,
  sendSystemMaintenanceNotifications
};