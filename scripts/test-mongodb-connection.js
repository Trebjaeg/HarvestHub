const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('📋 Connection String:', process.env.MONGODB_URI ? 'Found' : 'Missing');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  // Hide password in logs
  const sanitizedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
  console.log('🔗 Connecting to:', sanitizedUri);

  try {
    const startTime = Date.now();
    
    // Test connection with timeout
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 second timeout
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    });

    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectionTime}ms`);
    console.log('📊 Connection Details:');
    console.log('  - State:', mongoose.connection.readyState);
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - Database:', mongoose.connection.name);
    
    // Test a simple query
    const testStart = Date.now();
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    const queryTime = Date.now() - testStart;
    
    console.log(`✅ Database ping successful in ${queryTime}ms`);
    console.log('📈 Ping result:', result);
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('🔍 Error details:');
    
    if (error.code) {
      console.error('  - Error Code:', error.code);
    }
    
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.error('\n🚨 TIMEOUT ERROR TROUBLESHOOTING:');
      console.error('1. Check if your IP is whitelisted in DigitalOcean MongoDB');
      console.error('2. Verify firewall settings on your network');
      console.error('3. Try connecting from a different network');
      console.error('4. Check if the database cluster is running');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n🔐 AUTHENTICATION ERROR:');
      console.error('1. Verify username and password in connection string');
      console.error('2. Check user permissions in database');
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

testConnection();