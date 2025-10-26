const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Simple User Schema (minimal for checking)
const UserSchema = new mongoose.Schema({
  email: String,
  name: String,
  firstName: String,
  lastName: String,
  role: String,
  status: String,
  suspendedAt: Date,
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suspendReason: String,
  suspensionExpiresAt: Date,
  isVerified: Boolean,
  lockUntil: Date,
  accountLocked: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function checkSuspendedUser() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all suspended users
    console.log('📋 Looking for suspended users...');
    const suspendedUsers = await User.find({ status: 'suspended' })
      .populate('suspendedBy', 'email name')
      .lean();

    if (suspendedUsers.length === 0) {
      console.log('❌ No suspended users found in database');
      console.log('\n💡 Tip: Make sure you suspended the account from admin panel\n');
    } else {
      console.log(`✅ Found ${suspendedUsers.length} suspended user(s):\n`);
      
      suspendedUsers.forEach((user, index) => {
        console.log(`${index + 1}. User Details:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || `${user.firstName} ${user.lastName}`.trim()}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Email Verified: ${user.isVerified}`);
        console.log(`   Suspended At: ${user.suspendedAt ? new Date(user.suspendedAt).toLocaleString() : 'N/A'}`);
        console.log(`   Suspended By: ${user.suspendedBy ? user.suspendedBy.email : 'N/A'}`);
        console.log(`   Reason: ${user.suspendReason || 'No reason provided'}`);
        console.log(`   Expires At: ${user.suspensionExpiresAt ? new Date(user.suspensionExpiresAt).toLocaleString() : 'Permanent'}`);
        console.log(`   Account Locked: ${user.accountLocked || false}`);
        console.log(`   Lock Until: ${user.lockUntil ? new Date(user.lockUntil).toLocaleString() : 'Not locked'}`);
        console.log('');
      });

      console.log('✅ These users should be able to login but with restricted actions');
      console.log('🔔 They will see a suspension banner in their dashboard\n');
    }

    // Also check for deleted users
    console.log('📋 Looking for deleted users...');
    const deletedUsers = await User.find({ status: 'deleted' }).lean();
    
    if (deletedUsers.length > 0) {
      console.log(`⚠️  Found ${deletedUsers.length} deleted user(s):`);
      deletedUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - Status: ${user.status}`);
      });
      console.log('❌ These users CANNOT login at all\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

checkSuspendedUser();
