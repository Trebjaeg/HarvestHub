import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import Product from '@/models/Product';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Verify user authentication
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, reason, description } = req.body;

    // Validate required fields
    if (!productId || !reason || !description) {
      return res.status(400).json({ 
        message: 'Product ID, reason, and description are required' 
      });
    }

    // Validate description length
    if (description.length > 1000) {
      return res.status(400).json({ 
        message: 'Description must be less than 1000 characters' 
      });
    }

    // Fetch product details
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch reporter details
    const reporter = await User.findById(decoded.userId).lean();
    if (!reporter) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already reported this product
    const existingReport = await Report.findOne({
      productId,
      reportedBy: decoded.userId,
      status: { $in: ['pending', 'investigating'] }
    });

    if (existingReport) {
      return res.status(400).json({ 
        message: 'You have already reported this product. We are reviewing your report.' 
      });
    }

    // Determine priority based on reason
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (reason === 'scam' || reason === 'counterfeit') {
      priority = 'urgent';
    } else if (reason === 'fake_product' || reason === 'misleading_info') {
      priority = 'high';
    } else if (reason === 'poor_quality') {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Create the report
    const report = await Report.create({
      productId,
      productName: product.name,
      productImage: product.image || product.images?.[0],
      reportedBy: decoded.userId,
      reporterName: reporter.name || reporter.email,
      reporterEmail: reporter.email,
      sellerId: product.farmerId,
      sellerName: product.farmerName,
      reason,
      description,
      status: 'pending',
      priority
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      report: {
        _id: report._id,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ 
      message: 'Failed to submit report. Please try again later.' 
    });
  }
}
