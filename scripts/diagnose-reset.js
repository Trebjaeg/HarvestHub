// Simple diagnostic for password reset issues

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  
  try {
    const mongoose = require('mongoose');
    require('dotenv').config({ path: '.env.local' });
    
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log('MongoDB URI configured:', !!MONGODB_URI);
    
    if (MONGODB_URI) {
      console.log('Attempting connection...');
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ Database connected successfully');
      
      // Test if User model works
      const User = require('../models/User').default;
      const userCount = await User.countDocuments();
      console.log('📊 Total users in database:', userCount);
      
      const testUser = await User.findOne({ email: 'iamraymondbautista17@gmail.com' });
      console.log('👤 Your user account exists:', !!testUser);
      
      if (testUser) {
        console.log('   - Name:', testUser.name);
        console.log('   - Role:', testUser.role);
        console.log('   - Status:', testUser.status);
      }
      
      await mongoose.disconnect();
      console.log('📡 Disconnected from database');
      
    } else {
      console.log('❌ No MongoDB URI found in environment');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

async function testEmailService() {
  console.log('\n📧 Testing Email Service...');
  
  try {
    const emailService = require('../lib/email-service').default;
    console.log('Email service loaded:', !!emailService);
    
    // Check if required env vars exist
    const smtpHost = process.env.SMTP_HOST;
    const smtpPass = process.env.SMTP_PASS;
    
    console.log('SMTP Host configured:', !!smtpHost);
    console.log('SMTP Password configured:', !!smtpPass);
    
    if (smtpHost) {
      console.log('SMTP Host:', smtpHost);
    }
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

async function testSecurityFunctions() {
  console.log('\n🔐 Testing Security Functions...');
  
  try {
    const { sanitizeInput, hashToken } = require('../lib/security');
    
    const testInput = 'test@example.com';
    const sanitized = sanitizeInput(testInput);
    console.log('✅ sanitizeInput works:', sanitized === testInput);
    
    const testToken = '1234';
    const hashed = hashToken(testToken);
    console.log('✅ hashToken works:', hashed.length === 64);
    
  } catch (error) {
    console.error('❌ Security functions test failed:', error.message);
  }
}

async function runDiagnostics() {
  console.log('🔧 HarvestHub Password Reset Diagnostics');
  console.log('=========================================');
  
  await testDatabaseConnection();
  await testEmailService();
  await testSecurityFunctions();
  
  console.log('\n✅ Diagnostics complete!');
}

runDiagnostics().catch(console.error);