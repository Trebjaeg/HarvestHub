// Complete password reset flow test
// This simulates the entire password reset process

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.local' });

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function testCompleteFlow() {
  console.log('🔐 Testing Complete Password Reset Flow');
  console.log('=====================================\n');

  const testEmail = 'iamraymondbautista17@gmail.com';
  const testCode = '1234'; // Simulated 4-digit code
  const newPassword = 'NewPassword123!';
  
  console.log('📧 Step 1: Request Password Reset');
  console.log(`Email: ${testEmail}`);
  
  try {
    const requestResponse = await fetch('http://localhost:3001/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    
    console.log('Raw response status:', requestResponse.status);
    console.log('Raw response headers:', Object.fromEntries(requestResponse.headers));
    const responseText = await requestResponse.text();
    console.log('Raw response text:', responseText.substring(0, 500));
    
    let requestData;
    try {
      requestData = JSON.parse(responseText);
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
      console.log('Response was:', responseText.substring(0, 200));
      return;
    }
    console.log('✅ Request Status:', requestResponse.status);
    console.log('📄 Request Response:', requestData);
    
    if (!requestResponse.ok) {
      throw new Error(`Request failed: ${requestData.message}`);
    }
    
    console.log('\n🔍 Step 2: Verify Reset Code (Simulated)');
    console.log(`Code: ${testCode}`);
    
    // This would normally be the code from email
    // For testing, we'll simulate the verification
    const verifyResponse = await fetch('http://localhost:3001/api/auth/verify-reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: testEmail, 
        code: testCode 
      })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('✅ Verify Status:', verifyResponse.status);
    console.log('📄 Verify Response:', verifyData);
    
    if (!verifyResponse.ok) {
      console.log('❌ Verification failed. This is expected if the code doesn\'t match the one sent to email.');
      console.log('💡 To test fully, use the actual 4-digit code from the email.');
      return;
    }
    
    console.log('\n🔄 Step 3: Reset Password');
    const resetToken = verifyData.resetToken;
    console.log('🎫 Reset Token received:', resetToken ? 'Yes' : 'No');
    
    if (!resetToken) {
      throw new Error('No reset token received from verification');
    }
    
    const resetResponse = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resetToken: resetToken,
        password: newPassword
      })
    });
    
    const resetData = await resetResponse.json();
    console.log('✅ Reset Status:', resetResponse.status);
    console.log('📄 Reset Response:', resetData);
    
    if (resetResponse.ok) {
      console.log('\n🎉 Password Reset Successful!');
    } else {
      console.log('\n❌ Password Reset Failed');
      console.log('Error:', resetData.message);
    }
    
  } catch (error) {
    console.error('🚨 Test Error:', error.message);
  }
}

testCompleteFlow();