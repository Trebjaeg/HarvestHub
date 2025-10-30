import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Appeal from '@/models/Appeal';
import { verifyToken } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(req);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all appeals for this seller
    const appeals = await Appeal.find({ 
      user: authResult.user.id 
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(appeals);
  } catch (error) {
    console.error('Error fetching seller appeals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appeals' },
      { status: 500 }
    );
  }
}
