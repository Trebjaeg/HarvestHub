// Script to create test audit logs for development
// Run with: node scripts/create-test-audit-logs.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetType: { type: String, default: null },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  reason: { type: String, required: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  previousState: { type: mongoose.Schema.Types.Mixed, default: null },
  newState: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({}, { strict: false });

async function createTestAuditLogs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Find an admin user
    const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);

    // Find a regular user for target
    const targetUser = await User.findOne({ role: 'buyer' });
    
    console.log('Creating test audit logs...');

    const testLogs = [
      {
        performedBy: admin._id,
        action: 'admin_login',
        reason: 'Admin logged in to dashboard',
        metadata: { loginMethod: 'password' },
        severity: 'low',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        performedBy: admin._id,
        action: 'user_suspended',
        targetUser: targetUser?._id || null,
        reason: 'Violation of terms of service',
        metadata: { suspensionDuration: '7 days' },
        severity: 'high',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        previousState: { status: 'active' },
        newState: { status: 'suspended' },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        performedBy: admin._id,
        action: 'appeal_approved',
        targetUser: targetUser?._id || null,
        reason: 'Appeal was valid, restoring account',
        metadata: { appealId: new mongoose.Types.ObjectId() },
        severity: 'high',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        performedBy: admin._id,
        action: 'user_role_changed',
        targetUser: targetUser?._id || null,
        reason: 'User promoted to seller',
        metadata: { oldRole: 'buyer', newRole: 'seller' },
        severity: 'medium',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        previousState: { role: 'buyer' },
        newState: { role: 'seller' },
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        performedBy: admin._id,
        action: 'seller_verification_approved',
        targetUser: targetUser?._id || null,
        reason: 'Seller verification documents approved',
        metadata: { documentType: 'business_license' },
        severity: 'medium',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      }
    ];

    const result = await AuditLog.insertMany(testLogs);
    console.log(`✅ Created ${result.length} test audit logs successfully!`);

    // Count total logs
    const total = await AuditLog.countDocuments();
    console.log(`Total audit logs in database: ${total}`);

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error creating test audit logs:', error);
    process.exit(1);
  }
}

createTestAuditLogs();
