import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  // For farmer names - split into first and last
  firstName: { type: String, trim: true, maxlength: 50 },
  lastName: { type: String, trim: true, maxlength: 50 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    maxlength: 255,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true, minlength: 8 },
  
  // Email verification fields
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationTokenExpires: { type: Date, default: null },
  
  // User role and moderation fields
  role: {
    type: String,
    enum: ['buyer', 'seller', 'farmer', 'admin', 'superadmin'],
    default: 'buyer'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  suspendedAt: { type: Date, default: null },
  suspendedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  suspendReason: { type: String, default: null },
  tokenVersion: { type: Number, default: 0 },
  
  sellerStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none',
  },
  
  // Farmer verification - simplified to just government ID
  farmerVerification: {
    governmentId: {
      filename: { type: String },
      originalName: { type: String },
      fileUrl: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      fileSize: { type: Number },
      mimeType: { type: String }
    },
    farmDetails: {
      farmName: { type: String, maxlength: 200 },
      farmAddress: { type: String, maxlength: 500 },
      contactNumber: { type: String, maxlength: 20 }
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 1000 } // Admin notes
  },
  
  // Profile image
  profileImage: { type: String, default: null },
  profilePicture: { type: String, default: null }, // Alternative field name for consistency
  
  // Farm information
  farmName: { type: String, maxlength: 200, default: null },
  farmDescription: { type: String, maxlength: 1000, default: null },
  phone: { type: String, maxlength: 20, default: null },
  address: { type: String, maxlength: 500, default: null },
  
  // Farmer specialties/categories
  specialties: [{ type: String }],
  
  // Farmer statistics for Top Farmers ranking
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalSales: { type: Number, default: 0, min: 0 },
  productCount: { type: Number, default: 0, min: 0 },
  reviewCount: { type: Number, default: 0, min: 0 },
  
  // For password reset flow
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  
  // For email change verification
  emailChangeVerification: {
    code: { type: String },
    newEmail: { type: String },
    expiresAt: { type: Date }
  },
  
  // Security tracking
  lastLogin: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0, max: 10 },
  accountLocked: { type: Boolean, default: false },
  lockUntil: { type: Date, default: null },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance optimization
// Note: email index is automatically created by unique: true in schema field definition
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });
UserSchema.index({ verificationToken: 1, verificationTokenExpires: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ accountLocked: 1, lockUntil: 1 });
UserSchema.index({ suspendedBy: 1 });
UserSchema.index({ tokenVersion: 1 });

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if account is locked
UserSchema.virtual('isLocked').get(function(this: any) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Method to increment failed login attempts
UserSchema.methods.incLoginAttempts = function(this: any) {
  // If previous attempt was successful, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        failedLoginAttempts: 1,
        lockUntil: 1,
        accountLocked: 1
      }
    });
  }
  
  const updates: any = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.accountLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      accountLocked: true
    };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function(this: any) {
  return this.updateOne({
    $unset: {
      failedLoginAttempts: 1,
      lockUntil: 1,
      accountLocked: 1
    },
    $set: {
      lastLogin: new Date()
    }
  });
};

// Delete the cached model to ensure schema changes take effect
if (models.User) {
  delete models.User;
}

const User = mongoose.model('User', UserSchema);

export default User;
