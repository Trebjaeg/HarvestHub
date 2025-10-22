import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Deal from '@/models/Deal';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'deals';

    const now = new Date();
    
    // Get the highest priority active deal for promotional banner
    const activeDeal = await Deal.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      showCountdown: true,
      $or: [
        { maxUsage: { $exists: false } },
        { $expr: { $lt: ['$currentUsage', '$maxUsage'] } }
      ]
    })
    .sort({ priority: -1, discountPercentage: -1 })
    .lean();

    if (!activeDeal) {
      return NextResponse.json({
        banner: null,
        timeRemaining: null
      });
    }

    // Calculate time remaining
    const timeDiff = new Date(activeDeal.endDate).getTime() - now.getTime();
    let timeRemaining = null;
    
    if (timeDiff > 0) {
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      timeRemaining = { days, hours, minutes, seconds, expired: false };
    } else {
      timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return NextResponse.json({
      banner: {
        _id: activeDeal._id,
        title: activeDeal.title,
        subtitle: activeDeal.subtitle,
        description: activeDeal.description,
        buttonText: activeDeal.buttonText,
        buttonLink: activeDeal.buttonLink,
        backgroundColor: activeDeal.backgroundColor,
        textColor: activeDeal.textColor,
        discountPercentage: activeDeal.discountPercentage,
        endDate: activeDeal.endDate,
        showCountdown: activeDeal.showCountdown
      },
      timeRemaining
    });

  } catch (error) {
    console.error('Error fetching promotional banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotional banner' },
      { status: 500 }
    );
  }
}