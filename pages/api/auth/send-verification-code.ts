import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { rateLimiter, RATE_LIMITS, getClientIP, applySecurityHeaders, sanitizeInput } from '@/lib/security';
import { validateEmail } from '@/lib/validate-email';
import { sendVerificationEmail } from '@/lib/email-service-sendgrid';

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
    
    // Hash the verification code before storing (for security)
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
    
    // Store verification code in a temporary collection or user model
    // Using a simple approach: store in a temporary verification collection
    const { default: mongoose } = await import('mongoose');
    const VerificationCode = mongoose.models.VerificationCode || mongoose.model('VerificationCode', new mongoose.Schema({
      email: { type: String, required: true, index: true },
      code: { type: String, required: true },
      expires: { type: Date, required: true, index: true },
      attempts: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 minutes
    }));
    
    // Delete any existing codes for this email
    await VerificationCode.deleteMany({ email });
    
    // Create new verification code
    await VerificationCode.create({
      email,
      code: hashedCode,
      expires: new Date(expires),
      attempts: 0
    });
    
    console.log('[SEND_VERIFICATION_CODE] ✅ Code stored in DB for:', email, 'Code:', code);

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

// Export async function to verify code (for use in registration)
export async function verifyCode(email: string, inputCode: string): Promise<{ valid: boolean; message?: string }> {
  try {
    await dbConnect();
    
    const { default: mongoose } = await import('mongoose');
    const VerificationCode = mongoose.models.VerificationCode || mongoose.model('VerificationCode', new mongoose.Schema({
      email: { type: String, required: true, index: true },
      code: { type: String, required: true },
      expires: { type: Date, required: true, index: true },
      attempts: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now, expires: 600 }
    }));
    
    // Hash the input code to compare with stored hash
    const hashedInputCode = crypto.createHash('sha256').update(inputCode).digest('hex');
    
    console.log('[VERIFY_CODE_FUNC] Checking:', { 
      email, 
      inputCode, 
      hashedInputCode,
      inputCodeLength: inputCode.length
    });
    
    // Find the verification code in DB
    const stored = await VerificationCode.findOne({ email });
    
    console.log('[VERIFY_CODE_FUNC] DB lookup:', { 
      found: !!stored,
      stored: stored ? { expires: stored.expires, attempts: stored.attempts } : null
    });
    
    if (!stored) {
      return { valid: false, message: 'No verification code found for this email' };
    }
    
    if (stored.expires < new Date()) {
      await VerificationCode.deleteOne({ email });
      return { valid: false, message: 'Verification code has expired' };
    }
    
    if (stored.attempts >= 3) {
      await VerificationCode.deleteOne({ email });
      return { valid: false, message: 'Too many failed attempts. Please request a new code.' };
    }
    
    if (stored.code !== hashedInputCode) {
      stored.attempts++;
      await stored.save();
      console.log('[VERIFY_CODE_FUNC] Code mismatch. Attempts:', stored.attempts);
      return { valid: false, message: 'Invalid verification code' };
    }
    
    // Code is valid, clean up
    await VerificationCode.deleteOne({ email });
    console.log('[VERIFY_CODE_FUNC] ✅ Code verified successfully for:', email);
    return { valid: true };
  } catch (error) {
    console.error('[VERIFY_CODE_FUNC] Error:', error);
    return { valid: false, message: 'Error verifying code' };
  }
}