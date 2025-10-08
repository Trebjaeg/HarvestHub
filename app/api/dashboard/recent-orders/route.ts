import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const recentOrders = [
      { orderId: '1001', buyer: 'Cameron Williamson', product: '5 kg Mangoes', status: 'Pending' },
      { orderId: '1002', buyer: 'Leslie Alexander', product: '10 kg Tomatoes', status: 'Shipped' },
      { orderId: '1003', buyer: 'Jenny Wilson', product: '14 kg Banana', status: 'Delivered' },
      { orderId: '1004', buyer: 'Robert Fox', product: '6 kg Onions', status: 'Delivered' },
      { orderId: '1005', buyer: 'Jacob Jones', product: '25 kg Apple', status: 'Shipped' },
      { orderId: '1006', buyer: 'Jane Cooper', product: '17 kg Grapes', status: 'Pending' }
    ];

    return NextResponse.json(recentOrders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}