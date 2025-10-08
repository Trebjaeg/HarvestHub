import type { NextApiRequest, NextApiResponse } from 'next';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    await dbConnect();
    const user = await User.findOne({ email });
    res.status(200).json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}
