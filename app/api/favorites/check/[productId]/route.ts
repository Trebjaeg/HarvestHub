import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Favorite from '@/models/Favorite';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        success: true, 
        data: { isFavorite: false, favoriteId: null }
      });
    }

    const userId = authResult.user.id;
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product is favorited
    const favorite = await Favorite.findOne({
      buyerId: userId,
      productId: productId,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite?._id || null
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}