// Example of how to use the new security middleware
// This is an enhanced version of your check-email API

import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withSecurity, withLogging } from '@/lib/middleware';
import { DatabaseUtils, QueryProfiler } from '@/lib/database-utils';
import { sanitizeInput } from '@/lib/security';

async function checkEmailHandler(req: NextApiRequest, res: NextApiResponse) {
  let { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Sanitize input
  email = sanitizeInput(email).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    await dbConnect();

    const existingUser = await QueryProfiler.profile('email_exists_check', async () => {
      return await DatabaseUtils.findOneWithRetry(User, { email }, { _id: 1 });
    });

    return res.status(200).json({ 
      exists: !!existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });

  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Apply security middleware with rate limiting and logging
export default withSecurity(
  withLogging(checkEmailHandler),
  {
    rateLimit: 'general',
    allowedMethods: ['POST'],
    cors: true
  }
);