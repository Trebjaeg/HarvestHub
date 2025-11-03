/**
 * Philippines Major Cities/Municipalities Coordinates Database
 * For Lalamove delivery fee calculation
 */

interface CityCoordinates {
  lat: number;
  lng: number;
  province: string;
}

// Major cities in Metro Manila
const metroManila: Record<string, CityCoordinates> = {
  'Manila': { lat: 14.5995, lng: 120.9842, province: 'Metro Manila' },
  'Quezon City': { lat: 14.6760, lng: 121.0437, province: 'Metro Manila' },
  'Makati': { lat: 14.5547, lng: 121.0244, province: 'Metro Manila' },
  'Pasig': { lat: 14.5764, lng: 121.0851, province: 'Metro Manila' },
  'Taguig': { lat: 14.5176, lng: 121.0509, province: 'Metro Manila' },
  'Mandaluyong': { lat: 14.5794, lng: 121.0359, province: 'Metro Manila' },
  'Pasay': { lat: 14.5378, lng: 121.0014, province: 'Metro Manila' },
  'Caloocan': { lat: 14.6488, lng: 120.9830, province: 'Metro Manila' },
  'Las Piñas': { lat: 14.4378, lng: 120.9822, province: 'Metro Manila' },
  'Muntinlupa': { lat: 14.4083, lng: 121.0390, province: 'Metro Manila' },
  'Parañaque': { lat: 14.4793, lng: 121.0198, province: 'Metro Manila' },
  'Valenzuela': { lat: 14.7006, lng: 120.9830, province: 'Metro Manila' },
  'Malabon': { lat: 14.6625, lng: 120.9559, province: 'Metro Manila' },
  'Navotas': { lat: 14.6686, lng: 120.9406, province: 'Metro Manila' },
  'San Juan': { lat: 14.6019, lng: 121.0355, province: 'Metro Manila' },
  'Marikina': { lat: 14.6507, lng: 121.1029, province: 'Metro Manila' },
  'Pateros': { lat: 14.5433, lng: 121.0657, province: 'Metro Manila' },
};

// Major cities in nearby provinces
const nearbyProvinces: Record<string, CityCoordinates> = {
  // Rizal
  'Antipolo': { lat: 14.5863, lng: 121.1758, province: 'Rizal' },
  'Cainta': { lat: 14.5789, lng: 121.1222, province: 'Rizal' },
  'Taytay': { lat: 14.5591, lng: 121.1324, province: 'Rizal' },
  
  // Cavite
  'Bacoor': { lat: 14.4599, lng: 120.9447, province: 'Cavite' },
  'Imus': { lat: 14.4297, lng: 120.9367, province: 'Cavite' },
  'Dasmariñas': { lat: 14.3294, lng: 120.9367, province: 'Cavite' },
  'Cavite City': { lat: 14.4791, lng: 120.8964, province: 'Cavite' },
  
  // Laguna
  'Santa Rosa': { lat: 14.3123, lng: 121.1114, province: 'Laguna' },
  'Biñan': { lat: 14.3370, lng: 121.0804, province: 'Laguna' },
  'Calamba': { lat: 14.2117, lng: 121.1653, province: 'Laguna' },
  'San Pedro': { lat: 14.3553, lng: 121.0164, province: 'Laguna' },
  
  // Bulacan
  'Malolos': { lat: 14.8433, lng: 120.8114, province: 'Bulacan' },
  'Meycauayan': { lat: 14.7352, lng: 120.9577, province: 'Bulacan' },
  'San Jose del Monte': { lat: 14.8138, lng: 121.0453, province: 'Bulacan' },
  'Santa Maria': { lat: 14.8167, lng: 120.9500, province: 'Bulacan' },
  
  // Pampanga
  'Angeles City': { lat: 15.1450, lng: 120.5887, province: 'Pampanga' },
  'San Fernando': { lat: 15.0285, lng: 120.6897, province: 'Pampanga' },
  'Mabalacat': { lat: 15.2167, lng: 120.5714, province: 'Pampanga' },
};

const allCities = { ...metroManila, ...nearbyProvinces };

/**
 * Get coordinates for a city/municipality
 * Returns approximate center coordinates
 */
export function getCityCoordinates(city: string): CityCoordinates | null {
  // Try exact match first
  const exactMatch = allCities[city];
  if (exactMatch) return exactMatch;
  
  // Try case-insensitive match
  const cityLower = city.toLowerCase();
  const matchedKey = Object.keys(allCities).find(
    key => key.toLowerCase() === cityLower
  );
  
  return matchedKey ? allCities[matchedKey] : null;
}

/**
 * Get all available cities for a province
 */
export function getCitiesByProvince(province: string): string[] {
  return Object.entries(allCities)
    .filter(([_, data]) => data.province === province)
    .map(([city, _]) => city);
}

/**
 * Get list of all provinces
 */
export function getAllProvinces(): string[] {
  const provinces = new Set<string>();
  Object.values(allCities).forEach(city => provinces.add(city.province));
  return Array.from(provinces).sort();
}

/**
 * Get all cities (for autocomplete)
 */
export function getAllCities(): string[] {
  return Object.keys(allCities).sort();
}

/**
 * Estimate coordinates based on province if city not found
 * Returns Metro Manila center as fallback
 */
export function estimateCoordinates(city: string, province: string): { lat: number; lng: number } {
  // Try to get exact city coordinates
  const cityCoords = getCityCoordinates(city);
  if (cityCoords) {
    return { lat: cityCoords.lat, lng: cityCoords.lng };
  }
  
  // Try to get any city from the same province as approximation
  const provinceCities = getCitiesByProvince(province);
  if (provinceCities.length > 0) {
    const firstCity = provinceCities[0];
    const coords = allCities[firstCity];
    return { lat: coords.lat, lng: coords.lng };
  }
  
  // Fallback to Manila center
  return { lat: 14.5995, lng: 120.9842 };
}

export default {
  getCityCoordinates,
  getCitiesByProvince,
  getAllProvinces,
  getAllCities,
  estimateCoordinates,
};
