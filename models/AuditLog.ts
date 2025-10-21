import mongoose, { Schema, models } from 'mongoose';

const AuditLogSchema = new Schema({
  // Who performed the action
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      'user_suspended',
      'user_unsuspended', 
      'user_deleted',
      'user_warned',
      'user_role_changed',
      'user_token_invalidated',
      'appeal_submitted',
      'appeal_approved',
      'appeal_rejected',
      'listing_hidden',
      'listing_restored',
      'admin_login',
      'admin_action_failed',
      'seller_verification_submitted',
      'seller_verification_approved',
      'seller_verification_rejected'
    ]
  },
  // Target of the action (if applicable)
  targetUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Target resource (listing, product, etc.) - flexible for different types
  targetType: {
    type: String,
    default: null
  },
  targetId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  // Legacy fields for backward compatibility
  targetResource: {
    type: String,
    default: null
  },
  targetResourceId: {
    type: Schema.Types.ObjectId,
    default: null
  },
  // Action details
  reason: {
    type: String,
    required: false // Made optional for flexibility
  },
  // Flexible metadata field
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // IP and user agent for security
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  // Metadata
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Previous state (for rollback purposes)
  previousState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // New state
  newState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ targetUser: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete old audit logs after 7 years (for compliance)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 365 * 24 * 60 * 60 });

const AuditLog = models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;