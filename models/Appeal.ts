import mongoose, { Schema, models } from 'mongoose';

const AppealSchema = new Schema({
  // User submitting the appeal
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Appeal details
  type: {
    type: String,
    enum: ['suspension', 'deletion', 'warning', 'listing_removal'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 2000
  },
  // Original action details
  originalAction: {
    type: String,
    required: true
  },
  originalReason: {
    type: String,
    required: true
  },
  originalDate: {
    type: Date,
    required: true
  },
  originalActionBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Supporting evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'document', 'text', 'url'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }],
  // Appeal status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Review information
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  },
  // Decision
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'partial'],
    default: null
  },
  decisionReason: {
    type: String,
    default: null
  },
  // Action taken after approval
  actionTaken: {
    type: String,
    default: null
  },
  // Timeline tracking
  timeline: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
AppealSchema.index({ user: 1, createdAt: -1 });
AppealSchema.index({ status: 1, priority: -1, createdAt: -1 });
AppealSchema.index({ reviewedBy: 1, reviewedAt: -1 });
AppealSchema.index({ type: 1, status: 1 });
AppealSchema.index({ createdAt: -1 });

// Update timestamp on save
AppealSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Appeal = models.Appeal || mongoose.model('Appeal', AppealSchema);

export default Appeal;