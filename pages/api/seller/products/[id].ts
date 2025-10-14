import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import User from '@/models/User';
import { deleteFromSpaces } from '../../../../lib/digitalocean-spaces';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Get product
    const product = await Product.findOne({
      _id: params.id,
      farmerId: decoded.userId
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const body = await request.json();
    const {
      name,
      description,
      price,
      category,
      status,
      unit,
      stock,
      images,
      harvestDate
    } = body;

    // Find and update product
    const product = await Product.findOneAndUpdate(
      {
        _id: params.id,
        farmerId: decoded.userId
      },
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(status && { status }),
        ...(unit && { unit }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(images && { 
          image: images[0],
          images 
        }),
        ...(harvestDate && { harvestDate: new Date(harvestDate) }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Get token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    // Find product first to get image URLs before deletion
    const product = await Product.findOne({
      _id: params.id,
      farmerId: decoded.userId
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Collect all image URLs to delete from Spaces
    const imagesToDelete: string[] = [];
    
    if (product.image && product.image !== '/images/products/default.png') {
      imagesToDelete.push(product.image);
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl: string) => {
        if (imageUrl && imageUrl !== '/images/products/default.png' && !imagesToDelete.includes(imageUrl)) {
          imagesToDelete.push(imageUrl);
        }
      });
    }

    // Delete product from database
    await Product.findByIdAndDelete(params.id);

    // Delete images from DigitalOcean Spaces
    for (const imageUrl of imagesToDelete) {
      try {
        await deleteFromSpaces(imageUrl);
      } catch (error) {
        console.error('Error deleting image from Spaces:', error);
        // Continue with other deletions even if one fails
      }
    }

    return NextResponse.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}