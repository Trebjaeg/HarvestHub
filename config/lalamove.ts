/**
 * Lalamove Configuration Adapter
 * Supports both SIMULATOR and LIVE modes for realistic integration
 */

// Lalamove Configuration for Philippines
export const LalamoveConfig = {
  // API Configuration
  apiKey: process.env.LALAMOVE_API_KEY || '',
  secretKey: process.env.LALAMOVE_SECRET_KEY || '',
  baseUrl: process.env.LALAMOVE_BASE_URL || 'https://rest.lalamove.com',
  market: process.env.LALAMOVE_MARKET || 'PH',
  
  // Service Mode Configuration
  mode: process.env.LALAMOVE_MODE || 'SIMULATOR', // 'SIMULATOR' or 'LIVE'
  enabled: process.env.LALAMOVE_ENABLED === 'true',
  
  // Service Configuration
  serviceTypeMap: {
    motorcycle: 'MOTORCYCLE',
    car: 'CAR',
    sedan: 'CAR',
    mpv: 'MPV',
    van: 'VAN',
    truck330: 'TRUCK330',
    default: 'MOTORCYCLE'
  } as Record<string, string>,
  
  // Pricing Configuration for Simulator
  simulatorPricing: {
    vehicleBase: {
      MOTORCYCLE: 65,
      CAR: 100,
      MPV: 140,
      VAN: 180,
      TRUCK330: 250
    },
    perKm: {
      MOTORCYCLE: 8,
      CAR: 12,
      MPV: 16,
      VAN: 20,
      TRUCK330: 25
    },
    baseDistanceKm: 3,
    extraStopFee: 30,
    currency: 'PHP'
  },
  
  // Rate Limiting
  rateLimit: {
    quotations: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    },
    orders: {
      windowMs: 60 * 1000, // 1 minute  
      maxRequests: 10
    }
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000
  },

  // Timeout Configuration (in milliseconds)
  timeouts: {
    quotation: 15000,  // 15 seconds
    order: 20000,      // 20 seconds
    webhook: 5000      // 5 seconds
  },

  // Validation
  minStops: 2,
  
  // Coordinate bounds for Philippines
  coordinateBounds: {
    lat: { min: 4, max: 21 },
    lng: { min: 116, max: 127 }
  }
};

export type LalamoveServiceType = keyof typeof LalamoveConfig.serviceTypeMap;

// Service type mappings
export const ServiceTypeMapping = {
  MOTORCYCLE: 'MOTORCYCLE',
  CAR: 'CAR', 
  MPV: 'MPV',
  VAN: 'VAN',
  TRUCK330: 'TRUCK330'
} as const;

// Lalamove-style status enums
export const LalamoveOrderStatus = {
  ASSIGNING_DRIVER: 'ASSIGNING_DRIVER',
  DRIVER_ALLOCATED: 'DRIVER_ALLOCATED', 
  PICKED_UP: 'PICKED_UP',
  ON_GOING: 'ON_GOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type LalamoveOrderStatusType = typeof LalamoveOrderStatus[keyof typeof LalamoveOrderStatus];

// Internal order status mapping
export const OrderStatusMapping = {
  [LalamoveOrderStatus.ASSIGNING_DRIVER]: 'dispatching',
  [LalamoveOrderStatus.DRIVER_ALLOCATED]: 'dispatching', 
  [LalamoveOrderStatus.PICKED_UP]: 'in_transit',
  [LalamoveOrderStatus.ON_GOING]: 'in_transit',
  [LalamoveOrderStatus.COMPLETED]: 'delivered',
  [LalamoveOrderStatus.CANCELLED]: 'cancelled'
};

/**
 * Map internal service type to Lalamove service type
 */
export function mapServiceType(vehicleType: string): string {
  const mapping: Record<string, string> = {
    'MOTORCYCLE': ServiceTypeMapping.MOTORCYCLE,
    'CAR': ServiceTypeMapping.CAR,
    'MPV': ServiceTypeMapping.MPV,
    'VAN': ServiceTypeMapping.VAN,
    'TRUCK330': ServiceTypeMapping.TRUCK330
  };
  
  return mapping[vehicleType] || ServiceTypeMapping.MOTORCYCLE;
}

/**
 * Check if Lalamove integration is enabled and configured
 */
export function isLalamoveConfigured(): boolean {
  return LalamoveConfig.enabled && 
         !!LalamoveConfig.apiKey && 
         !!LalamoveConfig.secretKey;
}

/**
 * Check if we're in simulator mode
 */
export function isSimulatorMode(): boolean {
  return LalamoveConfig.mode === 'SIMULATOR';
}

/**
 * Check if we're in mock/simulator mode (alias for isSimulatorMode)
 */
export function isMockMode(): boolean {
  return isSimulatorMode();
}

/**
 * Check if we're in live mode
 */
export function isLiveMode(): boolean {
  return LalamoveConfig.mode === 'LIVE' && LalamoveConfig.enabled;
}
