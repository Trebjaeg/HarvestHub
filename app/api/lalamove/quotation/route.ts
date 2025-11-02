import { NextRequest, NextResponse } from 'next/server';
import { createQuotation } from '@/lib/lalamove-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pickupLocation,
      pickupContact,
      dropoffLocation,
      dropoffContact,
      serviceType = 'MOTORCYCLE',
      scheduleAt
    } = body;

    // Validate required fields
    if (!pickupLocation?.lat || !pickupLocation?.lng || !pickupLocation?.address) {
      return NextResponse.json(
        { error: 'Invalid pickup location' },
        { status: 400 }
      );
    }

    if (!dropoffLocation?.lat || !dropoffLocation?.lng || !dropoffLocation?.address) {
      return NextResponse.json(
        { error: 'Invalid dropoff location' },
        { status: 400 }
      );
    }

    if (!pickupContact?.name || !pickupContact?.phone) {
      return NextResponse.json(
        { error: 'Invalid pickup contact' },
        { status: 400 }
      );
    }

    if (!dropoffContact?.name || !dropoffContact?.phone) {
      return NextResponse.json(
        { error: 'Invalid dropoff contact' },
        { status: 400 }
      );
    }

    // Create quotation via Lalamove
    const quotation = await createQuotation(
      pickupLocation,
      pickupContact,
      dropoffLocation,
      dropoffContact,
      serviceType,
      scheduleAt ? new Date(scheduleAt) : undefined
    );

    return NextResponse.json({
      success: true,
      quotationId: quotation.quotationId,
      deliveryFee: quotation.priceBreakdown.total,
      currency: quotation.priceBreakdown.currency,
      expiresAt: quotation.expiresAt,
      distance: quotation.distance,
    });
  } catch (error: any) {
    console.error('Error creating Lalamove quotation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get delivery quotation',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
