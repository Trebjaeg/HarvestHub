import mongoose from 'mongoose';

export interface INotification {
  _id?: string;
  userId: string;
  userRole: 'buyer' | 'seller' | 'admin';
  type: 'order_created' | 'order_confirmed' | 'order_preparing' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'order_completed' | 'system' | 'promotion' | 'review' | 'review_response' | 'message' | 'low_stock_alert';
  title: string;
  message: string;
  orderId?: string;
  orderNumber?: string;
  relatedUserId?: string;
  relatedUserName?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: {
    productNames?: string[];
    totalAmount?: number;
    productCount?: number;
    imageUrl?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order_created', 'order_confirmed', 'order_preparing', 'order_shipped', 'order_delivered', 'order_cancelled', 'order_completed', 'system', 'promotion', 'review', 'review_response', 'message', 'low_stock_alert'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  orderId: {
    type: String
  },
  orderNumber: {
    type: String
  },
  relatedUserId: {
    type: String
  },
  relatedUserName: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ orderId: 1 });

// Auto-cleanup old read notifications (older than 90 days)
NotificationSchema.index({ isRead: 1, createdAt: 1 }, { 
  expireAfterSeconds: 7776000, // 90 days
  partialFilterExpression: { isRead: true }
});

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
