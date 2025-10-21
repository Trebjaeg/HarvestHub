import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth-api';

async function handler(req: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    const chartData = {
      ordersByStatus: {
        delivered: 65,
        pending: 20,
        canceled: 15
      },
      salesOverTime: [
        { time: '9AM', amount: 2000 },
        { time: '10AM', amount: 2500 },
        { time: '12NN', amount: 3000 },
        { time: '2PM', amount: 2000 },
        { time: '4PM', amount: 2800 },
        { time: '6PM', amount: 4500 },
        { time: '8PM', amount: 2000 }
      ]
    };

    return NextResponse.json(chartData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}

export const GET = withAuth(handler);