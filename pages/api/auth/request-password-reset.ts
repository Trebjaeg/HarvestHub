import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    await dbConnect();
    const user = await User.findOne({ email });
    // Respond with 200 even if user not found to avoid user enumeration
    if (!user) {
      return res.status(200).json({ message: 'If that account exists, a reset link was sent.' });
    }

    // Create a one-time token
    const token = crypto.randomBytes(32).toString('hex');
    // Store a hashed token for verification
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    await user.save();

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.origin || '';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Reset your HarvestHub password',
      html: `
        <p>You requested a password reset. Click the link below to set a new password (valid for 15 minutes):</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    });

    return res.status(200).json({ message: 'If that account exists, a reset link was sent.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
