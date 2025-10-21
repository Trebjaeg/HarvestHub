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

async function promoteToSuperAdmin() {
  try {
    console.log('🌱 HarvestHub - Promoting to SuperAdmin');
    console.log('=====================================\n');
    
    // Use the connection string from .env.local
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return;
    }
    
    console.log('🔄 Connecting to DigitalOcean MongoDB...');
    
    // Connect with better options for DigitalOcean
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      connectTimeoutMS: 30000, // 30 second connection timeout
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Connected to DigitalOcean MongoDB');
    
    const email = "mirafuentesaprodhite@gmail.com";
    
    // First, check if user exists
    const existingUser = await User.findOne({ email: email });
    
    if (!existingUser) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('💡 Creating superadmin account...');

      // Create new superadmin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('HarvestHub2024!', 12); // Default password
      
      const newUser = new User({
        name: "Mira Fuentes",
        email: email,
        password: hashedPassword,
        role: "superadmin",
        status: "active",
        tokenVersion: 1,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newUser.save();
      console.log('✅ Successfully created superadmin account!');
      console.log('🔑 Default password: HarvestHub2024!');
      console.log('⚠️  Please change this password after first login');
    } else {
      // Update existing user to superadmin
      const result = await User.updateOne(
        { email: email },
        {
          $set: {
            role: "superadmin",
            status: "active",
            tokenVersion: existingUser.tokenVersion + 1,
            isVerified: true,
            // Clear any suspension fields if they exist
            suspendedAt: null,
            suspendedBy: null,
            suspendReason: null,
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log('✅ Successfully promoted to superadmin!');
      } else {
        console.log('ℹ️ User already has superadmin privileges');
      }
    }

    // Verify the update
    const updatedUser = await User.findOne({ email: email });
    console.log('\n📋 User Status:');
    console.log(`   Name: ${updatedUser?.name}`);
    console.log(`   Email: ${updatedUser?.email}`);
    console.log(`   Role: ${updatedUser?.role}`);
    console.log(`   Status: ${updatedUser?.status}`);
    console.log(`   Email Verified: ${updatedUser?.isVerified}`);
    console.log(`   Token Version: ${updatedUser?.tokenVersion}`);

  } catch (error) {
    console.error('❌ Error promoting user to superadmin:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Connection Tips:');
      console.log('1. Check your IP is whitelisted in DigitalOcean Database settings');
      console.log('2. Verify your database credentials');
      console.log('3. Ensure your internet connection is stable');
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n📡 Disconnected from MongoDB');
    }
  }
}

// Run the promotion
promoteToSuperAdmin().then(() => {
  console.log('\n🎯 Process complete!');
  console.log('🔗 You can now log in at: https://harvesthubph.app/admin');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});