import mongoose from 'mongoose';

export interface IChatMessage {
  _id?: string;
  conversationId: string; // Unique ID for conversation between two users
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  receiverId: string;
  receiverName: string;
  receiverRole: 'buyer' | 'seller' | 'admin';
  message: string;
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
      enum: ['buyer', 'seller', 'admin'],
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
      required: true,
      maxlength: 2000
    },
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
