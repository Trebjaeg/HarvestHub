// Simple test to check what's causing the 500 error
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Quick Password Reset Issue Check');
console.log('===================================');

// Check if critical files exist
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'lib/mongodb.ts',
  'lib/email-service.ts', 
  'lib/security.ts',
  'models/User.ts',
  'pages/api/auth/request-password-reset.ts'
];

console.log('\n📁 Checking critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// Check environment variables
console.log('\n🌍 Environment Variables:');
const envVars = [
  'MONGODB_URI',
  'SMTP_HOST', 
  'SMTP_PASS',
  'JWT_SECRET'
];

envVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  console.log(`   ${exists ? '✅' : '❌'} ${envVar}`);
});

console.log('\n📧 Email Config Check:');
console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
console.log('   SMTP_USER:', process.env.SMTP_USER || 'Not set'); 
console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');

console.log('\n💡 Most likely causes of 500 error:');
console.log('   1. Missing SMTP configuration');
console.log('   2. Database connection issue');
console.log('   3. Missing dependencies in email service');
console.log('   4. Import/export issues in TypeScript files');

console.log('\n🔧 Quick Fix Suggestions:');
console.log('   1. Check server terminal for detailed error logs');
console.log('   2. Verify all npm packages are installed');
console.log('   3. Restart your Next.js server');
console.log('   4. Check browser Network tab for more details');