import type { NextApiRequest, NextApiResponse } from 'next';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
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
    
    const user = await User.findOne({ email }).select('_id').exec();
    
    res.status(200).json({ 
      exists: !!user,
      message: user ? 'Email is already registered' : 'Email is available'
    });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ message: 'Server error' });
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
