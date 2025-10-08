import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[REGISTER] API called', req.method, req.body);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    console.log('[REGISTER] Missing fields', { name, email, password });
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await dbConnect();
    console.log('[REGISTER] Connected to DB');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('[REGISTER] Email already in use:', email);
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    console.log('[REGISTER] User created:', user._id);

    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    return res.status(500).json({ message: 'Internal server error', error: String(err) });
  }
}
