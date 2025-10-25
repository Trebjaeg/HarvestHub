import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createBuyerMessage, MessageTemplates } from '@/lib/message-utils';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Create sample messages for testing
    const sampleMessages = [
      // Welcome message
      MessageTemplates.welcomeNewBuyer(userId, "Valued Customer"),
      
      // Order confirmation
      MessageTemplates.orderConfirmed(userId, "ORD-001", "Fresh Tomatoes (2kg)", 150),
      
      // Order shipped
      MessageTemplates.orderShipped(userId, "ORD-001", "Fresh Tomatoes (2kg)", "TRK-12345"),
      
      // Promotion
      MessageTemplates.promotionAlert(
        userId,
        "Weekend Fresh Produce Sale",
        "Get 20% off on all fresh vegetables this weekend! Perfect time to stock up on healthy, farm-fresh produce.",
        "WEEKEND20",
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ),
      
      // Seller message
      MessageTemplates.sellerMessage(
        userId,
        "seller123",
        "Maria Santos - Green Valley Farm",
        "Your Order Update",
        `Hello! I wanted to personally thank you for your order. Your fresh vegetables are being harvested this morning and will be packed with care.

I've included some extra herbs as a complimentary gift for being a valued customer.

If you have any special requests or questions about your order, please don't hesitate to reach out!

Best regards,
Maria Santos
Green Valley Farm`,
        "ORD-001"
      ),
      
      // System notification
      MessageTemplates.systemMaintenance(
        userId,
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        "2 hours"
      ),
      
      // Order delivered
      MessageTemplates.orderDelivered(userId, "ORD-001", "Fresh Tomatoes (2kg)"),
      
      // Another promotion
      MessageTemplates.promotionAlert(
        userId,
        "New Farmer Special",
        "Support our newest farmers! Get 15% off on products from farmers who just joined our platform.",
        "NEWFARM15",
        new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      ),
      
      // Custom high priority message
      {
        recipientId: userId,
        senderName: 'HarvestHub Support',
        subject: 'Important: Account Security Update',
        content: `We've detected some unusual activity on your account and have temporarily enhanced your security settings.

What happened:
• Multiple login attempts from different locations
• We've secured your account as a precaution

What you need to do:
• Review your recent account activity
• Update your password if needed
• Enable two-factor authentication for better security

Your account is safe and fully functional. This is just a precautionary measure to protect your information.

If you have any questions or concerns, please contact our support team immediately.

Best regards,
HarvestHub Security Team`,
        category: 'system_notification' as const,
        priority: 'high' as const,
        metadata: {
          securityAlert: true,
          actionRequired: true
        }
      },
      
      // Urgent support message
      {
        recipientId: userId,
        senderName: 'HarvestHub Customer Service',
        subject: 'URGENT: Delivery Issue Resolution',
        content: `We sincerely apologize for the delivery issue with your recent order (ORD-001).

Issue Details:
• Delivery was delayed due to weather conditions
• Your fresh produce is being kept in optimal storage
• New delivery scheduled for tomorrow morning

Compensation:
• Full refund of delivery charges
• 25% discount on your next order
• Free priority delivery for next 3 orders

We're committed to making this right. Your satisfaction is our top priority.

Please contact us at +63-XXX-XXXX if you have any concerns.

Thank you for your patience and understanding.`,
        category: 'support' as const,
        priority: 'urgent' as const,
        relatedOrderId: 'ORD-001',
        metadata: {
          issueType: 'delivery_delay',
          compensationOffered: true,
          urgentResponse: true
        }
      }
    ];

    // Create all messages
    const results = await Promise.all(sampleMessages.map(msg => createBuyerMessage(msg)));

    return NextResponse.json({
      success: true,
      message: `${results.length} sample messages created successfully`,
      data: {
        messagesCreated: results.length,
        messageIds: results.map(msg => msg._id)
      }
    });

  } catch (error) {
    console.error('Error creating sample messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}