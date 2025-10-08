import { NextResponse } from 'next/server';

export async function GET() {
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