import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY || '';
if (!apiKey) {
  console.error('SendGrid API key is not configured');
} else {
  sgMail.setApiKey(apiKey);
}

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Send email using SendGrid Web API (HTTPS - port 443)
 * This bypasses SMTP port blocking issues
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const startTime = Date.now();

  try {
    // Create timeout promise (10 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Email sending timeout'));
      }, 10000);
    });

    // Send email via Web API
    const sendPromise = sgMail.send({
      to: options.to,
      from: process.env.MAIL_FROM || 'no-reply@harvesthubph.app',
      subject: options.subject,
      html: options.html || options.text || '',
      text: options.text,
    });

    // Race between send and timeout
    const result = await Promise.race([sendPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`Email sent to ${options.to} in ${duration}ms`);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`Email sending failed after ${duration}ms: ${error.message}`);
    throw error;
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; 
                letter-spacing: 8px; margin: 20px 0; padding: 15px; 
                background: white; border: 2px dashed #4CAF50; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌾 HarvestHub Email Verification</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>Thank you for registering with HarvestHub. Please use the verification code below to complete your registration:</p>
          <div class="code">${code}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2025 HarvestHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Verify Your HarvestHub Email',
    html,
    text: `Your HarvestHub verification code is: ${code}. This code expires in 10 minutes.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B6B; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .code { font-size: 32px; font-weight: bold; color: #FF6B6B; text-align: center; 
                letter-spacing: 8px; margin: 20px 0; padding: 15px; 
                background: white; border: 2px dashed #FF6B6B; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #FFF3CD; border-left: 4px solid #FF6B6B; padding: 12px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 HarvestHub Password Reset</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>We received a request to reset your HarvestHub password. Use the code below to continue:</p>
          <div class="code">${code}</div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This code expires in 10 minutes. 
            If you didn't request this reset, please ignore this email and your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 HarvestHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Reset Your HarvestHub Password',
    html,
    text: `Your HarvestHub password reset code is: ${code}. This code expires in 10 minutes.`,
  });
}

/**
 * Send password changed confirmation email
 */
export async function sendPasswordChangedEmail(to: string, userName?: string): Promise<void> {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Manila',
    dateStyle: 'long',
    timeStyle: 'short'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; }
        .success-box { background: #D4EDDA; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
        .info-box { background: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .warning-box { background: #FFF3CD; border-left: 4px solid #FF6B6B; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed Successfully</h1>
        </div>
        <div class="content">
          <p>Hello${userName ? ` ${userName}` : ''}!</p>
          
          <div class="success-box">
            <strong>✓ Your HarvestHub password has been changed successfully.</strong>
          </div>

          <div class="info-box">
            <strong>📅 Changed On:</strong> ${timestamp} (Philippine Time)
            <br/>
            <strong>📧 Account Email:</strong> ${to}
          </div>

          <p>You can now log in to your HarvestHub account using your new password.</p>

          <div class="warning-box">
            <strong>⚠️ Security Alert:</strong>
            <br/>
            If you did not make this change, please contact our support team immediately at 
            <a href="mailto:support@harvesthubph.app">support@harvesthubph.app</a> or 
            secure your account by resetting your password.
          </div>

          <p style="margin-top: 30px;">
            <strong>Security Tips:</strong>
          </p>
          <ul>
            <li>Never share your password with anyone</li>
            <li>Use a unique password for HarvestHub</li>
            <li>Enable email notifications for account changes</li>
            <li>Log out from public computers after use</li>
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated security notification from HarvestHub Philippines.</p>
          <p>© 2025 HarvestHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello${userName ? ` ${userName}` : ''}!

Your HarvestHub password has been changed successfully.

Changed On: ${timestamp} (Philippine Time)
Account Email: ${to}

You can now log in using your new password.

SECURITY ALERT: If you did not make this change, please contact support@harvesthubph.app immediately.

Security Tips:
- Never share your password with anyone
- Use a unique password for HarvestHub
- Enable email notifications for account changes
- Log out from public computers after use

This is an automated security notification from HarvestHub Philippines.
© 2025 HarvestHub. All rights reserved.
  `;

  await sendEmail({
    to,
    subject: '🔒 Your HarvestHub Password Was Changed',
    html,
    text,
  });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
