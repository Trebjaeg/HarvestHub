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
      console.warn(`⚠️ Missing email environment variables: ${missingEnvVars.join(', ')}`);
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

    console.log('📧 Email Service Configuration:');
    console.log('  - Host:', config.host);
    console.log('  - Port:', config.port);
    console.log('  - Secure:', config.secure);
    console.log('  - User:', config.auth.user ? '✓ Set' : '✗ Not set');
    console.log('  - Pass:', config.auth.pass ? '✓ Set (length: ' + config.auth.pass.length + ')' : '✗ Not set');
    console.log('  - From:', process.env.MAIL_FROM || 'Using default');

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
   * Send a generic email with timeout
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 Email would be sent to:', options.to);
        console.log('📧 Subject:', options.subject);
        console.warn('⚠️ Email service not configured - SMTP credentials missing');
        return false;
      }

      console.log('📧 Attempting to send email...');
      console.log('  - To:', options.to);
      console.log('  - From:', this.fromAddress);
      console.log('  - Subject:', options.subject);

      // Add 10 second timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 10 seconds')), 10000);
      });

      const sendPromise = this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      const info = await Promise.race([sendPromise, timeoutPromise]);

      console.log('✅ Email sent successfully!');
      console.log('  - Message ID:', info.messageId);
      console.log('  - Response:', info.response);
      return true;
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        console.error('⏱️ Email sending timeout - SMTP server too slow');
      } else {
        console.error('❌ Failed to send email:');
        console.error('  - Error:', error.message);
        console.error('  - Code:', error.code);
        console.error('  - Command:', error.command);
        if (error.responseCode) {
          console.error('  - Response Code:', error.responseCode);
        }
        if (error.response) {
          console.error('  - Response:', error.response);
        }
      }
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

  /**
   * Send order confirmation email to buyer
   */
  async sendOrderConfirmation(
    email: string,
    orderDetails: {
      orderNumber: string;
      buyerName: string;
      products: Array<{
        productName: string;
        quantity: number;
        price: number;
        unit: string;
      }>;
      totalAmount: number;
      deliveryFee: number;
      finalAmount: number;
      deliveryAddress: {
        fullName: string;
        phoneNumber: string;
        address: string;
        barangay: string;
        city: string;
        province: string;
        postalCode: string;
      };
      estimatedDelivery?: Date;
    }
  ): Promise<boolean> {
    const { 
      orderNumber, 
      buyerName, 
      products, 
      totalAmount, 
      deliveryFee, 
      finalAmount,
      deliveryAddress,
      estimatedDelivery 
    } = orderDetails;

    const subject = `Order Confirmation - ${orderNumber}`;
    
    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount);
    };

    // Format date
    const formatDate = (date?: Date) => {
      if (!date) return 'To be confirmed';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #4A7C59 0%, #3d6549 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
        .header p { color: #e8f5e9; margin: 10px 0 0; font-size: 14px; }
        .content { padding: 40px 30px; }
        .order-info { background-color: #f8f9fa; border-left: 4px solid #4A7C59; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
        .order-info h2 { margin: 0 0 10px; color: #333; font-size: 20px; font-weight: 600; }
        .order-info p { margin: 5px 0; color: #666; font-size: 14px; }
        .section-title { color: #333; font-size: 18px; font-weight: 600; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
        .product-item { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e0e0e0; }
        .product-item:last-child { border-bottom: none; }
        .product-name { font-weight: 500; color: #333; }
        .product-quantity { color: #666; font-size: 14px; margin-top: 5px; }
        .product-price { font-weight: 600; color: #4A7C59; }
        .address-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 15px; }
        .address-box p { margin: 8px 0; color: #333; font-size: 14px; line-height: 1.6; }
        .totals { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 15px; }
        .total-row.final { border-top: 2px solid #4A7C59; padding-top: 15px; margin-top: 15px; font-weight: 700; font-size: 18px; color: #4A7C59; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 13px; }
        .footer a { color: #4A7C59; text-decoration: none; }
        .button { display: inline-block; background-color: #4A7C59; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
        .icon { width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🌾 HarvestHub Philippines</h1>
          <p>Thank you for your order!</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="order-info">
            <h2>Order Confirmed! 🎉</h2>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Estimated Delivery:</strong> ${formatDate(estimatedDelivery)}</p>
          </div>

          <p style="color: #333; font-size: 15px; line-height: 1.6;">
            Hi <strong>${buyerName}</strong>,
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Your order has been successfully placed and is being prepared by our farmers. You will receive updates as your order progresses.
          </p>

          <!-- Products -->
          <div class="section-title">📦 Order Items</div>
          <div>
            ${products.map(product => `
              <div class="product-item">
                <div>
                  <div class="product-name">${product.productName}</div>
                  <div class="product-quantity">${product.quantity} ${product.unit}</div>
                </div>
                <div class="product-price">${formatCurrency(product.price * product.quantity)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee:</span>
              <span>${formatCurrency(deliveryFee)}</span>
            </div>
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>${formatCurrency(finalAmount)}</span>
            </div>
          </div>

          <!-- Delivery Address -->
          <div class="section-title">📍 Delivery Address</div>
          <div class="address-box">
            <p><strong>${deliveryAddress.fullName}</strong></p>
            <p>${deliveryAddress.phoneNumber}</p>
            <p>${deliveryAddress.address}</p>
            <p>Barangay ${deliveryAddress.barangay}, ${deliveryAddress.city}</p>
            <p>${deliveryAddress.province} ${deliveryAddress.postalCode}</p>
          </div>

          <!-- Track Order Button -->
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://harvesthubph.com'}/buyer-orders" class="button">
              Track Your Order
            </a>
          </div>

          <p style="color: #666; font-size: 13px; line-height: 1.6; margin-top: 30px;">
            If you have any questions about your order, please don't hesitate to contact us or reach out to the seller directly through our platform.
          </p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>HarvestHub Philippines</strong></p>
          <p>Connecting farmers with customers</p>
          <p style="margin-top: 15px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://harvesthubph.com'}">Visit Website</a> | 
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://harvesthubph.com'}/buyer-orders">My Orders</a>
          </p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
export default emailService;