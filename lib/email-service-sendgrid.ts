import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY || '';
if (!apiKey) {
  // SendGrid API key not configured
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

    // Email sent successfully
  } catch (error: any) {
    // Email sending failed
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

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: {
    orderNumber: string;
    buyerName: string;
    sellerName: string;
    products: Array<{ productName: string; quantity: number; price: number; unit: string }>;
    totalAmount: number;
    deliveryFee: number;
    finalAmount: number;
    deliveryAddress: string;
    estimatedDelivery?: Date;
    paymentMethod: string;
  }
): Promise<void> {
  const timestamp = new Date().toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const estimatedDeliveryDate = orderDetails.estimatedDelivery 
    ? new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-PH', { 
        timeZone: 'Asia/Manila',
        dateStyle: 'long'
      })
    : 'To be determined';

  const productsHtml = orderDetails.products.map(p => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity} ${p.unit}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₱${p.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₱${(p.price * p.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        .header { background: linear-gradient(135deg, #4A7C59 0%, #3d6549 100%); color: white; 
                  padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-box { background: #D4EDDA; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; }
        .info-box { background: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background: #4A7C59; color: white; padding: 12px; text-align: left; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        .button { display: inline-block; padding: 12px 30px; background: #4A7C59; color: white !important;
                  text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎉 Order Confirmed!</h1>
          <p style="margin: 10px 0 0 0;">Order #${orderDetails.orderNumber}</p>
        </div>
        <div class="content">
          <div class="success-box">
            <strong>✅ Good news, ${orderDetails.buyerName}!</strong>
            <br/>
            Your order has been confirmed by ${orderDetails.sellerName} and is now being prepared for delivery.
          </div>

          <p><strong>Order Confirmed:</strong> ${timestamp}</p>
          <p><strong>Estimated Delivery:</strong> ${estimatedDeliveryDate}</p>

          <h2 style="color: #4A7C59; border-bottom: 2px solid #4A7C59; padding-bottom: 10px;">Order Details</h2>
          
          <table class="order-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 10px; text-align: right;">₱${orderDetails.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Delivery Fee:</strong></td>
                <td style="padding: 10px; text-align: right;">₱${orderDetails.deliveryFee.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>Total Amount:</strong></td>
                <td style="padding: 15px; text-align: right; font-size: 18px; color: #4A7C59;">₱${orderDetails.finalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="info-box">
            <strong>📍 Delivery Address:</strong>
            <br/>
            ${orderDetails.deliveryAddress}
          </div>

          <div class="info-box">
            <strong>💳 Payment Method:</strong> ${orderDetails.paymentMethod}
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthubph.app'}/orders" class="button">
              View Order Details
            </a>
          </p>

          <p style="margin-top: 30px;">
            <strong>What happens next?</strong>
          </p>
          <ul>
            <li>Your order is being prepared by the seller</li>
            <li>You'll receive updates as your order progresses</li>
            <li>Track your order status in your account</li>
            <li>Contact the seller if you have questions</li>
          </ul>
        </div>
        <div class="footer">
          <p>Thank you for shopping with HarvestHub Philippines!</p>
          <p>© 2025 HarvestHub. All rights reserved.</p>
          <p>Questions? Contact us at <a href="mailto:support@harvesthubph.app">support@harvesthubph.app</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const productsText = orderDetails.products.map(p => 
    `${p.productName} - ${p.quantity} ${p.unit} x ₱${p.price.toFixed(2)} = ₱${(p.price * p.quantity).toFixed(2)}`
  ).join('\n');

  const text = `
🎉 ORDER CONFIRMED!

Hello ${orderDetails.buyerName}!

Great news! Your order #${orderDetails.orderNumber} has been confirmed by ${orderDetails.sellerName} and is now being prepared for delivery.

Order Confirmed: ${timestamp}
Estimated Delivery: ${estimatedDeliveryDate}

ORDER DETAILS:
${productsText}

Subtotal: ₱${orderDetails.totalAmount.toFixed(2)}
Delivery Fee: ₱${orderDetails.deliveryFee.toFixed(2)}
Total Amount: ₱${orderDetails.finalAmount.toFixed(2)}

DELIVERY ADDRESS:
${orderDetails.deliveryAddress}

PAYMENT METHOD: ${orderDetails.paymentMethod}

WHAT HAPPENS NEXT?
- Your order is being prepared by the seller
- You'll receive updates as your order progresses
- Track your order status in your account
- Contact the seller if you have questions

View your order details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthubph.app'}/orders

Thank you for shopping with HarvestHub Philippines!

Questions? Contact us at support@harvesthubph.app
© 2025 HarvestHub. All rights reserved.
  `;

  await sendEmail({
    to,
    subject: `✅ Order Confirmed - #${orderDetails.orderNumber}`,
    html,
    text,
  });
}

/**
 * Send order modification email when products are removed
 */
export async function sendOrderModificationEmail(
  to: string,
  orderDetails: {
    orderNumber: string;
    buyerName: string;
    sellerName: string;
    deletedProducts: Array<{ productName: string; quantity: number; price: number }>;
    remainingProducts: Array<{ productName: string; quantity: number; price: number; unit?: string }>;
    originalAmount: number;
    newTotalAmount: number;
    deliveryFee: number;
    newFinalAmount: number;
    deliveryAddress: string;
    estimatedDelivery?: Date;
  }
): Promise<void> {
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  });

  const estimatedDeliveryDate = orderDetails.estimatedDelivery
    ? new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-US', {
        dateStyle: 'long',
        timeZone: 'Asia/Manila'
      })
    : 'To be determined';

  // Build deleted products list HTML
  const deletedProductsHtml = orderDetails.deletedProducts.map(p => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px; color: #999; text-decoration: line-through;">${p.productName}</td>
      <td style="padding: 12px; text-align: center; color: #999;">${p.quantity}</td>
      <td style="padding: 12px; text-align: right; color: #999;">₱${p.price.toFixed(2)}</td>
      <td style="padding: 12px; text-align: right; color: #999;">₱${(p.quantity * p.price).toFixed(2)}</td>
    </tr>
  `).join('');

  // Build remaining products list HTML
  const remainingProductsHtml = orderDetails.remainingProducts.map(p => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px;">${p.productName}</td>
      <td style="padding: 12px; text-align: center;">${p.quantity} ${p.unit || 'pcs'}</td>
      <td style="padding: 12px; text-align: right;">₱${p.price.toFixed(2)}</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">₱${(p.quantity * p.price).toFixed(2)}</td>
    </tr>
  `).join('');

  // Build deleted products text
  const deletedProductsText = orderDetails.deletedProducts.map(p =>
    `  - ${p.productName} (${p.quantity} pcs) × ₱${p.price.toFixed(2)} = ₱${(p.quantity * p.price).toFixed(2)} [REMOVED]`
  ).join('\n');

  // Build remaining products text
  const remainingProductsText = orderDetails.remainingProducts.map(p =>
    `  - ${p.productName} (${p.quantity} ${p.unit || 'pcs'}) × ₱${p.price.toFixed(2)} = ₱${(p.quantity * p.price).toFixed(2)}`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .warning-banner { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 15px 20px; margin: 20px; }
        .warning-banner h2 { margin: 0 0 10px 0; color: #F57C00; font-size: 18px; }
        .content { padding: 0 30px 30px 30px; }
        .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #4A7C59; font-size: 16px; }
        .products-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .products-table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
        .total-row { background: #f9f9f9; font-weight: bold; }
        .total-row.highlight { background: #4CAF50; color: white; }
        .button { display: inline-block; padding: 12px 30px; background: #4A7C59; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .highlight { color: #F57C00; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Order Modification Notice</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Order #${orderDetails.orderNumber}</p>
        </div>
        
        <div class="warning-banner">
          <h2>⚠️ Some Products Were Removed</h2>
          <p style="margin: 0;">We're sorry, but some items in your order are no longer available and have been removed by the seller. Your order has been confirmed with the remaining items.</p>
        </div>

        <div class="content">
          <p>Hello <strong>${orderDetails.buyerName}</strong>,</p>
          
          <p>Your order <strong>#${orderDetails.orderNumber}</strong> has been confirmed by <strong>${orderDetails.sellerName}</strong>, but unfortunately some products are no longer available.</p>

          <div class="info-box">
            <h3>❌ Removed Products</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${deletedProductsHtml}
              </tbody>
            </table>
          </div>

          <div class="info-box">
            <h3>✅ Confirmed Products</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${remainingProductsHtml}
              </tbody>
            </table>
          </div>

          <table style="width: 100%; margin: 20px 0;">
            <tr>
              <td><strong>Original Amount:</strong></td>
              <td style="text-align: right; text-decoration: line-through; color: #999;">₱${orderDetails.originalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>New Subtotal:</strong></td>
              <td style="text-align: right; color: #4CAF50; font-weight: bold;">₱${orderDetails.newTotalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Delivery Fee:</strong></td>
              <td style="text-align: right;">₱${orderDetails.deliveryFee.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #4CAF50;">
              <td><strong style="font-size: 18px;">New Total Amount:</strong></td>
              <td style="text-align: right; font-size: 18px; color: #4CAF50; font-weight: bold;">₱${orderDetails.newFinalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top: 10px; color: #4CAF50; font-weight: bold;">
                💰 You save: ₱${(orderDetails.originalAmount - orderDetails.newTotalAmount).toFixed(2)}
              </td>
            </tr>
          </table>

          <div class="info-box">
            <p style="margin: 0;"><strong>Delivery Address:</strong><br>${orderDetails.deliveryAddress}</p>
            <p style="margin: 10px 0 0 0;"><strong>Estimated Delivery:</strong> ${estimatedDeliveryDate}</p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Your order is being prepared with the available items</li>
            <li>You'll only pay for the confirmed products (₱${orderDetails.newFinalAmount.toFixed(2)})</li>
            <li>Track your order status in your account</li>
            <li>Contact the seller if you have questions</li>
          </ul>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthubph.app'}/buyer-orders" class="button">View Order Details</a>
          </div>

          <p>We apologize for any inconvenience. Thank you for your understanding!</p>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>HarvestHub Philippines Team</strong>
          </p>
        </div>

        <div class="footer">
          <p>Questions? Contact us at support@harvesthubph.app</p>
          <p>© 2025 HarvestHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
ORDER MODIFICATION NOTICE
Order #${orderDetails.orderNumber}

Hello ${orderDetails.buyerName}!

IMPORTANT: Some products in your order are no longer available and have been removed.

Your order has been confirmed by ${orderDetails.sellerName} with the remaining items.

REMOVED PRODUCTS:
${deletedProductsText}

CONFIRMED PRODUCTS:
${remainingProductsText}

AMOUNT SUMMARY:
Original Amount: ₱${orderDetails.originalAmount.toFixed(2)}
New Subtotal: ₱${orderDetails.newTotalAmount.toFixed(2)}
Delivery Fee: ₱${orderDetails.deliveryFee.toFixed(2)}
New Total Amount: ₱${orderDetails.newFinalAmount.toFixed(2)}

You save: ₱${(orderDetails.originalAmount - orderDetails.newTotalAmount).toFixed(2)}

DELIVERY ADDRESS:
${orderDetails.deliveryAddress}

Estimated Delivery: ${estimatedDeliveryDate}

WHAT HAPPENS NEXT?
- Your order is being prepared with the available items
- You'll only pay for the confirmed products
- Track your order status in your account
- Contact the seller if you have questions

View your order: ${process.env.NEXT_PUBLIC_APP_URL || 'https://harvesthubph.app'}/buyer-orders

We apologize for any inconvenience. Thank you for your understanding!

Questions? Contact us at support@harvesthubph.app
© 2025 HarvestHub. All rights reserved.
  `;

  await sendEmail({
    to,
    subject: `⚠️ Order Modified - Some Items Removed - #${orderDetails.orderNumber}`,
    html,
    text,
  });
}

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOrderConfirmationEmail,
  sendOrderModificationEmail,
};
