/**
 * Simulator Lalamove Service
 * Provides realistic Lalamove-like functionality for testing and demos
 */

import crypto from 'crypto';
import { LalamoveConfig, LalamoveOrderStatus, ServiceTypeMapping } from '@/config/lalamove';

interface Address {
  lat: number;
  lng: number;
  displayName: string;
  city: string;
  province: string;
  country: string;
}

interface Contact {
  name: string;
  phone: string;
}

interface PriceBreakdown {
  currency: string;
  total: {
    amount: string;
    currency: string;
  };
  base: {
    amount: string;
    currency: string;
  };
  distance: {
    amount: string;
    currency: string;
  };
  extraStops: {
    amount: string;
    currency: string;
  };
}

interface QuotationResponse {
  quotationId: string;
  priceBreakdown: PriceBreakdown;
  distance: {
    value: number;
    unit: string;
  };
  expiresAt: string;
}

interface CreateOrderResponse {
  orderId: string;
  status: string;
  shareLink: string;
  quotationId?: string;
}

// Test riders pool for realistic demo
const TEST_RIDERS = [
  {
    name: 'Juan Dela Cruz',
    phone: '+639171234567',
    plateNumber: 'ABC-1234',
    rating: 4.8,
    vehicleType: 'MOTORCYCLE'
  },
  {
    name: 'Maria Santos',
    phone: '+639281234567', 
    plateNumber: 'XYZ-5678',
    rating: 4.9,
    vehicleType: 'CAR'
  },
  {
    name: 'Pedro Garcia',
    phone: '+639391234567',
    plateNumber: 'DEF-9012',
    rating: 4.7,
    vehicleType: 'MPV'
  }
];

// In-memory storage for demo purposes
const quotations = new Map<string, any>();
const orders = new Map<string, any>();

export class MockLalamoveService {
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate pricing based on distance and vehicle type
   */
  private calculatePricing(distance: number, serviceType: string, extraStops: number = 0): PriceBreakdown {
    const config = LalamoveConfig.simulatorPricing;
    
    const baseFee = config.vehicleBase[serviceType as keyof typeof config.vehicleBase] || config.vehicleBase.MOTORCYCLE;
    const perKmRate = config.perKm[serviceType as keyof typeof config.perKm] || config.perKm.MOTORCYCLE;
    
    // Calculate distance fee (free for first 3km)
    const chargeableDistance = Math.max(0, distance - config.baseDistanceKm);
    const distanceFee = Math.round(chargeableDistance * perKmRate * 100) / 100;
    
    // Extra stops fee
    const extraStopsFee = extraStops * config.extraStopFee;
    
    const totalAmount = baseFee + distanceFee + extraStopsFee;

    return {
      currency: config.currency,
      total: {
        amount: totalAmount.toFixed(2),
        currency: config.currency
      },
      base: {
        amount: baseFee.toFixed(2),
        currency: config.currency
      },
      distance: {
        amount: distanceFee.toFixed(2),
        currency: config.currency
      },
      extraStops: {
        amount: extraStopsFee.toFixed(2),
        currency: config.currency
      }
    };
  }

  /**
   * Generate realistic Lalamove-style IDs
   */
  private generateId(prefix: string = 'LLM'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Create a quotation
   */
  async createQuotation(
    pickupAddress: Address,
    deliveryAddress: Address,
    serviceType: string,
    requesterContact: Contact,
    recipientContact: Contact,
    isCashOnDelivery: boolean = true
  ): Promise<QuotationResponse> {
    
    // Calculate distance
    const distance = this.calculateDistance(
      pickupAddress.lat,
      pickupAddress.lng,
      deliveryAddress.lat,
      deliveryAddress.lng
    );

    // Calculate pricing
    const priceBreakdown = this.calculatePricing(distance, serviceType);

    // Generate quotation ID
    const quotationId = this.generateId('QUO');

    // Set expiration (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store quotation
    const quotationData = {
      quotationId,
      pickupAddress,
      deliveryAddress,
      serviceType,
      requesterContact,
      recipientContact,
      priceBreakdown,
      distance: { value: distance, unit: 'km' },
      expiresAt,
      isCashOnDelivery,
      createdAt: new Date().toISOString()
    };

    quotations.set(quotationId, quotationData);

    return {
      quotationId,
      priceBreakdown,
      distance: { value: Math.round(distance * 100) / 100, unit: 'km' },
      expiresAt
    };
  }

  /**
   * Create an order from a quotation
   */
  async createOrder(quotationId: string, remarks: string = '', metadata: any = {}): Promise<CreateOrderResponse> {
    const quotationData = quotations.get(quotationId);
    
    if (!quotationData) {
      throw new Error('Quotation not found or expired');
    }

    // Check if quotation has expired
    const now = new Date();
    const expiryTime = new Date(quotationData.expiresAt);
    if (now > expiryTime) {
      throw new Error('Quotation has expired');
    }

    // Generate order ID
    const orderId = this.generateId('LLM');

    // Create share link
    const shareLink = `/track/lalamove/${orderId}`;

    // Store order
    const orderData = {
      orderId,
      quotationId,
      status: LalamoveOrderStatus.ASSIGNING_DRIVER,
      serviceType: quotationData.serviceType,
      stops: [
        {
          coordinates: { 
            lat: quotationData.pickupAddress.lat.toString(), 
            lng: quotationData.pickupAddress.lng.toString() 
          },
          address: quotationData.pickupAddress.displayName,
          contact: quotationData.requesterContact
        },
        {
          coordinates: { 
            lat: quotationData.deliveryAddress.lat.toString(), 
            lng: quotationData.deliveryAddress.lng.toString() 
          },
          address: quotationData.deliveryAddress.displayName,
          contact: quotationData.recipientContact
        }
      ],
      price: quotationData.priceBreakdown,
      shareLink,
      remarks,
      metadata,
      rider: null,
      createdAt: new Date().toISOString(),
      driverAssignedAt: null,
      pickedUpAt: null,
      completedAt: null
    };

    orders.set(orderId, orderData);

    return {
      orderId,
      status: LalamoveOrderStatus.ASSIGNING_DRIVER,
      shareLink
    };
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    const orderData = orders.get(orderId);
    
    if (!orderData) {
      throw new Error('Order not found');
    }

    return orderData;
  }

  /**
   * Update order status (for webhook simulation)
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<any> {
    const orderData = orders.get(orderId);
    
    if (!orderData) {
      throw new Error('Order not found');
    }

    // Update status
    orderData.status = newStatus;

    // Auto-assign rider when status changes to DRIVER_ALLOCATED
    if (newStatus === LalamoveOrderStatus.DRIVER_ALLOCATED && !orderData.rider) {
      // Find appropriate rider based on service type
      const availableRiders = TEST_RIDERS.filter(rider => 
        rider.vehicleType === orderData.serviceType || 
        (orderData.serviceType === 'CAR' && rider.vehicleType === 'CAR') ||
        (orderData.serviceType === 'MOTORCYCLE' && rider.vehicleType === 'MOTORCYCLE')
      );
      
      const selectedRider = availableRiders[Math.floor(Math.random() * availableRiders.length)] || TEST_RIDERS[0];
      
      orderData.rider = {
        name: selectedRider.name,
        phone: selectedRider.phone,
        plateNumber: selectedRider.plateNumber,
        rating: selectedRider.rating
      };
      orderData.driverAssignedAt = new Date().toISOString();
    }

    // Set timestamps for status changes
    if (newStatus === LalamoveOrderStatus.PICKED_UP && !orderData.pickedUpAt) {
      orderData.pickedUpAt = new Date().toISOString();
    }
    
    if (newStatus === LalamoveOrderStatus.COMPLETED && !orderData.completedAt) {
      orderData.completedAt = new Date().toISOString();
    }

    orders.set(orderId, orderData);
    
    return orderData;
  }

  /**
   * Get all orders (for admin interface)
   */
  async getAllOrders(): Promise<any[]> {
    return Array.from(orders.values());
  }

  /**
   * Get test riders (for admin interface)
   */
  getTestRiders() {
    return TEST_RIDERS;
  }

  /**
   * Clear all data (for testing)
   */
  clearAll() {
    quotations.clear();
    orders.clear();
  }
}

// Export singleton instance
export const mockLalamoveService = new MockLalamoveService();