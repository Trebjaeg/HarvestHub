import type { NextApiRequest, NextApiResponse } from 'next';
import emailService from '@/lib/email-service';

/**
 * Test email sending endpoint
 * Only works in development mode for security
 * Call: POST /api/test/test-email with { "email": "your@email.com" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow in development or with special token
  const authToken = req.headers['x-test-token'];
  if (process.env.NODE_ENV === 'production' && authToken !== process.env.MONITORING_TOKEN) {
    return res.status(403).json({ message: 'Forbidden - test endpoint' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  console.log('🧪 Testing email service...');
  console.log('📧 Test recipient:', email);

  try {
    // Test 1: Verify connection
    console.log('\n1️⃣ Testing SMTP connection...');
    const connectionOk = await emailService.verifyConnection();
    
    if (!connectionOk) {
      console.error('❌ SMTP connection failed');
      return res.status(500).json({
        success: false,
        message: 'SMTP connection failed',
        step: 'connection',
      });
    }
    console.log('✅ SMTP connection successful');

    // Test 2: Send test email
    console.log('\n2️⃣ Sending test email...');
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const emailSent = await emailService.sendVerificationCode(email, testCode);

    if (emailSent) {
      console.log('✅ Test email sent successfully!');
      console.log('🔑 Test code:', testCode);
      
      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully! Check your inbox.',
        testCode: testCode,
        step: 'sent',
      });
    } else {
      console.error('❌ Failed to send test email');
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check server logs for details.',
        step: 'sending',
      });
    }
  } catch (error: any) {
    console.error('❌ Email test error:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Email test failed',
      error: error.toString(),
    });
  }
}
