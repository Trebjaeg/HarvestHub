const fetch = require('node-fetch');

// Test password reset functionality
async function testResetPassword() {
  console.log('🧪 Testing Password Reset Flow');
  console.log('=====================================\n');

  const testEmail = 'admin@harvesthubph.app'; // Use our existing superadmin email
  
  try {
    // Step 1: Request password reset
    console.log('📧 Step 1: Requesting password reset code');
    console.log('Email:', testEmail);
    
    const resetResponse = await fetch('http://localhost:3000/api/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });

    const resetData = await resetResponse.json();
    console.log('Response status:', resetResponse.status);
    console.log('Response data:', resetData);
    
    if (!resetResponse.ok) {
      console.error('❌ Reset request failed:', resetData.message);
      return;
    }
    
    console.log('✅ Reset request processed');
    console.log('📨 Check server logs for email sending status');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testResetPassword();