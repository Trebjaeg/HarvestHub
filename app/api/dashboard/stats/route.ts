import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth-api';

async function handler(req: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    // Replace with your actual database queries
    const stats = {
      totalProducts: 18,
      pendingOrders: 5,
      orderShipped: 15,
      lowStockProducts: 3
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

export const GET = withAuth(handler);