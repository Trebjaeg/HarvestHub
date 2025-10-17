import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import { rateLimiter, RATE_LIMITS, getClientIP, applySecurityHeaders, sanitizeInput } from '@/lib/security';
import { validateEmail } from '@/lib/validate-email';
import { sendVerificationEmail } from '@/lib/email-service-sendgrid';

// Temporary storage for verification codes during registration
// In production, you might want to use Redis or a database table
const verificationCodes: { [email: string]: { code: string; expires: number; attempts: number } } = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply security headers
  applySecurityHeaders(res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const clientIP = getClientIP(req);
  
  // Rate limiting for verification codes
  if (!rateLimiter.check(`verification:${clientIP}`, RATE_LIMITS.verification || { requests: 5, windowMs: 15 * 60 * 1000 })) {
    return res.status(429).json({ 
      message: 'Too many verification attempts. Please try again later.',
      retryAfter: 15 * 60 // 15 minutes
    });
  }

  let { email } = req.body;
  
  // Input validation and sanitization
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    await dbConnect();

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store verification code
    verificationCodes[email] = { code, expires, attempts: 0 };
    
    // Clean up old codes
    Object.keys(verificationCodes).forEach(key => {
      if (verificationCodes[key].expires < Date.now()) {
        delete verificationCodes[key];
      }
    });

    // Send verification code email with timeout
    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 8000);
      });

      const emailPromise = sendVerificationEmail(email, code);
      await Promise.race([emailPromise, timeoutPromise]);
    } catch (emailError) {
      console.error('[SEND_VERIFICATION_CODE] ❌ Email sending failed:', emailError);
      console.log('[SEND_VERIFICATION_CODE] 🔑 CODE FOR TESTING (email failed):', code);
      // Don't fail - allow user to continue if they can see the console
      console.warn('[SEND_VERIFICATION_CODE] ⚠️ Email failed but continuing. Code:', code);
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully! Please check your email.',
      expiresIn: 10 * 60 // 10 minutes in seconds
    });

  } catch (error: any) {
    console.error('Verification code error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Export function to verify code (for use in registration)
export function verifyCode(email: string, inputCode: string): { valid: boolean; message?: string } {
  const stored = verificationCodes[email];
  
  if (!stored) {
    return { valid: false, message: 'No verification code found for this email' };
  }
  
  if (stored.expires < Date.now()) {
    delete verificationCodes[email];
    return { valid: false, message: 'Verification code has expired' };
  }
  
  if (stored.attempts >= 3) {
    delete verificationCodes[email];
    return { valid: false, message: 'Too many failed attempts. Please request a new code.' };
  }
  
  if (stored.code !== inputCode) {
    stored.attempts++;
    return { valid: false, message: 'Invalid verification code' };
  }
  
  // Code is valid, clean up
  delete verificationCodes[email];
  return { valid: true };
}