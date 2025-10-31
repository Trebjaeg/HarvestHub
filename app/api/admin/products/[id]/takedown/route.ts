import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return null;
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    await dbConnect();
    
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized - Admin access required' 
      }, { status: 401 });
    }

    await dbConnect();

    const productId = params.id;

    // Find and deactivate the product
    const product = await Product.findByIdAndUpdate(
      productId,
      { 
        isActive: false,
        takenDownBy: adminUser._id,
        takenDownAt: new Date(),
        takenDownReason: 'Admin takedown due to report'
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ 
        success: false, 
        message: 'Product not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product has been taken down successfully',
      product
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to take down product' 
    }, { status: 500 });
  }
}
