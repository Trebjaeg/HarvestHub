import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Favorite from '@/models/Favorite';
import { verifyToken } from '@/lib/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { productId } = params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Find and remove the favorite
    const favorite = await Favorite.findOneAndDelete({
      buyerId: userId,
      productId: productId
    });

    if (!favorite) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product removed from favorites'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}