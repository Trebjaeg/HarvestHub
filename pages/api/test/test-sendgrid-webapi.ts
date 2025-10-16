import type { NextApiRequest, NextApiResponse } from 'next';
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email-service-sendgrid';

/**
 * Test endpoint for SendGrid Web API
 * 
 * Usage:
 * POST /api/test/test-sendgrid-webapi
 * Headers: { "Authorization": "Bearer YOUR_MONITORING_TOKEN" }
 * Body: { "to": "your-email@example.com", "type": "verification" | "reset" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.MONITORING_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, type = 'verification' } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Missing "to" email address' });
  }

  try {
    const testCode = type === 'verification' ? '123456' : '1234';
    const startTime = Date.now();

    console.log(`\n🧪 Testing SendGrid Web API - ${type}`);
    console.log(`   To: ${to}`);
    console.log(`   Code: ${testCode}`);

    if (type === 'verification') {
      await sendVerificationEmail(to, testCode);
    } else {
      await sendPasswordResetEmail(to, testCode);
    }

    const duration = Date.now() - startTime;

    console.log(`✅ Test email sent successfully in ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: `Test ${type} email sent successfully via Web API!`,
      to,
      code: testCode,
      duration: `${duration}ms`,
      method: 'SendGrid Web API (HTTPS)',
      port: '443 (bypasses SMTP port blocking)',
    });
  } catch (error: any) {
    console.error('❌ SendGrid Web API test failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.body || 'No additional details',
      statusCode: error.response?.statusCode,
    });
  }
}
