import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { withLogging } from '@/lib/middleware';

async function listSellersHandler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get all users with seller or farmer role
    const sellers = await User.find({ 
      role: { $in: ['seller', 'farmer'] },
      accountStatus: 'active'
    })
      .select('_id firstName lastName email role verified createdAt')
      .limit(20)
      .lean();

    const formattedSellers = sellers.map((seller: any) => ({
      id: seller._id.toString(),
      name: `${seller.firstName} ${seller.lastName}`,
      email: seller.email,
      role: seller.role,
      verified: seller.verified || false,
      memberSince: seller.createdAt
    }));

    return res.status(200).json({
      success: true,
      sellers: formattedSellers,
      total: formattedSellers.length
    });
  } catch (error: any) {
    console.error('List sellers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers'
    });
  }
}

// Public endpoint - no authentication required
export default withLogging(listSellersHandler);
