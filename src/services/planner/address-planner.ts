// Address-based trip planner - combines geocoding with route planning

import { logger } from '@lib/logger.js';
import { geocode } from '@services/geocoding/nominatim.js';
import { findNearestStation } from '@services/geocoding/station-locator.js';
import { searchRoutes, getRouteDetails } from '@services/scraper/routes-scraper.js';
import { buildGraph, addTransferEdges, findNodeByName } from './graph-builder.js';
import { findShortestPath, pathResultToTripPlan } from './dijkstra.js';
import type { AddressBasedTrip } from '@types/geocoding.js';

/**
 * Plan a trip from one address to another using Transmilenio
 */
export async function planTripFromAddresses(
  originAddress: string,
  destinationAddress: string
): Promise<AddressBasedTrip | null> {
  logger.info(`Planning trip from "${originAddress}" to "${destinationAddress}"`);

  // Step 1: Geocode origin and destination
  logger.info('Step 1: Geocoding addresses...');
  const [originGeo, destGeo] = await Promise.all([
    geocode(originAddress),
    geocode(destinationAddress),
  ]);

  if (!originGeo) {
    logger.error(`Could not geocode origin address: ${originAddress}`);
    return null;
  }

  if (!destGeo) {
    logger.error(`Could not geocode destination address: ${destinationAddress}`);
    return null;
  }

  logger.info(`Origin: ${originGeo.displayName}`);
  logger.info(`Destination: ${destGeo.displayName}`);

  // Step 2: Find nearest stations
  logger.info('Step 2: Finding nearest stations...');
  const [originStation, destStation] = await Promise.all([
    findNearestStation(originGeo.coordinates),
    findNearestStation(destGeo.coordinates),
  ]);

  if (!originStation) {
    logger.error('Could not find nearest station to origin');
    return null;
  }

  if (!destStation) {
    logger.error('Could not find nearest station to destination');
    return null;
  }

  logger.info(
    `Origin station: ${originStation.stationName} (${originStation.distanceMeters}m away)`
  );
  logger.info(
    `Destination station: ${destStation.stationName} (${destStation.distanceMeters}m away)`
  );

  // Step 3: Plan transit route between stations
  logger.info('Step 3: Planning transit route...');

  // Get TransMilenio routes
  const allRoutes = await searchRoutes('', 'TransMilenio');
  const routesToLoad = allRoutes.slice(0, 100);

  const routeDetails = await Promise.all(
    routesToLoad.map((r) => getRouteDetails(r.code))
  );
  const validRoutes = routeDetails.filter((r) => r !== null);

  if (validRoutes.length === 0) {
    logger.error('No routes available for planning');
    return null;
  }

  // Build graph
  const graph = addTransferEdges(buildGraph(validRoutes));

  // Find nodes
  const startNode = findNodeByName(graph, originStation.stationName);
  const endNode = findNodeByName(graph, destStation.stationName);

  if (!startNode) {
    logger.error(`Origin station "${originStation.stationName}" not found in network`);
    return null;
  }

  if (!endNode) {
    logger.error(`Destination station "${destStation.stationName}" not found in network`);
    return null;
  }

  // Find path
  const pathResult = findShortestPath(graph, startNode, endNode);
  const tripPlan = pathResultToTripPlan(
    pathResult,
    graph,
    originStation.stationName,
    destStation.stationName
  );

  // Step 4: Combine everything
  const totalTime =
    originStation.walkingTimeMinutes +
    tripPlan.duration +
    destStation.walkingTimeMinutes;

  const totalDistance =
    originStation.distanceMeters / 1000 +
    tripPlan.distance +
    destStation.distanceMeters / 1000;

  const result: AddressBasedTrip = {
    origin: {
      address: originAddress,
      coordinates: originGeo.coordinates,
      nearestStation: originStation,
    },
    destination: {
      address: destinationAddress,
      coordinates: destGeo.coordinates,
      nearestStation: destStation,
    },
    transitRoute: tripPlan,
    totalTime,
    totalDistance,
  };

  logger.success(
    `Trip planned: ${totalTime} min total (${originStation.walkingTimeMinutes} min walk + ${tripPlan.duration} min transit + ${destStation.walkingTimeMinutes} min walk)`
  );

  return result;
}
