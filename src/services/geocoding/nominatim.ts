// Geocoding service using Nominatim (OpenStreetMap)

import { logger } from '@lib/logger.js';
import { cacheManager } from '@services/cache/index.js';
import type { Coordinates, GeocodingResult } from '@types/geocoding.js';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'transmilenio-cli/1.0.0';

/**
 * Geocode an address to coordinates using Nominatim
 */
export async function geocode(address: string): Promise<GeocodingResult | null> {
  const cacheKey = `geocode_${address.toLowerCase().replace(/\s+/g, '_')}`;

  // Check cache first
  const cached = await cacheManager.get<GeocodingResult>(cacheKey);
  if (cached) {
    logger.info(`Using cached geocoding for: ${address}`);
    return cached;
  }

  logger.info(`Geocoding address: ${address}`);

  try {
    // Add "Bogotá, Colombia" to improve accuracy
    const searchQuery = address.includes('Bogotá')
      ? address
      : `${address}, Bogotá, Colombia`;

    const url = `${NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      logger.warn(`No geocoding results for: ${address}`);
      return null;
    }

    const result: GeocodingResult = {
      address,
      coordinates: {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      },
      displayName: data[0].display_name,
    };

    // Cache the result
    await cacheManager.set(cacheKey, result, 60 * 24 * 30); // 30 days

    logger.success(`Geocoded "${address}" to (${result.coordinates.lat}, ${result.coordinates.lon})`);
    return result;
  } catch (error) {
    logger.error(`Failed to geocode address "${address}":`, error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Estimate walking time based on distance
 * Assumes average walking speed of 5 km/h (83.3 m/min)
 */
export function estimateWalkingTime(distanceMeters: number): number {
  const walkingSpeedMetersPerMin = 83.3;
  return Math.ceil(distanceMeters / walkingSpeedMetersPerMin);
}
