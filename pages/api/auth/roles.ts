import type { NextApiRequest, NextApiResponse } from 'next';
import { applySecurityHeaders } from '@/lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply security headers
  applySecurityHeaders(res);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Dynamically return available user roles
    // This allows for easy updates without frontend changes
    const roles = [
      {
        id: 'buyer',
        name: 'Buyer',
        description: 'Browse and purchase products from farmers'
      },
      {
        id: 'seller',
        name: 'Seller',
        description: 'List products, manage inventory, and track sales'
      }
    ];

    return res.status(200).json({ roles });
  } catch (error) {
    console.error('[ROLES API] Error:', error);
    return res.status(500).json({ message: 'Failed to fetch roles' });
  }
}
