import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    const searchTerm = q.trim();
    const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search

    // Search products by name
    const products = await Product.find({
      isActive: true,
      name: { $regex: regex }
    })
      .select('name')
      .limit(5)
      .lean()
      .maxTimeMS(3000); // 3 second timeout

    // Search sellers/farmers by name
    const sellers = await User.find({
      role: 'seller',
      $or: [
        { name: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } }
      ]
    })
      .select('name firstName lastName')
      .limit(5)
      .lean()
      .maxTimeMS(3000); // 3 second timeout

    // Format suggestions
    const productSuggestions = products.map(p => ({
      type: 'product' as const,
      name: p.name,
      id: p._id.toString()
    }));

    const sellerSuggestions = sellers.map(s => ({
      type: 'seller' as const,
      name: s.name || `${s.firstName} ${s.lastName}`.trim(),
      id: s._id.toString()
    }));

    // Combine and limit total suggestions
    const allSuggestions = [...productSuggestions, ...sellerSuggestions].slice(0, 8);

    return res.status(200).json({
      success: true,
      suggestions: allSuggestions
    });

  } catch (error: any) {
    console.error('Search suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
}
