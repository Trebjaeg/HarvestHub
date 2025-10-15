// Test SendGrid email delivery
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testSendGridDelivery() {
  console.log('📧 Testing SendGrid Email Delivery');
  console.log('==================================');
  
  // Check configuration
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP User:', process.env.SMTP_USER);
  console.log('SMTP Pass:', process.env.SMTP_PASS ? 'Set ✅' : 'Missing ❌');
  console.log('Mail From:', process.env.MAIL_FROM);
  
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Test connection
    console.log('\n🔄 Testing SendGrid connection...');
    await transporter.verify();
    console.log('✅ SendGrid connection successful!');
    
    // Send test email
    console.log('\n📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: 'iamraymondbautista17@gmail.com',
      subject: 'HarvestHub - SendGrid Test Email',
      html: `
        <h2>SendGrid Test Email</h2>
        <p>This is a test email to verify SendGrid is working correctly.</p>
        <p>If you receive this, your email service is configured properly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('📱 Check your email inbox (including spam folder)');
    
  } catch (error) {
    console.error('❌ SendGrid test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication failed - check your SendGrid API key');
    } else if (error.code === 'EDNS') {
      console.log('💡 DNS resolution failed - check your internet connection');
    } else if (error.responseCode === 401) {
      console.log('💡 Unauthorized - your SendGrid API key may be invalid');
    } else if (error.responseCode === 403) {
      console.log('💡 Forbidden - your SendGrid account may be suspended');
    }
  }
}

testSendGridDelivery();