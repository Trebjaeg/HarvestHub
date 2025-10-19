import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fallback to cookies (check all possible cookie names)
    if (!token) {
      token = req.cookies['auth-token'] || req.cookies.token || req.cookies.userToken;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId || decoded.id;

    // Get user/seller data
    const seller = await User.findById(userId);
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Mock recent orders for now - replace with actual database queries
    const mockOrders = [
      {
        _id: "1",
        orderId: "ORD-001", 
        buyer: { name: "John Doe", email: "john@example.com" },
        product: { name: "Fresh Tomatoes", price: 150 },
        status: "Pending",
        amount: 150,
        createdAt: new Date().toISOString()
      },
      {
        _id: "2",
        orderId: "ORD-002",
        buyer: { name: "Jane Smith", email: "jane@example.com" },
        product: { name: "Organic Carrots", price: 200 },
        status: "Shipped", 
        amount: 200,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: "3",
        orderId: "ORD-003",
        buyer: { name: "Mike Johnson", email: "mike@example.com" },
        product: { name: "Sweet Corn", price: 300 },
        status: "Delivered",
        amount: 300,
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      orders: mockOrders
    });

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}