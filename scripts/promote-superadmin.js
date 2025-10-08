const mongoose = require('mongoose');

// User Schema (simplified for script)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  tokenVersion: { type: Number, default: 0 },
  suspendedAt: Date,
  suspendedBy: String,
  suspendReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function promoteToSuperAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harvesthub';
    await mongoose.connect(MONGODB_URI);
    console.log('📡 Connected to MongoDB');
    
    // Update Raymond's existing account to superadmin
    const result = await User.updateOne(
      { email: "iamraymondbautista17@gmail.com" },
      {
        $set: {
          role: "superadmin",
          status: "active",
          tokenVersion: 1,
          // Clear any suspension fields if they exist
          suspendedAt: null,
          suspendedBy: null,
          suspendReason: null,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      console.log('❌ User not found with email: iamraymondbautista17@gmail.com');
      return;
    }

    if (result.modifiedCount > 0) {
      console.log('✅ Successfully promoted Raymond Bautista to superadmin!');
      console.log('📧 Email: iamraymondbautista17@gmail.com');
      console.log('🔑 Role: superadmin');
      console.log('🎉 You can now access the admin dashboard at: http://localhost:3000/admin');
    } else {
      console.log('ℹ️ User already has superadmin privileges');
    }

    // Verify the update
    const updatedUser = await User.findOne({ email: "iamraymondbautista17@gmail.com" });
    console.log('\n📋 User Status:');
    console.log(`   Name: ${updatedUser?.name}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Role: ${updatedUser?.role}`);
    console.log(`   Status: ${updatedUser?.status}`);

  } catch (error) {
    console.error('❌ Error promoting user to superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the promotion
promoteToSuperAdmin().then(() => {
  console.log('\n🎯 Promotion complete! You can now log in and access /admin');
  process.exit(0);
});