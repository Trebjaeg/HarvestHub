import mongoose from 'mongoose';

export interface ISupportConversation {
  _id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: 'buyer' | 'seller';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

const SupportConversationSchema = new mongoose.Schema<ISupportConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      default: null
    },
    userRole: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    lastMessagePreview: {
      type: String,
      maxlength: 200,
      default: null
    },
    assignedAdminId: {
      type: String,
      default: null,
      index: true
    },
    assignedAdminName: {
      type: String,
      default: null
    },
    tags: [{
      type: String
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
SupportConversationSchema.index({ status: 1, createdAt: -1 });
SupportConversationSchema.index({ userId: 1, status: 1 });
SupportConversationSchema.index({ assignedAdminId: 1, status: 1 });

const SupportConversation = mongoose.models.SupportConversation || mongoose.model<ISupportConversation>('SupportConversation', SupportConversationSchema);

export default SupportConversation;
