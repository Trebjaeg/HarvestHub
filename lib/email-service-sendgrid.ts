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
      from: process.env.MAIL_FROM || 'admin@harvesthubph.app',
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

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
