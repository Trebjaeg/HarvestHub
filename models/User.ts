import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sellerStatus: {
    type: String,
    enum: ['none', 'pending', 'verified', 'rejected'],
    default: 'none',
  },
  // For password reset flow
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = models.User || mongoose.model('User', UserSchema);

export default User;
