/**
 * LocationIQ Geocoding Service
 * Converts addresses to normalized coordinates for Lalamove integration
 */

import { LalamoveConfig } from '@/config/lalamove';
import { NormalizedAddress } from '@/types/lalamove';

interface LocationIQResponse {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export class LocationIQService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = LalamoveConfig.locationiq.apiKey;
    this.baseUrl = LalamoveConfig.locationiq.baseUrl;
    
    if (!this.apiKey) {
      throw new Error('LocationIQ API key not configured');
    }
  }

  /**
   * Geocode an address using LocationIQ
   */
  async geocodeAddress(
    city: string,
    province: string,
    street?: string
  ): Promise<NormalizedAddress> {
    if (!city || !province) {
      throw new Error('City and province are required for geocoding');
    }

    // Build search query
    const addressParts = [street, city, province, 'Philippines'].filter(Boolean);
    const query = addressParts.join(', ');

    const url = new URL(`${this.baseUrl}/search.php`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'ph');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'HarvestHub/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('LocationIQ API key is invalid');
        }
        if (response.status === 429) {
          throw new Error('LocationIQ rate limit exceeded. Please try again later.');
        }
        throw new Error(`LocationIQ API error: ${response.status}`);
      }

      const data: LocationIQResponse[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`Address not found: ${query}. Please check your address and try again.`);
      }

      const result = data[0];
      
      // Validate coordinates are within Philippines bounds
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      const bounds = LalamoveConfig.coordinateBounds;
      if (lat < bounds.lat.min || lat > bounds.lat.max || 
          lng < bounds.lng.min || lng > bounds.lng.max) {
        throw new Error('Address appears to be outside the Philippines delivery area');
      }

      return {
        rawInput: query,
        lat,
        lng,
        displayName: result.display_name,
        houseNumber: result.address.house_number,
        road: result.address.road,
        suburb: result.address.suburb,
        city: result.address.city || result.address.county,
        state: result.address.state,
        postcode: result.address.postcode,
        country: result.address.country
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('LocationIQ geocoding service is temporarily unavailable. Please try again.');
      }
      
      if (error.message.includes('LocationIQ')) {
        throw error;
      }
      
      throw new Error('Failed to process address. Please check your internet connection and try again.');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lng: number): Promise<NormalizedAddress> {
    const url = new URL(`${this.baseUrl}/reverse.php`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'HarvestHub/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LocationIQ reverse geocoding error: ${response.status}`);
      }

      const result: LocationIQResponse = await response.json();

      return {
        rawInput: `${lat}, ${lng}`,
        lat,
        lng,
        displayName: result.display_name,
        houseNumber: result.address.house_number,
        road: result.address.road,
        suburb: result.address.suburb,
        city: result.address.city || result.address.county,
        state: result.address.state,
        postcode: result.address.postcode,
        country: result.address.country
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('LocationIQ geocoding service is temporarily unavailable. Please try again.');
      }
      
      throw new Error('Failed to reverse geocode coordinates');
    }
  }
}

// Singleton instance
export const locationIQService = new LocationIQService();