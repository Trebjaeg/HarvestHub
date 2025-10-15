import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    // Validate required environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.warn(`Missing email environment variables: ${missingEnvVars.join(', ')}`);
      console.warn('Email functionality will be disabled until these are configured.');
    }

    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.fromAddress = process.env.MAIL_FROM || `"HarvestHub Philippines" <${config.auth.user}>`;
    this.transporter = nodemailer.createTransport(config);
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Email would be sent to:', options.to);
        console.log('Subject:', options.subject);
        console.log('Email service not configured - check your environment variables');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(' Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error(' Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send email verification link
   */
  async sendEmailVerification(email: string, verificationUrl: string, userName?: string): Promise<boolean> {
    const subject = 'Verify Your HarvestHub Philippines Account';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - HarvestHub Philippines</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            padding: 40px 30px;
            color: #333;
          }
          .greeting {
            font-size: 18px;
            color: #4CAF50;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .verify-btn {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            transition: background-color 0.3s;
          }
          .verify-btn:hover {
            background: #45a049;
          }
          .security-notice {
            background: #f8f9fa;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice strong {
            color: #0c5460;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
          }
          .footer a {
            color: #4CAF50;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0 10px;
            }
            .content {
              padding: 20px 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 HarvestHub Philippines</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              ${userName ? `Welcome ${userName}!` : 'Welcome!'}
            </div>
            
            <p>Thank you for registering with HarvestHub Philippines! To complete your account setup and start connecting with local farmers and buyers, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="verify-btn">Verify My Email</a>
            </div>
            
            <p>This verification link will expire in 24 hours for security reasons.</p>
            
            <div class="security-notice">
              <strong>🔒 Security Note:</strong> If you didn't create an account with HarvestHub Philippines, please ignore this email. Your email address will not be added to our system.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            
            <p>After verification, you'll be able to:</p>
            <ul style="color: #555;">
              <li>🛒 Browse and purchase fresh produce from local farmers</li>
              <li>🌾 Apply to become a verified seller (for farmers)</li>
              <li>💬 Connect directly with farmers and buyers</li>
              <li>📱 Access all HarvestHub Philippines features</li>
            </ul>
            
            <p>Need help? Contact our support team at <a href="mailto:support@harvesthubph.app" style="color: #4CAF50;">support@harvesthubph.app</a></p>
          </div>
          
          <div class="footer">
            <p>This email was sent by HarvestHub Philippines</p>
            <p>© ${new Date().getFullYear()} HarvestHub Philippines. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send email verification code (6-digit) for registration
   */
  async sendVerificationCode(email: string, code: string, userName?: string): Promise<boolean> {
    const subject = 'Your HarvestHub Philippines Verification Code';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification Code - HarvestHub Philippines</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #4CAF50;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .verification-code {
            background: #f8f9fa;
            border: 3px solid #4CAF50;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .code-number {
            font-size: 36px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .code-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
          }
          .security-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          
          <div class="content">
            ${userName ? `<div class="greeting">Hello ${userName}!</div>` : ''}
            
            <p>Thank you for registering with HarvestHub Philippines! To complete your registration, please enter the verification code below:</p>
            
            <div class="verification-code">
              <div class="code-label">Your Verification Code</div>
              <div class="code-number">${code}</div>
              <div style="color: #666; font-size: 14px; margin-top: 10px;">
                This code expires in 10 minutes
              </div>
            </div>
            
            <div class="security-notice">
              <strong>🔒 Security Note:</strong> If you didn't try to register an account with HarvestHub Philippines, please ignore this email. Do not share this code with anyone.
            </div>
            
            <p>After verification, you'll be able to:</p>
            <ul style="color: #555;">
              <li>🛒 Browse and purchase fresh produce from local farmers</li>
              <li>🌾 Apply to become a verified seller (for farmers)</li>
              <li>💬 Connect directly with farmers and buyers</li>
              <li>📱 Access all HarvestHub Philippines features</li>
            </ul>
            
            <p style="margin-top: 30px; color: #6c757d;">
              Need help? Contact us at support@harvesthubph.app
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by HarvestHub Philippines</p>
            <p>© ${new Date().getFullYear()} HarvestHub Philippines. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email with verification code
   */
  async sendPasswordResetCode(email: string, resetCode: string, userName?: string): Promise<boolean> {
    const subject = 'Your HarvestHub Philippines Password Reset Code';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code - HarvestHub Philippines</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
          }
          .reset-code {
            background: #f8f9fa;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .code-number {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
          }
          .security-notice {
            background: #f8f9fa;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice strong {
            color: #856404;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
          }
          .footer a {
            color: #4CAF50;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0 10px;
            }
            .content {
              padding: 20px 15px;
            }
            .code-number {
              font-size: 28px;
              letter-spacing: 6px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 HarvestHub Philippines</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              ${userName ? `Kumusta ${userName},` : 'Hello,'}
            </div>
            
            <p>We received a request to reset the password for your HarvestHub Philippines account associated with <strong>${email}</strong>.</p>
            
            <p>Enter this verification code in your app to reset your password:</p>
            
            <div class="reset-code">
              <p style="margin: 0; font-size: 14px; color: #6c757d;">Your verification code is:</p>
              <div class="code-number">${resetCode}</div>
              <p style="margin: 0; font-size: 12px; color: #6c757d;">Enter this code in the verification modal</p>
            </div>
            
            <div class="security-notice">
              <strong>🔒 Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code will expire in <strong>15 minutes</strong> for your security</li>
                <li>This code can only be used once</li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this reset, you can safely ignore this email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px; color: #6c757d;">
              Need help? Contact us at support@harvesthubph.app
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by HarvestHub Philippines</p>
            <p>Visit us at: <a href="https://harvesthubph.app">harvesthubph.app</a></p>
            <p>© ${new Date().getFullYear()} HarvestHub Philippines. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Code - HarvestHub Philippines

${userName ? `Kumusta ${userName},` : 'Hello,'}

We received a request to reset the password for your HarvestHub Philippines account (${email}).

Your verification code is: ${resetCode}

Enter this code in the verification modal to reset your password.

Important Security Information:
- This code will expire in 15 minutes
- This code can only be used once
- Never share this code with anyone
- If you didn't request this reset, you can safely ignore this email

Need help? Contact us at support@harvesthubph.app
Visit us at: https://harvesthubph.app

© ${new Date().getFullYear()} HarvestHub Philippines. All rights reserved.
This is an automated message, please do not reply to this email.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send account verification email
   */
  async sendAccountVerification(email: string, verificationToken: string, userName?: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://harvesthubph.app';
    const verifyUrl = `${baseUrl}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    const subject = 'Welcome to HarvestHub Philippines - Verify Your Account';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verification - HarvestHub Philippines</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .verify-button {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌱 Welcome to HarvestHub Philippines!</h1>
          </div>
          
          <div style="padding: 30px 20px;">
            <p>${userName ? `Kumusta ${userName},` : 'Hello,'}</p>
            
            <p>Maligayang pagdating sa HarvestHub Philippines! 🇵🇭</p>
            <p>Please verify your email address to complete your account setup and start connecting with local farmers and fresh produce.</p>
            
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="verify-button">Verify My Account</a>
            </div>
            
            <p>This verification link will expire in 24 hours for security purposes.</p>
            
            <p style="margin-top: 30px; color: #6c757d;">
              Need help? Contact us at support@harvesthubph.app
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by HarvestHub Philippines</p>
            <p>© ${new Date().getFullYear()} HarvestHub Philippines. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
export default emailService;