import mongoose from 'mongoose';

export interface IAttachment {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  type: string;
  size: number;
  category: 'image' | 'video' | 'document';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface IChatMessage {
  _id?: string;
  conversationId: string; // Unique ID for conversation between two users
  supportConversationId?: string; // NEW: For support conversations
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin' | 'ai'; // UPDATED: Added 'ai'
  receiverId: string;
  receiverName: string;
  receiverRole: 'buyer' | 'seller' | 'admin';
  message: string;
  attachments?: IAttachment[]; // NEW: Support for file attachments
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    supportConversationId: {
      type: String,
      default: null,
      index: true
    },
    senderId: {
      type: String,
      required: true,
      index: true
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      enum: ['buyer', 'seller', 'admin', 'ai'],
      required: true
    },
    receiverId: {
      type: String,
      required: true,
      index: true
    },
    receiverName: {
      type: String,
      required: true
    },
    receiverRole: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: function(this: IChatMessage) {
        // Message is required only if there are no attachments
        return !this.attachments || this.attachments.length === 0;
      },
      maxlength: 2000
    },
    attachments: [{
      id: { type: String, required: true },
      originalName: { type: String, required: true },
      fileName: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, required: true },
      size: { type: Number, required: true },
      category: { 
        type: String, 
        enum: ['image', 'document'], 
        required: true 
      },
      uploadedBy: { type: String, required: true },
      uploadedAt: { type: Date, required: true }
    }],
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
ChatMessageSchema.index({ receiverId: 1, isRead: 1 });

// Helper method to generate conversation ID (always sorted to ensure consistency)
export function generateConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
