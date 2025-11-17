// Script to seed the initial HARVESTHUBDEFENDED voucher
// Run this with: node --require ts-node/register scripts/seed-voucher.ts

import mongoose from 'mongoose';
import Voucher from '../models/Voucher';

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-uri';

async function seedVoucher() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if voucher already exists
    const existing = await Voucher.findOne({ code: 'HARVESTHUBDEFENDED' });
    if (existing) {
      console.log('Voucher HARVESTHUBDEFENDED already exists');
      process.exit(0);
    }

    // Create the voucher
    const voucher = new Voucher({
      code: 'HARVESTHUBDEFENDED',
      description: 'Free delivery for new users',
      type: 'free_delivery',
      value: 0,
      minimumPurchase: 0,
      maxUsage: 0, // Unlimited
      maxUsagePerUser: 1, // One time per user
      validFrom: new Date('2025-01-01'),
      validUntil: new Date('2025-12-31'),
      forNewUsersOnly: true,
      isActive: true,
      currentUsage: 0,
      usedBy: []
    });

    await voucher.save();
    console.log('✅ Voucher HARVESTHUBDEFENDED created successfully!');
    console.log('Details:', {
      code: voucher.code,
      description: voucher.description,
      type: voucher.type,
      forNewUsersOnly: voucher.forNewUsersOnly,
      validFrom: voucher.validFrom,
      validUntil: voucher.validUntil
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding voucher:', error);
    process.exit(1);
  }
}

seedVoucher();
