/**
 * LocationIQ Geocoding Service
 * Forward geocoding with timeout, retry, and minimal caching
 */

export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

const geocodeCache = new Map<string, { result: GeocodedLocation; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Forward geocode address to coordinates
 */
async function forwardGeocode(address: string): Promise<GeocodedLocation | null> {
  const key = process.env.LOCATIONIQ_KEY;
  
  if (!key) {
    throw new Error('LOCATIONIQ_KEY not configured');
  }

  const cacheKey = address.toLowerCase().trim();
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${encodeURIComponent(address)}&format=json&limit=1`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HarvestHub/1.0' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('GEOCODE_NOT_FOUND');
      }
      throw new Error('GEOCODE_HTTP');
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error('GEOCODE_NOT_FOUND');
    }

    const result: GeocodedLocation = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name || address
    };

    geocodeCache.set(cacheKey, { result, timestamp: Date.now() });

    if (geocodeCache.size > 100) {
      const firstKey = geocodeCache.keys().next().value;
      geocodeCache.delete(firstKey);
    }

    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const retryController = new AbortController();
      const retryTimeout = setTimeout(() => retryController.abort(), 1000);

      try {
        const retryRes = await fetch(url, {
          headers: { 'User-Agent': 'HarvestHub/1.0' },
          signal: retryController.signal
        });

        clearTimeout(retryTimeout);

        if (!retryRes.ok) {
          if (retryRes.status === 404) {
            throw new Error('GEOCODE_NOT_FOUND');
          }
          throw new Error('GEOCODE_HTTP');
        }

        const retryData = await retryRes.json();

        if (!retryData || retryData.length === 0) {
          throw new Error('GEOCODE_NOT_FOUND');
        }

        const result: GeocodedLocation = {
          lat: parseFloat(retryData[0].lat),
          lng: parseFloat(retryData[0].lon),
          formattedAddress: retryData[0].display_name || address
        };

        geocodeCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
      } catch (retryError: any) {
        clearTimeout(retryTimeout);
        if (retryError.message === 'GEOCODE_NOT_FOUND' || retryError.message === 'GEOCODE_HTTP') {
          throw retryError;
        }
        throw new Error('GEOCODE_HTTP');
      }
    }

    throw error;
  }
}

/**
 * Get coordinates and formatted address from city/province
 * Falls back gracefully when exact address can't be geocoded
 */
export async function geocodeFromCityProvince(
  city: string,
  province: string,
  street?: string
): Promise<GeocodedLocation> {
  const { estimateCoordinates } = await import('@/lib/ph-coordinates');
  
  const coords = estimateCoordinates(city, province);

  // Try 1: Full address with street
  if (street && street.trim()) {
    const fullAddress = `${street}, ${city}, ${province}, Philippines`;
    
    try {
      const geocoded = await forwardGeocode(fullAddress);
      if (geocoded) {
        return geocoded;
      }
    } catch (error: any) {
      // Ignore and try fallback
    }
  }

  // Try 2: City and province only (more reliable)
  const cityAddress = `${city}, ${province}, Philippines`;
  
  try {
    const geocoded = await forwardGeocode(cityAddress);
    
    if (geocoded) {
      return {
        ...geocoded,
        formattedAddress: street 
          ? `${street}, ${geocoded.formattedAddress}`
          : geocoded.formattedAddress
      };
    }
  } catch (error: any) {
    if (error.message.includes('LOCATIONIQ_KEY')) {
      throw error;
    }
    // Continue to fallback
  }

  // Fallback: Use estimated coordinates
  const fallbackAddress = street 
    ? `${street}, ${city}, ${province}, Philippines`
    : `${city}, ${province}, Philippines`;

  return {
    lat: coords.lat,
    lng: coords.lng,
    formattedAddress: fallbackAddress
  };
}
