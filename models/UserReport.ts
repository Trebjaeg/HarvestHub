import mongoose, { Schema, models } from 'mongoose';

const UserReportSchema = new Schema({
  // Who is being reported
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Who submitted the report
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Report details
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'fake_products',
      'inappropriate_content',
      'scam',
      'fake_profile',
      'copyright_violation',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  // Evidence
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'url', 'text', 'screenshot'],
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
  // Related content
  relatedListing: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  relatedOrder: {
    type: Schema.Types.ObjectId,
    default: null
  },
  // Report status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
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
  actionTaken: {
    type: String,
    enum: ['none', 'warning', 'suspension', 'deletion', 'listing_removed'],
    default: 'none'
  },
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
UserReportSchema.index({ reportedUser: 1, createdAt: -1 });
UserReportSchema.index({ reportedBy: 1, createdAt: -1 });
UserReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
UserReportSchema.index({ reviewedBy: 1, reviewedAt: -1 });
UserReportSchema.index({ createdAt: -1 });

// Update timestamp on save
UserReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserReport = models.UserReport || mongoose.model('UserReport', UserReportSchema);

export default UserReport;