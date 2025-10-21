import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth-api';

async function handler(req: NextRequest, user: AuthenticatedUser): Promise<NextResponse> {
  try {
    const topFarmers = [
      { id: '1', name: 'Esther Howard', avatar: '/images/FarmerPFP.png', rating: 4.9 },
      { id: '2', name: 'Marvin McKinney', avatar: '/images/FarmerPFP.png', rating: 4.7 },
      { id: '3', name: 'Theresa Webb', avatar: '/images/FarmerPFP.png', rating: 4.6 },
      { id: '4', name: 'Arlene McCoy', avatar: '/images/FarmerPFP.png', rating: 4.6 },
      { id: '5', name: 'Floyd Miles', avatar: '/images/FarmerPFP.png', rating: 4.2 }
    ];

    return NextResponse.json(topFarmers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch farmers' }, { status: 500 });
  }
}

export const GET = withAuth(handler);