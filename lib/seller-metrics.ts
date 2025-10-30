/**
 * Seller Metrics Utilities
 * Helper functions to calculate and update seller response metrics
 */

import User from '@/models/User';
import Message from '@/models/Message';
import mongoose from 'mongoose';

interface ResponseMetrics {
  responseRate: number | null;
  averageResponseTime: number | null;
  totalMessagesReceived: number;
  totalMessagesResponded: number;
}

/**
 * Calculate response time in minutes between two dates
 */
export function calculateResponseTime(receivedAt: Date, respondedAt: Date): number {
  const diffMs = respondedAt.getTime() - receivedAt.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Update seller response metrics based on message activity
 * Call this function when a seller responds to a message
 * 
 * @param sellerId - The seller's user ID
 * @param messageReceivedAt - When the original message was received
 * @param messageRespondedAt - When the seller responded (default: now)
 */
export async function updateSellerResponseMetrics(
  sellerId: string | mongoose.Types.ObjectId,
  messageReceivedAt: Date,
  messageRespondedAt: Date = new Date()
): Promise<void> {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) {
      console.error('Seller not found:', sellerId);
      return;
    }

    // Calculate response time for this message
    const responseTimeMinutes = calculateResponseTime(messageReceivedAt, messageRespondedAt);

    // Get current metrics
    const totalReceived = (seller.totalMessagesReceived || 0) + 1;
    const totalResponded = (seller.totalMessagesResponded || 0) + 1;
    
    // Calculate new response rate (percentage)
    const newResponseRate = Math.round((totalResponded / totalReceived) * 100);

    // Calculate new average response time (weighted average)
    const currentAvgTime = seller.averageResponseTime || 0;
    const previousResponses = seller.totalMessagesResponded || 0;
    const newAvgResponseTime = previousResponses === 0
      ? responseTimeMinutes
      : Math.round(((currentAvgTime * previousResponses) + responseTimeMinutes) / totalResponded);

    // Update seller metrics
    await User.findByIdAndUpdate(sellerId, {
      $set: {
        responseRate: newResponseRate,
        averageResponseTime: newAvgResponseTime,
        totalMessagesReceived: totalReceived,
        totalMessagesResponded: totalResponded
      }
    });

    console.log(`Updated metrics for seller ${sellerId}:`, {
      responseRate: newResponseRate,
      averageResponseTime: newAvgResponseTime,
      totalReceived,
      totalResponded
    });
  } catch (error) {
    console.error('Error updating seller response metrics:', error);
    // Don't throw - this is a non-critical update
  }
}

/**
 * Increment message received counter for a seller
 * Call this when a buyer sends a message to a seller
 * 
 * @param sellerId - The seller's user ID
 */
export async function incrementSellerMessagesReceived(
  sellerId: string | mongoose.Types.ObjectId
): Promise<void> {
  try {
    const seller = await User.findById(sellerId);
    if (!seller) {
      console.error('Seller not found:', sellerId);
      return;
    }

    const totalReceived = (seller.totalMessagesReceived || 0) + 1;
    const totalResponded = seller.totalMessagesResponded || 0;

    // Recalculate response rate
    const newResponseRate = totalReceived > 0
      ? Math.round((totalResponded / totalReceived) * 100)
      : null;

    await User.findByIdAndUpdate(sellerId, {
      $set: {
        totalMessagesReceived: totalReceived,
        responseRate: newResponseRate
      }
    });

    console.log(`Incremented messages received for seller ${sellerId}:`, {
      totalReceived,
      responseRate: newResponseRate
    });
  } catch (error) {
    console.error('Error incrementing seller messages received:', error);
    // Don't throw - this is a non-critical update
  }
}

/**
 * Recalculate all metrics for a seller from scratch
 * Useful for data migration or fixing inconsistent data
 * 
 * @param sellerId - The seller's user ID
 */
export async function recalculateSellerMetrics(
  sellerId: string | mongoose.Types.ObjectId
): Promise<ResponseMetrics> {
  try {
    // This is a placeholder - implement based on your Message schema
    // You'll need to track message threads and response times in your Message model
    
    // For now, return current values
    const seller = await User.findById(sellerId);
    if (!seller) {
      throw new Error('Seller not found');
    }

    return {
      responseRate: seller.responseRate || null,
      averageResponseTime: seller.averageResponseTime || null,
      totalMessagesReceived: seller.totalMessagesReceived || 0,
      totalMessagesResponded: seller.totalMessagesResponded || 0
    };
  } catch (error) {
    console.error('Error recalculating seller metrics:', error);
    throw error;
  }
}

/**
 * Format response time for display
 * 
 * @param minutes - Response time in minutes
 * @returns Formatted string (e.g., "5 mins", "2 hours", "1 day")
 */
export function formatResponseTime(minutes: number | null): string | null {
  if (minutes === null || minutes === undefined) return null;
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min${Math.round(minutes) !== 1 ? 's' : ''}`;
  }
  
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  const days = Math.round(minutes / 1440);
  return `${days} day${days !== 1 ? 's' : ''}`;
}
