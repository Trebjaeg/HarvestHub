import { NextRequest, NextResponse } from 'next/server';
import { isMockMode } from '@/config/lalamove';
import { mockLalamoveService } from '@/services/mock-lalamove';
import { LalamoveOrderStatus, OrderStatusMapping } from '@/config/lalamove';
import { LalamoveRider } from '@/types/lalamove';

// Test riders for simulation
const TEST_RIDERS: LalamoveRider[] = [
  {
    name: 'Juan Dela Cruz',
    phone: '+63 912 345 6789',
    plateNumber: 'ABC1234',
    rating: 4.8
  },
  {
    name: 'Maria Santos',
    phone: '+63 917 654 3210',
    plateNumber: 'XYZ9876',
    rating: 4.9
  },
  {
    name: 'Pedro Rodriguez',
    phone: '+63 920 111 2222',
    plateNumber: 'DEF5678',
    rating: 4.7
  }
];

export async function POST(request: NextRequest) {
  try {
    if (!isMockMode()) {
      return NextResponse.json({
        code: 'NOT_AVAILABLE',
        message: 'Mock webhook simulator is only available in MOCK mode'
      }, { status: 403 });
    }

    const body = await request.json();
    const { lalamoveOrderId, status, customRider } = body;

    if (!lalamoveOrderId || !status) {
      return NextResponse.json({
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'lalamoveOrderId and status are required'
      }, { status: 400 });
    }

    // Validate status
    if (!Object.values(LalamoveOrderStatus).includes(status)) {
      return NextResponse.json({
        code: 'INVALID_STATUS',
        message: `Invalid status. Valid statuses: ${Object.values(LalamoveOrderStatus).join(', ')}`
      }, { status: 400 });
    }

    // Select or use custom rider for DRIVER_ALLOCATED status
    let rider: LalamoveRider | undefined;
    if (status === LalamoveOrderStatus.DRIVER_ALLOCATED) {
      if (customRider) {
        rider = customRider;
      } else {
        // Randomly select a test rider
        rider = TEST_RIDERS[Math.floor(Math.random() * TEST_RIDERS.length)];
      }
    }

    // Update order status in mock service
    const success = await mockLalamoveService.updateOrderStatus(lalamoveOrderId, status, rider);

    if (!success) {
      return NextResponse.json({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found in mock system'
      }, { status: 404 });
    }

    // Get updated order details
    const updatedOrder = await mockLalamoveService.getOrder(lalamoveOrderId);

    // Simulate webhook delay (realistic behavior)
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      message: `Order ${lalamoveOrderId} status updated to ${status}`,
      order: updatedOrder,
      internalStatus: OrderStatusMapping[status as keyof typeof OrderStatusMapping]
    });

  } catch (error: any) {
    return NextResponse.json({
      code: 'WEBHOOK_SIMULATION_ERROR',
      message: error.message || 'Failed to simulate webhook'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isMockMode()) {
      return NextResponse.json({
        code: 'NOT_AVAILABLE',
        message: 'Mock webhook simulator is only available in MOCK mode'
      }, { status: 403 });
    }

    // Return available statuses and test riders for admin interface
    return NextResponse.json({
      availableStatuses: Object.values(LalamoveOrderStatus),
      statusMappings: OrderStatusMapping,
      testRiders: TEST_RIDERS,
      allMockOrders: mockLalamoveService.getAllMockOrders()
    });

  } catch (error: any) {
    return NextResponse.json({
      code: 'WEBHOOK_INFO_ERROR',
      message: error.message || 'Failed to get webhook info'
    }, { status: 500 });
  }
}