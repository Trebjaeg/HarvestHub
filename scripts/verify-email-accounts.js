const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User Schema (simplified for script)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'active' },
  tokenVersion: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  suspendedAt: Date,
  suspendedBy: String,
  suspendReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function verifyEmailAccounts() {
  try {
    console.log('🌱 HarvestHub - Email Verification Script');
    console.log('=========================================\n');
    
    // Use the connection string from .env.local
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return;
    }
    
    console.log('🔄 Connecting to DigitalOcean MongoDB...');
    
    // Connect with better options for DigitalOcean
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to DigitalOcean MongoDB');
    
    // List of emails to verify
    const emails = [
      "iamraymondbautista17@gmail.com",
      "albertjecksantos06162004@gmail.com"
    ];
    
    for (const email of emails) {
      console.log(`\n🔍 Checking: ${email}`);
      
      const user = await User.findOne({ email: email });
      
      if (!user) {
        console.log(`❌ User not found with email: ${email}`);
        continue;
      }
      
      console.log(`📋 Current Status:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Email Verified: ${user.isVerified}`);
      
      // Update to mark as verified if not already
      if (!user.isVerified) {
        console.log(`🔄 Marking ${email} as verified...`);
        
        const result = await User.updateOne(
          { email: email },
          {
            $set: {
              isVerified: true,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`✅ Successfully verified ${email}`);
        } else {
          console.log(`⚠️ Failed to update ${email}`);
        }
      } else {
        console.log(`✅ ${email} is already verified`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
  }
}

// Run the verification
verifyEmailAccounts().then(() => {
  console.log('\n🎯 Email verification complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});