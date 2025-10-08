import type { NextApiRequest, NextApiResponse } from 'next';
import emailService from '@/lib/email-service';
import { withSecurity, withLogging } from '@/lib/middleware';

async function testEmailHandler(req: NextApiRequest, res: NextApiResponse) {
  const { email, type = 'test' } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email address is required' 
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email format' 
    });
  }

  try {
    // First verify email service configuration
    const isConfigured = await emailService.verifyConnection();
    
    if (!isConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not properly configured',
        hint: 'Check your SMTP environment variables in .env.local'
      });
    }

    let emailSent = false;
    let emailType = '';

    switch (type) {
      case 'password-reset':
        emailSent = await emailService.sendPasswordResetCode(email, '1234', 'Test User');
        emailType = 'Password Reset';
        break;
      
      case 'verification':
        emailSent = await emailService.sendAccountVerification(email, 'verify-token-123', 'Test User');
        emailType = 'Account Verification';
        break;
      
      default:
        // Send a generic test email
        emailSent = await emailService.sendEmail({
          to: email,
          subject: 'HarvestHub Email Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h1>HarvestHub</h1>
                <h2>Email Test Successful!</h2>
              </div>
              
              <div style="padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px;">
                <p><strong>Great news!</strong> Your email configuration is working perfectly.</p>
                <p>This test email was sent at: <strong>${new Date().toLocaleString()}</strong></p>
                <p>Email service is ready for:</p>
                <ul>
                  <li>Password reset emails</li>
                  <li>Account verification emails</li>
                  <li>General notifications</li>
                </ul>
              </div>
              
              <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>This is a test email from your HarvestHub application.</p>
                <p>© ${new Date().getFullYear()} HarvestHub. All rights reserved.</p>
              </div>
            </div>
          `,
          text: `
HarvestHub Email Test

Great news! Your email configuration is working perfectly.

This test email was sent at: ${new Date().toLocaleString()}

Email service is ready for:
- Password reset emails
- Account verification emails  
- General notifications

This is a test email from your HarvestHub application.
© ${new Date().getFullYear()} HarvestHub. All rights reserved.
          `
        });
        emailType = 'Test Email';
        break;
    }

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: `${emailType} sent successfully!`,
        details: {
          recipient: email,
          type: emailType,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to send ${emailType.toLowerCase()}`,
        hint: 'Check your SMTP credentials and network connection'
      });
    }

  } catch (error: any) {
    console.error('Email test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email test failed',
      error: error.message,
      hint: 'Check your email configuration in .env.local'
    });
  }
}

// Apply security middleware
export default withSecurity(
  withLogging(testEmailHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['POST'],
    cors: true
  }
);