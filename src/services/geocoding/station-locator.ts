// Station locator service - find nearest Transmilenio station

import { logger } from '@lib/logger.js';
import { cacheManager } from '@services/cache/index.js';
import { searchRoutes, getRouteDetails } from '@services/scraper/routes-scraper.js';
import type { Coordinates, StationWithDistance } from '@types/geocoding.js';
import { geocode, calculateDistance, estimateWalkingTime } from './nominatim.js';

interface StationCoordinates {
  name: string;
  address: string;
  coordinates: Coordinates;
}

/**
 * Get all unique stations with their coordinates
 * This is cached heavily since stations don't change often
 */
async function getAllStationsWithCoordinates(): Promise<StationCoordinates[]> {
  const cacheKey = 'all_stations_with_coordinates';

  // Check cache first (cached for 7 days)
  const cached = await cacheManager.get<StationCoordinates[]>(cacheKey);
  if (cached) {
    logger.info('Using cached station coordinates');
    return cached;
  }

  logger.info('Building station coordinates database...');

  // Get TransMilenio routes (main network)
  const routes = await searchRoutes('', 'TransMilenio');
  logger.info(`Found ${routes.length} TransMilenio routes`);

  // Get details for first 100 routes to get station data
  const routesToProcess = routes.slice(0, 100);
  const routeDetails = await Promise.all(
    routesToProcess.map((r) => getRouteDetails(r.code))
  );

  const validRoutes = routeDetails.filter((r) => r !== null && r.stations && r.stations.length > 0);
  logger.info(`Processing ${validRoutes.length} routes with station data`);

  // Collect all unique stations
  const stationMap = new Map<string, string>(); // name -> address

  for (const route of validRoutes) {
    if (!route.stations) continue;

    // Get paraderos to get addresses
    try {
      const response = await fetch(
        `https://ms-transmiapp-rm2xahnybq-uk.a.run.app/api/v1/rutas/${route.id}/${route.code}/paraderos`
      );
      if (response.ok) {
        const paraderos = await response.json();
        for (const paradero of paraderos) {
          if (!stationMap.has(paradero.nombre)) {
            stationMap.set(paradero.nombre, paradero.direccion);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to get paraderos for route ${route.code}`);
    }
  }

  logger.info(`Found ${stationMap.size} unique stations`);

  // Geocode each station (this may take a while, but it's cached)
  const stations: StationCoordinates[] = [];
  let processed = 0;

  for (const [name, address] of stationMap.entries()) {
    processed++;
    if (processed % 10 === 0) {
      logger.info(`Geocoding progress: ${processed}/${stationMap.size}`);
    }

    const result = await geocode(`${address}, Bogotá`);
    if (result) {
      stations.push({
        name,
        address,
        coordinates: result.coordinates,
      });
    }

    // Rate limiting: wait 1 second between requests to respect Nominatim's usage policy
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  logger.success(`Geocoded ${stations.length} stations`);

  // Cache for 7 days
  await cacheManager.set(cacheKey, stations, 60 * 24 * 7);

  return stations;
}

/**
 * Find the nearest Transmilenio station to given coordinates
 */
export async function findNearestStation(
  coordinates: Coordinates
): Promise<StationWithDistance | null> {
  const stations = await getAllStationsWithCoordinates();

  if (stations.length === 0) {
    logger.error('No stations available for distance calculation');
    return null;
  }

  let nearest: StationWithDistance | null = null;
  let minDistance = Infinity;

  for (const station of stations) {
    const distance = calculateDistance(coordinates, station.coordinates);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        stationName: station.name,
        stationAddress: station.address,
        coordinates: station.coordinates,
        distanceMeters: Math.round(distance),
        walkingTimeMinutes: estimateWalkingTime(distance),
      };
    }
  }

  if (nearest) {
    logger.info(
      `Nearest station: ${nearest.stationName} (${nearest.distanceMeters}m, ~${nearest.walkingTimeMinutes} min walk)`
    );
  }

  return nearest;
}
