import mongoose from 'mongoose';

export interface IMessage {
  _id?: string;
  recipientId: string;
  recipientType: 'buyer' | 'seller' | 'admin';
  senderId?: string;
  senderType: 'system' | 'admin' | 'seller' | 'buyer';
  senderName: string;
  subject: string;
  content: string;
  category: 'order_update' | 'promotion' | 'system_notification' | 'general' | 'support';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  isArchived: boolean;
  relatedOrderId?: string;
  relatedProductId?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
  metadata?: {
    orderStatus?: string;
    productName?: string;
    promotionCode?: string;
    expiryDate?: Date;
    [key: string]: string | number | boolean | Date | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

const MessageSchema = new mongoose.Schema<IMessage>({
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  recipientType: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true
  },
  senderId: {
    type: String,
    default: null
  },
  senderType: {
    type: String,
    enum: ['system', 'admin', 'seller', 'buyer'],
    required: true,
    default: 'system'
  },
  senderName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  category: {
    type: String,
    enum: ['order_update', 'promotion', 'system_notification', 'general', 'support'],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  relatedOrderId: {
    type: String,
    default: null,
    index: true
  },
  relatedProductId: {
    type: String,
    default: null,
    index: true
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
MessageSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, category: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isArchived: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, priority: 1, createdAt: -1 });

// Text search index
MessageSchema.index({ 
  subject: 'text', 
  content: 'text', 
  senderName: 'text' 
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);