/**
 * Script to recalculate seller response metrics from existing chat messages
 * Run this once to populate metrics for existing sellers
 * 
 * Usage: npx ts-node scripts/recalculate-seller-metrics.ts
 */

import dbConnect from '../lib/mongodb';
import User from '../models/User';
import ChatMessage from '../models/ChatMessage';

interface ResponseData {
  totalReceived: number;
  totalResponded: number;
  totalResponseTime: number;
  responseCount: number;
}

async function recalculateMetrics() {
  try {
    console.log('🔄 Connecting to database...');
    await dbConnect();

    console.log('📊 Fetching all sellers...');
    const sellers = await User.find({ role: 'seller' }).select('_id name email').lean();
    console.log(`Found ${sellers.length} sellers\n`);

    for (const seller of sellers) {
      const sellerId = seller._id.toString();
      console.log(`\n👤 Processing seller: ${(seller as any).name || (seller as any).email}`);

      // Get all conversations where seller is involved
      const sellerMessages = await ChatMessage.find({
        $or: [
          { senderId: sellerId },
          { receiverId: sellerId }
        ]
      }).sort({ conversationId: 1, createdAt: 1 }).lean();

      if (sellerMessages.length === 0) {
        console.log('  ℹ️  No messages found for this seller');
        continue;
      }

      // Group messages by conversation
      const conversations = new Map<string, any[]>();
      sellerMessages.forEach(msg => {
        if (!conversations.has(msg.conversationId)) {
          conversations.set(msg.conversationId, []);
        }
        conversations.get(msg.conversationId)!.push(msg);
      });

      let totalReceived = 0;
      let totalResponded = 0;
      let totalResponseTimeMinutes = 0;
      let responseCount = 0;

      // Analyze each conversation
      for (const [conversationId, messages] of conversations.entries()) {
        console.log(`  📬 Conversation: ${conversationId.substring(0, 16)}...`);

        // Find messages where buyer sent to seller
        const buyerToSellerMessages = messages.filter(
          m => m.receiverId === sellerId && m.senderRole === 'buyer'
        );
        
        totalReceived += buyerToSellerMessages.length;
        console.log(`    Received: ${buyerToSellerMessages.length} messages`);

        // For each buyer message, check if seller responded
        for (const buyerMsg of buyerToSellerMessages) {
          // Find the next seller message after this buyer message
          const sellerResponse = messages.find(
            m => m.senderId === sellerId && 
                 m.receiverId === buyerMsg.senderId &&
                 m.createdAt > buyerMsg.createdAt
          );

          if (sellerResponse) {
            totalResponded++;
            
            // Calculate response time in minutes
            const responseTimeMs = new Date(sellerResponse.createdAt).getTime() - 
                                  new Date(buyerMsg.createdAt).getTime();
            const responseTimeMinutes = Math.round(responseTimeMs / (1000 * 60));
            
            totalResponseTimeMinutes += responseTimeMinutes;
            responseCount++;
            
            console.log(`    ✅ Responded in ${responseTimeMinutes} minutes`);
          }
        }
      }

      // Calculate final metrics
      const responseRate = totalReceived > 0 
        ? Math.round((totalResponded / totalReceived) * 100) 
        : null;
      
      const avgResponseTime = responseCount > 0 
        ? Math.round(totalResponseTimeMinutes / responseCount) 
        : null;

      console.log(`\n  📈 Final Metrics:`);
      console.log(`    Total Received: ${totalReceived}`);
      console.log(`    Total Responded: ${totalResponded}`);
      console.log(`    Response Rate: ${responseRate}%`);
      console.log(`    Avg Response Time: ${avgResponseTime} minutes`);

      // Update seller record
      await User.findByIdAndUpdate(sellerId, {
        $set: {
          totalMessagesReceived: totalReceived,
          totalMessagesResponded: totalResponded,
          responseRate: responseRate,
          averageResponseTime: avgResponseTime
        }
      });

      console.log(`  ✅ Updated seller metrics in database`);
    }

    console.log('\n\n✅ All seller metrics recalculated successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error recalculating metrics:', error);
    process.exit(1);
  }
}

// Run the script
recalculateMetrics();
