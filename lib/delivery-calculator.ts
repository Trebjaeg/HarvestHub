interface DeliveryZone {
  provinces: string[];
  baseRate: number;
  vehicleMultipliers: {
    MOTORCYCLE: number;
    CAR: number;
    MPV: number;
  };
}

interface DeliveryOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  estimatedTime: string;
  fee: number;
  breakdown?: {
    base: number;
    distance: number;
    weightSurcharge: number;
    total: number;
  };
  overweight?: boolean;
}

export interface DeliveryCalculation {
  cost: number;
  estimatedDays: number;
  method: 'standard' | 'express';
  distance?: number; // in kilometers
  sellerLocation?: string;
  buyerLocation?: string;
  recommendedVehicle?: string;
  totalWeight?: number;
  weightTier?: string;
  breakdown?: {
    base: number;
    distance: number;
    weightSurcharge: number;
    total: number;
  };
}

// Realistic vehicle configuration based on Lalamove pricing structure
interface VehicleConfig {
  base: number;        // Base fare
  perKm: number;       // Fee per kilometer
  surchargeRate: number; // Additional fee per kg above free weight
  freeWeight: number;  // Weight included in base fare (kg)
  max: number;         // Maximum weight capacity (kg)
  etaPerKm: number;    // Estimated minutes per kilometer
}

const VEHICLE_CONFIG: Record<string, VehicleConfig> = {
  MOTORCYCLE: { 
    base: 30,      // Sobrang baba na (was 50)
    perKm: 1.5,    // Napakamura per km (was 2)
    surchargeRate: 0.3,  // Almost walang weight charge (was 0.5)
    freeWeight: 15,      // 15kg free
    max: 20,
    etaPerKm: 2
  },
  CAR: { 
    base: 50,      // Mas mura (was 70)
    perKm: 2,      // Mas mura per km (was 2.5)
    surchargeRate: 0.2,  // Almost walang charge (was 0.3)
    freeWeight: 30,      // 30kg free
    max: 50,
    etaPerKm: 2.5
  },
  MPV: { 
    base: 70,      // Mas mura (was 90)
    perKm: 2.5,    // Mas mura per km (was 3)
    surchargeRate: 0.1,  // Halos wala (was 0.2)
    freeWeight: 50,      // 50kg free
    max: 100,
    etaPerKm: 3
  },
  TRUCK: { 
    base: 100,     // Mas mura (was 120)
    perKm: 3,      // Mas mura per km (was 4)
    surchargeRate: 0.05, // Halos walang singil sa weight (was 0.1)
    freeWeight: 100,     // 100kg free
    max: 600,
    etaPerKm: 3.5
  }
};

// Minimum fare regardless of distance
const MINIMUM_FARE = 40;  // Sobrang baba na (was 50)

// Distance-based pricing tiers for provincial estimates
const PROVINCIAL_DISTANCE_ESTIMATES: Record<string, number> = {
  // Metro Manila and nearby
  'metro manila': 10,
  'ncr': 10,
  'national capital region': 10,
  'manila': 10,
  'quezon city': 12,
  'makati': 8,
  'taguig': 15,
  'pasig': 18,
  'marikina': 20,
  'mandaluyong': 10,
  'san juan': 9,
  'pasay': 8,
  'caloocan': 15,
  'malabon': 18,
  'navotas': 20,
  'valenzuela': 22,
  'paranaque': 12,
  'las pinas': 18,
  'muntinlupa': 25,
  
  // Near Metro Manila
  'rizal': 30,
  'cavite': 35,
  'antipolo': 28,
  'imus': 30,
  'bacoor': 32,
  'dasmarinas': 40,
  
  // Adjacent provinces
  'laguna': 60,
  'bulacan': 45,
  'batangas': 100,
  'lipa': 95,
  'bataan': 120,
  
  // Central Luzon
  'pampanga': 80,
  'san fernando': 85,
  'zambales': 150,
  'tarlac': 120,
  'nueva ecija': 140,
  'cabanatuan': 135,
  
  // North Luzon
  'pangasinan': 200,
  'dagupan': 210,
  'benguet': 250,
  'baguio': 245,
  'la union': 260,
  'ilocos sur': 400,
  'vigan': 420,
  'ilocos norte': 480,
  'laoag': 490,
  
  // South Luzon / Bicol
  'quezon': 150,
  'lucena': 140,
  'camarines norte': 350,
  'camarines sur': 380,
  'naga': 370,
  'albay': 450,
  'legazpi': 460,
  'sorsogon': 550,
  'marinduque': 200,
  
  // Visayas
  'cebu': 600,
  'mandaue': 605,
  'lapu-lapu': 610,
  'iloilo': 550,
  'bacolod': 520,
  'negros oriental': 580,
  'negros occidental': 510,
  'dumaguete': 590,
  'bohol': 650,
  'tagbilaran': 655,
  'tacloban': 700,
  'ormoc': 720,
  
  // Mindanao
  'davao': 950,
  'cagayan de oro': 850,
  'butuan': 900,
  'iligan': 880,
  'zamboanga': 920,
  'cotabato': 1000,
  'general santos': 1050,
  'koronadal': 1020,
  'kidapawan': 980,
  'malaybalay': 940,
  'surigao': 960
};

// Define delivery zones with realistic Lalamove-based flat rates
const DELIVERY_ZONES: DeliveryZone[] = [
  {
    provinces: ['Metro Manila', 'NCR', 'National Capital Region'],
    baseRate: 99, // Lalamove Metro Manila base rate
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱99
      CAR: 1.52,          // ₱150
      MPV: 2.02           // ₱200
    }
  },
  {
    provinces: ['Rizal', 'Cavite', 'Las Piñas', 'Parañaque'],
    baseRate: 150, // Near Metro Manila
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱150
      CAR: 1.47,          // ₱220
      MPV: 1.87           // ₱280
    }
  },
  {
    provinces: ['Laguna', 'Bulacan', 'Batangas'],
    baseRate: 200, // Adjacent provinces
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱200
      CAR: 1.4,           // ₱280
      MPV: 1.75           // ₱350
    }
  },
  {
    provinces: ['Pampanga', 'Bataan', 'Zambales', 'Tarlac', 'Nueva Ecija'],
    baseRate: 280, // Central Luzon
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱280
      CAR: 1.36,          // ₱380
      MPV: 1.64           // ₱460
    }
  },
  {
    provinces: ['Pangasinan', 'Benguet', 'La Union', 'Ilocos Sur', 'Ilocos Norte'],
    baseRate: 400, // North Luzon
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱400
      CAR: 1.25,          // ₱500
      MPV: 1.5            // ₱600
    }
  },
  {
    provinces: ['Quezon', 'Camarines Norte', 'Camarines Sur', 'Albay', 'Sorsogon', 'Marinduque'],
    baseRate: 450, // South Luzon / Bicol
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱450
      CAR: 1.22,          // ₱550
      MPV: 1.44           // ₱650
    }
  },
  {
    provinces: ['Cebu', 'Bohol', 'Negros Oriental', 'Negros Occidental'],
    baseRate: 500, // Visayas (local rates when available)
    vehicleMultipliers: {
      MOTORCYCLE: 1.0,    // ₱500
      CAR: 1.2,           // ₱600
      MPV: 1.4            // ₱700
    }
  }
];

// Default zone for areas not specifically listed
const DEFAULT_ZONE: DeliveryZone = {
  provinces: [],
  baseRate: 350, // General Philippines rate
  vehicleMultipliers: {
    MOTORCYCLE: 1.0,    // ₱350
    CAR: 1.29,          // ₱450
    MPV: 1.57           // ₱550
  }
};

export const VEHICLE_OPTIONS = [
  {
    type: 'MOTORCYCLE',
    name: 'Motorcycle',
    description: 'Fast delivery for small items (up to 20kg)',
    icon: '🏍️',
    estimatedTime: '30-45 mins'
  },
  {
    type: 'CAR',
    name: 'Car',
    description: 'Comfortable for medium-sized orders (up to 50kg)',
    icon: '🚗',
    estimatedTime: '45-60 mins'
  },
  {
    type: 'MPV',
    name: 'MPV/SUV',
    description: 'Spacious for large orders (up to 100kg)',
    icon: '🚙',
    estimatedTime: '60-75 mins'
  },
  {
    type: 'TRUCK',
    name: 'Light Truck',
    description: 'For bulk orders (up to 600kg)',
    icon: '🚚',
    estimatedTime: '75-90 mins'
  }
];

// Distance-based pricing tiers (more realistic)
const DISTANCE_TIERS = [
  { maxKm: 10, baseCost: 50, name: 'Local' },        // Within city
  { maxKm: 25, baseCost: 75, name: 'Metro' },        // Metro area
  { maxKm: 50, baseCost: 100, name: 'Regional' },    // Within region
  { maxKm: 100, baseCost: 150, name: 'Provincial' }, // Cross-province nearby
  { maxKm: 300, baseCost: 200, name: 'Island' },     // Same island
  { maxKm: Infinity, baseCost: 250, name: 'National' } // Cross-island
];

// Major city coordinates for distance calculation
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Metro Manila
  'manila': { lat: 14.5995, lng: 120.9842 },
  'quezon city': { lat: 14.6760, lng: 121.0437 },
  'makati': { lat: 14.5547, lng: 121.0244 },
  'taguig': { lat: 14.5176, lng: 121.0509 },
  'pasig': { lat: 14.5764, lng: 121.0851 },
  'marikina': { lat: 14.6507, lng: 121.1029 },
  'mandaluyong': { lat: 14.5794, lng: 121.0359 },
  'san juan': { lat: 14.6019, lng: 121.0355 },
  'pasay': { lat: 14.5378, lng: 120.9896 },
  'caloocan': { lat: 14.6488, lng: 120.9668 },
  'malabon': { lat: 14.6640, lng: 120.9568 },
  'navotas': { lat: 14.6691, lng: 120.9496 },
  'valenzuela': { lat: 14.7000, lng: 120.9830 },
  'paranaque': { lat: 14.4793, lng: 121.0198 },
  'las pinas': { lat: 14.4491, lng: 120.9829 },
  'muntinlupa': { lat: 14.3832, lng: 121.0409 },
  
  // Luzon
  'baguio': { lat: 16.4023, lng: 120.5960 },
  'dagupan': { lat: 16.0433, lng: 120.3320 },
  'san fernando': { lat: 15.0291, lng: 120.6897 },
  'cabanatuan': { lat: 15.4858, lng: 120.9658 },
  'bataan': { lat: 14.6417, lng: 120.4681 },
  'subic': { lat: 14.8203, lng: 120.2720 },
  'laoag': { lat: 18.1967, lng: 120.5934 },
  'vigan': { lat: 17.5747, lng: 120.3869 },
  'tuguegarao': { lat: 17.6132, lng: 121.7270 },
  'legazpi': { lat: 13.1391, lng: 123.7436 },
  'naga': { lat: 13.6218, lng: 123.1948 },
  'lucena': { lat: 13.9414, lng: 121.6234 },
  'batangas': { lat: 13.7565, lng: 121.0583 },
  'lipa': { lat: 13.9411, lng: 121.1624 },
  'antipolo': { lat: 14.5873, lng: 121.1759 },
  'imus': { lat: 14.4297, lng: 120.9367 },
  'bacoor': { lat: 14.4593, lng: 120.9467 },
  'dasmarinas': { lat: 14.3294, lng: 120.9367 },
  
  // Visayas
  'cebu': { lat: 10.3157, lng: 123.8854 },
  'mandaue': { lat: 10.3237, lng: 123.9227 },
  'lapu-lapu': { lat: 10.3103, lng: 123.9494 },
  'iloilo': { lat: 10.7202, lng: 122.5621 },
  'bacolod': { lat: 10.6770, lng: 122.9540 },
  'dumaguete': { lat: 9.3067, lng: 123.3061 },
  'tagbilaran': { lat: 9.6496, lng: 123.8664 },
  'tacloban': { lat: 11.2442, lng: 125.0048 },
  'ormoc': { lat: 11.0059, lng: 124.6074 },
  
  // Mindanao
  'davao': { lat: 7.1907, lng: 125.4553 },
  'cagayan de oro': { lat: 8.4542, lng: 124.6319 },
  'butuan': { lat: 8.9470, lng: 125.5406 },
  'iligan': { lat: 8.2280, lng: 124.2452 },
  'zamboanga': { lat: 6.9214, lng: 122.0790 },
  'cotabato': { lat: 7.2231, lng: 124.2452 },
  'general santos': { lat: 6.1164, lng: 125.1716 },
  'koronadal': { lat: 6.5008, lng: 124.8461 },
  'kidapawan': { lat: 7.0108, lng: 125.0881 },
  'malaybalay': { lat: 8.1531, lng: 125.1259 },
  'surigao': { lat: 9.7870, lng: 125.4919 }
};

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get coordinates for a city/location
function getCoordinates(location: string): { lat: number; lng: number } | null {
  const normalizedLocation = location.toLowerCase()
    .replace(/city/g, '')
    .replace(/municipality/g, '')
    .trim();
  
  return CITY_COORDINATES[normalizedLocation] || null;
}

// Calculate cost based on distance
export function calculateCostFromDistance(distance: number): number {
  for (const tier of DISTANCE_TIERS) {
    if (distance <= tier.maxKm) {
      // Add small distance multiplier for more granular pricing
      const distanceMultiplier = Math.max(1, distance / tier.maxKm);
      return Math.round(tier.baseCost * distanceMultiplier);
    }
  }
  return DISTANCE_TIERS[DISTANCE_TIERS.length - 1].baseCost;
}

// Weight limits per vehicle type (in kg)
const VEHICLE_WEIGHT_LIMITS = {
  MOTORCYCLE: 20,
  CAR: 50,
  MPV: 100
};

// Weight-based pricing adjustments
const WEIGHT_PRICE_TIERS = [
  { maxKg: 5, multiplier: 1.0, name: 'Light' },      // 0-5kg: base price
  { maxKg: 10, multiplier: 1.1, name: 'Standard' },   // 5-10kg: +10%
  { maxKg: 20, multiplier: 1.2, name: 'Medium' },     // 10-20kg: +20%
  { maxKg: 50, multiplier: 1.4, name: 'Heavy' },      // 20-50kg: +40%
  { maxKg: 100, multiplier: 1.6, name: 'Very Heavy' }, // 50-100kg: +60%
  { maxKg: Infinity, multiplier: 2.0, name: 'Extra Heavy' } // 100kg+: +100%
];

// Standard weights for common units (in kg)
const UNIT_WEIGHTS: Record<string, number> = {
  'kg': 1.0,
  'kilogram': 1.0,
  'kilograms': 1.0,
  'g': 0.001,
  'gram': 0.001,
  'grams': 0.001,
  'piece': 0.5,
  'pieces': 0.5,
  'pcs': 0.5,
  'bundle': 1.5,
  'bundles': 1.5,
  'bunch': 1.0,
  'bunches': 1.0,
  'pack': 0.8,
  'packs': 0.8,
  'sack': 25.0,
  'sacks': 25.0,
  'bag': 5.0,
  'bags': 5.0,
  'box': 3.0,
  'boxes': 3.0,
  'dozen': 1.2,
};

/**
 * Calculate total weight from order items
 */
function calculateTotalWeight(items: Array<{
  quantity: number;
  unit?: string;
  weight?: number;
}>): number {
  let totalWeight = 0;

  for (const item of items) {
    // If product has explicit weight, use it
    if (item.weight && item.weight > 0) {
      totalWeight += item.quantity * item.weight;
    } else if (item.unit) {
      // Otherwise, estimate based on unit
      const unitLower = item.unit.toLowerCase().trim();
      const unitWeight = UNIT_WEIGHTS[unitLower] || UNIT_WEIGHTS['piece'];
      totalWeight += item.quantity * unitWeight;
    } else {
      // Default to piece weight if no unit specified
      totalWeight += item.quantity * UNIT_WEIGHTS['piece'];
    }
  }

  return totalWeight;
}

/**
 * Determine recommended vehicle based on weight
 */
function getRecommendedVehicle(weight: number): string {
  if (weight <= VEHICLE_CONFIG.MOTORCYCLE.max) {
    return 'MOTORCYCLE';
  } else if (weight <= VEHICLE_CONFIG.CAR.max) {
    return 'CAR';
  } else if (weight <= VEHICLE_CONFIG.MPV.max) {
    return 'MPV';
  } else if (weight <= VEHICLE_CONFIG.TRUCK.max) {
    return 'TRUCK';
  }
  return 'TRUCK'; // Default to largest vehicle
}

/**
 * Get weight-based price multiplier
 */
function getWeightMultiplier(weight: number): { multiplier: number; tier: string } {
  for (const tier of WEIGHT_PRICE_TIERS) {
    if (weight <= tier.maxKg) {
      return { multiplier: tier.multiplier, tier: tier.name };
    }
  }
  return { 
    multiplier: WEIGHT_PRICE_TIERS[WEIGHT_PRICE_TIERS.length - 1].multiplier,
    tier: WEIGHT_PRICE_TIERS[WEIGHT_PRICE_TIERS.length - 1].name
  };
}

/**
 * Estimate distance based on province/city
 */
function estimateDistance(city: string, province: string): number {
  const normalizedCity = (city || '').toLowerCase().trim().replace(/city/g, '').trim();
  const normalizedProvince = (province || '').toLowerCase().trim();
  
  // Try to find exact match for city
  if (normalizedCity && PROVINCIAL_DISTANCE_ESTIMATES[normalizedCity]) {
    return PROVINCIAL_DISTANCE_ESTIMATES[normalizedCity];
  }
  
  // Try province
  if (normalizedProvince && PROVINCIAL_DISTANCE_ESTIMATES[normalizedProvince]) {
    return PROVINCIAL_DISTANCE_ESTIMATES[normalizedProvince];
  }
  
  // Try to calculate using coordinates
  if (city) {
    const cityCoords = getCoordinates(city);
    if (cityCoords) {
      const manilaCoords = CITY_COORDINATES['manila'];
      return calculateDistance(
        manilaCoords.lat, manilaCoords.lng,
        cityCoords.lat, cityCoords.lng
      );
    }
  }
  
  // Default to medium distance
  return 50;
}

/**
 * Compute mock quotation for a vehicle type
 */
function computeMockQuote(
  vehicleType: string,
  distanceKm: number,
  totalWeightKg: number
): {
  total: number;
  overweight: boolean;
  breakdown: {
    base: number;
    distance: number;
    weightSurcharge: number;
    total: number;
  };
} {
  const config = VEHICLE_CONFIG[vehicleType];
  if (!config) {
    throw new Error(`Invalid vehicle type: ${vehicleType}`);
  }

  // Calculate extra weight beyond free allowance
  const extraWeight = Math.max(0, totalWeightKg - config.freeWeight);
  
  // Check if overweight
  const overweight = totalWeightKg > config.max;

  // Calculate components
  const baseFare = config.base;
  const distanceFee = distanceKm * config.perKm;
  const weightSurcharge = extraWeight * config.surchargeRate;

  // Total before minimum fare check
  let total = baseFare + distanceFee + weightSurcharge;

  // Apply minimum fare
  total = Math.max(total, MINIMUM_FARE);

  // Round to nearest 5
  total = Math.round(total / 5) * 5;

  return {
    total,
    overweight,
    breakdown: {
      base: baseFare,
      distance: Math.round(distanceFee),
      weightSurcharge: Math.round(weightSurcharge),
      total
    }
  };
}

/**
 * Calculate estimated time based on distance and vehicle
 */
function calculateETA(distanceKm: number, vehicleType: string): string {
  const config = VEHICLE_CONFIG[vehicleType];
  if (!config) return '30-45 mins';
  
  const baseMinutes = 15; // Preparation and loading time
  const travelMinutes = Math.round(distanceKm * config.etaPerKm);
  const totalMinutes = baseMinutes + travelMinutes;
  
  // Return range
  const minTime = totalMinutes;
  const maxTime = totalMinutes + 15;
  
  if (totalMinutes < 60) {
    return `${minTime}-${maxTime} mins`;
  } else {
    const minHours = Math.floor(minTime / 60);
    const maxHours = Math.floor(maxTime / 60);
    const minMins = minTime % 60;
    const maxMins = maxTime % 60;
    
    if (minHours === maxHours) {
      return `${minHours}h ${minMins}m - ${minHours}h ${maxMins}m`;
    } else {
      return `${minHours}h ${minMins}m - ${maxHours}h ${maxMins}m`;
    }
  }
}

// Simplified delivery calculator with realistic pricing
export async function calculateDelivery(
  items: Array<{
    productId: string;
    quantity: number;
    sellerId?: string;
    farmerId?: string;
    unit?: string;
    weight?: number;
  }>,
  buyerAddress: {
    street: string;
    city: string;
    province: string;
  },
  method: 'standard' | 'express' = 'standard'
): Promise<DeliveryCalculation> {
  try {
    // Calculate total weight of the order
    const totalWeight = calculateTotalWeight(items);
    
    // Get recommended vehicle based on weight
    const recommendedVehicle = getRecommendedVehicle(totalWeight);
    
    // Estimate distance
    const distanceKm = estimateDistance(buyerAddress.city, buyerAddress.province);
    
    // Calculate quote for recommended vehicle
    const quote = computeMockQuote(recommendedVehicle, distanceKm, totalWeight);
    
    // Multiple sellers = multiple deliveries (add 80% of base cost per additional seller)
    const uniqueSellers = new Set(items.map(item => item.sellerId || item.farmerId).filter(Boolean));
    const additionalSellers = Math.max(0, (uniqueSellers.size || 1) - 1);
    const multiSellerSurcharge = additionalSellers * Math.round(VEHICLE_CONFIG[recommendedVehicle].base * 0.8);
    
    // Calculate final cost
    let finalCost = quote.total + multiSellerSurcharge;
    
    // Express delivery surcharge (50% more)
    if (method === 'express') {
      finalCost = Math.round(finalCost * 1.5);
    }
    
    // Round to nearest 5
    finalCost = Math.round(finalCost / 5) * 5;
    
    // Estimate delivery days based on distance
    let estimatedDays = method === 'express' ? 1 : 3;
    if (distanceKm > 100) estimatedDays += 1;
    if (distanceKm > 300) estimatedDays += 1;
    if (distanceKm > 500) estimatedDays += 2;
    if (method === 'express') estimatedDays = Math.max(1, Math.floor(estimatedDays * 0.6));

    return {
      cost: finalCost,
      estimatedDays,
      method,
      distance: Math.round(distanceKm),
      buyerLocation: `${buyerAddress.city}, ${buyerAddress.province}`,
      recommendedVehicle,
      totalWeight: Math.round(totalWeight * 10) / 10,
      breakdown: {
        ...quote.breakdown,
        total: finalCost
      }
    };

  } catch (error) {
    console.error('Error calculating delivery:', error);
    // Fallback calculation
    return {
      cost: method === 'express' ? 150 : 100,
      estimatedDays: method === 'express' ? 2 : 5,
      method
    };
  }
}

/**
 * Calculate delivery fees for all vehicle types based on province and weight
 * @param province - The delivery province
 * @param city - The delivery city
 * @param totalWeight - Total weight of the order in kg
 * @param orderValue - Optional order value for potential discounts
 * @returns Array of delivery options with calculated fees
 */
export function calculateDeliveryFees(
  province: string,
  city?: string,
  totalWeight?: number,
  orderValue?: number
): DeliveryOption[] {
  // Estimate distance
  const distanceKm = estimateDistance(city || province, province);
  const weight = totalWeight || 1; // Default to 1kg if not specified
  
  const recommendedVehicle = getRecommendedVehicle(weight);

  return VEHICLE_OPTIONS.map(vehicle => {
    try {
      // Calculate quote for this vehicle
      const quote = computeMockQuote(vehicle.type, distanceKm, weight);
      
      let fee = quote.total;
      
      // Apply discounts for larger orders
      if (orderValue) {
        if (orderValue >= 2000) {
          fee = Math.round(fee * 0.8); // 20% discount for orders ≥ ₱2000
        } else if (orderValue >= 1000) {
          fee = Math.round(fee * 0.9); // 10% discount for orders ≥ ₱1000
        }
      }
      
      // Update description based on weight and recommendation
      let description = vehicle.description;
      if (quote.overweight) {
        description = `${vehicle.description} ⚠️ Overweight (max ${VEHICLE_CONFIG[vehicle.type].max}kg)`;
      } else if (recommendedVehicle === vehicle.type) {
        description = `${vehicle.description} ⭐ Recommended`;
      }
      
      // Calculate ETA
      const estimatedTime = calculateETA(distanceKm, vehicle.type);

      return {
        type: vehicle.type,
        name: vehicle.name,
        description: description,
        icon: vehicle.icon,
        estimatedTime: estimatedTime,
        fee: fee,
        breakdown: quote.breakdown,
        overweight: quote.overweight
      };
    } catch (error) {
      // Fallback for invalid vehicle type
      return {
        type: vehicle.type,
        name: vehicle.name,
        description: vehicle.description,
        icon: vehicle.icon,
        estimatedTime: vehicle.estimatedTime,
        fee: MINIMUM_FARE
      };
    }
  });
}

/**
 * Get delivery fee for a specific vehicle type, province, and weight
 */
export function getDeliveryFee(
  province: string,
  vehicleType: string,
  city?: string,
  totalWeight?: number,
  orderValue?: number
): number {
  const options = calculateDeliveryFees(province, city, totalWeight, orderValue);
  const option = options.find(opt => opt.type === vehicleType);
  return option?.fee || MINIMUM_FARE;
}

/**
 * Check if delivery is available to a province
 */
export function isDeliveryAvailable(province: string): boolean {
  // Support delivery to all Philippine provinces
  return province.toLowerCase() !== '';
}

/**
 * Get estimated delivery time based on vehicle type, province, and distance
 */
export function getEstimatedDeliveryTime(province: string, vehicleType: string, city?: string): string {
  const distanceKm = estimateDistance(city || province, province);
  return calculateETA(distanceKm, vehicleType);
}

/**
 * Get vehicle configuration details
 */
export function getVehicleConfig(vehicleType: string): VehicleConfig | null {
  return VEHICLE_CONFIG[vehicleType] || null;
}

/**
 * Calculate breakdown for a specific delivery
 */
export function getDeliveryBreakdown(
  province: string,
  city: string,
  vehicleType: string,
  totalWeight: number
): {
  distance: number;
  breakdown: {
    base: number;
    distance: number;
    weightSurcharge: number;
    total: number;
  };
  overweight: boolean;
} {
  const distanceKm = estimateDistance(city, province);
  const quote = computeMockQuote(vehicleType, distanceKm, totalWeight);
  
  return {
    distance: Math.round(distanceKm),
    breakdown: quote.breakdown,
    overweight: quote.overweight
  };
}