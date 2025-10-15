// Test script for password reset flow
// Run this with: node scripts/test-password-reset.js

const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Test the hashing function that's used in the password reset
const testCode = '1234';
const hashedCode = hashToken(testCode);

console.log('=== Password Reset Token Test ===');
console.log('Original code:', testCode);
console.log('Hashed code:', hashedCode);
console.log('Hash length:', hashedCode.length);

// Test various codes to see the pattern
const testCodes = ['1234', '5678', '0000', '9999'];
testCodes.forEach(code => {
  const hash = hashToken(code);
  console.log(`Code: ${code} -> Hash: ${hash}`);
});

console.log('\n=== JWT Test ===');
const jwt = require('jsonwebtoken');

// Test JWT creation (similar to verify-reset-code.ts)
const testPayload = {
  userId: '507f1f77bcf86cd799439011', // Example ObjectId
  email: 'test@example.com',
  purpose: 'password_reset',
  codeUsed: hashedCode
};

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const resetToken = jwt.sign(testPayload, JWT_SECRET, { 
  expiresIn: '10m',
  issuer: 'harvesthub-ph',
  audience: 'password-reset'
});

console.log('Generated JWT token length:', resetToken.length);
console.log('Token preview:', resetToken.substring(0, 50) + '...');

// Test decoding
try {
  const decoded = jwt.verify(resetToken, JWT_SECRET);
  console.log('Successfully decoded JWT:', decoded);
} catch (error) {
  console.error('JWT decode error:', error.message);
}