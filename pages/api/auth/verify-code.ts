import type { NextApiRequest, NextApiResponse } from 'next';
import { getClientIP, applySecurityHeaders, sanitizeInput } from '@/lib/security';
import { verifyCode } from './send-verification-code';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[VERIFY_CODE] API called', req.method, req.body);
  
  // Apply security headers
  applySecurityHeaders(res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  let { email, code } = req.body;
  
  // Input validation and sanitization
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  // Sanitize inputs
  email = sanitizeInput(email).toLowerCase();
  code = sanitizeInput(code);

  console.log('[VERIFY_CODE] Verifying:', { email, code, codeLength: code.length });

  try {
    const verification = await verifyCode(email, code);
    
    console.log('[VERIFY_CODE] Verification result:', verification);
    
    if (verification.valid) {
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You can now complete your registration.',
        verified: true
      });
    } else {
      return res.status(400).json({
        success: false,
        message: verification.message || 'Invalid verification code',
        verified: false
      });
    }

  } catch (error: any) {
    console.error('[VERIFY_CODE] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}