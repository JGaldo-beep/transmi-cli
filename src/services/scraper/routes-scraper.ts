// Routes scraper using Transmilenio API

import { ScrapingError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';
import type {
  ApiParadero,
  ApiRoute,
  ApiRoutesResponse,
  Route,
  RouteDetails,
} from '@models/route.js';
import { ApiRoutesResponseSchema } from '@schemas/route.schema.js';
import { cacheManager } from '@services/cache/index.js';

const API_BASE_URL = 'https://ms-transmiapp-rm2xahnybq-uk.a.run.app/api/v1';

/**
 * Convert API route to internal Route type
 */
function apiRouteToRoute(apiRoute: ApiRoute): Route {
  return {
    id: apiRoute.id.toString(),
    code: apiRoute.codigo,
    name: apiRoute.nombre,
    type: apiRoute.tipo,
    color: apiRoute.color,
    status: 'active', // API doesn't provide status, assume active
    troncal: apiRoute.troncal
      ? {
          id: apiRoute.troncal.id,
          name: apiRoute.troncal.nombre,
          zone: apiRoute.troncal.zona,
          color: apiRoute.troncal.color,
        }
      : undefined,
  };
}

/**
 * Convert API route to RouteDetails type
 */
function apiRouteToRouteDetails(apiRoute: ApiRoute): RouteDetails {
  return {
    ...apiRouteToRoute(apiRoute),
    horarios: apiRoute.horarios.map((h) => ({
      dayType: h.tipoDia,
      start: h.inicio,
      end: h.fin,
    })),
    informacion: apiRoute.informacion
      ? {
          plegable: apiRoute.informacion.plegable || undefined,
          esquema: apiRoute.informacion.esquema || undefined,
          tabla: apiRoute.informacion.tabla || undefined,
          mapa: apiRoute.informacion.mapa || undefined,
        }
      : undefined,
  };
}

/**
 * Fetch routes from Transmilenio API
 */
export async function scrapeRoutes(): Promise<Route[]> {
  const cacheKey = 'routes_all';

  // Check cache first
  const cached = await cacheManager.get<Route[]>(cacheKey);
  if (cached) {
    logger.info('Using cached routes data');
    return cached;
  }

  logger.info('Fetching routes from Transmilenio API...');

  try {
    const allRoutes: Route[] = [];
    let page = 0;
    let totalPages = 1;

    // Fetch all pages
    while (page < totalPages) {
      const response = await fetch(
        `${API_BASE_URL}/rutas/buscar?page=${page}&size=50&sort=idCodigo%2Casc`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response with Zod
      const validated = ApiRoutesResponseSchema.parse(data);

      // Convert API routes to internal Route type
      const routes = validated.content.map(apiRouteToRoute);
      allRoutes.push(...routes);

      totalPages = validated.totalPages;
      page++;

      logger.debug(`Fetched page ${page}/${totalPages} (${routes.length} routes)`);
    }

    // Cache the results
    await cacheManager.set(cacheKey, allRoutes);

    logger.success(`Fetched ${allRoutes.length} routes from API`);
    return allRoutes;
  } catch (error) {
    logger.error('Failed to fetch routes from API:', error);
    throw new ScrapingError(
      'ROUTES_FETCH_FAILED',
      'Failed to fetch routes from Transmilenio API',
      error
    );
  }
}

/**
 * Search routes by query (name, code, or destination)
 */
export async function searchRoutes(query: string, type?: string): Promise<Route[]> {
  const allRoutes = await scrapeRoutes();

  if (!query && !type) {
    return allRoutes;
  }

  const lowerQuery = query.toLowerCase();

  return allRoutes.filter((route) => {
    const matchesQuery =
      !query ||
      route.code.toLowerCase().includes(lowerQuery) ||
      route.name.toLowerCase().includes(lowerQuery);

    const matchesType = !type || route.type === type;

    return matchesQuery && matchesType;
  });
}

/**
 * Get paraderos (stations) for a specific route
 */
async function getRouteParaderos(routeId: number, routeCode: string): Promise<string[]> {
  const cacheKey = `route_paraderos_${routeCode}`;

  // Check cache first
  const cached = await cacheManager.get<string[]>(cacheKey);
  if (cached) {
    logger.info(`Using cached paraderos for ${routeCode}`);
    return cached;
  }

  logger.info(`Fetching paraderos for route ${routeCode}...`);

  try {
    const response = await fetch(`${API_BASE_URL}/rutas/${routeId}/${routeCode}/paraderos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate that we got an array
    if (!Array.isArray(data)) {
      throw new Error('Expected array of paraderos');
    }

    // Extract station names in order
    const stations = (data as ApiParadero[])
      .sort((a, b) => a.posicion - b.posicion)
      .map((paradero) => paradero.nombre);

    // Cache the results
    await cacheManager.set(cacheKey, stations);

    logger.success(`Fetched ${stations.length} paraderos for route ${routeCode}`);
    return stations;
  } catch (error) {
    logger.error(`Failed to get paraderos for route ${routeCode}:`, error);
    // Return empty array instead of throwing to allow partial data
    return [];
  }
}

/**
 * Get route details by ID or code
 */
export async function getRouteDetails(routeIdOrCode: string): Promise<RouteDetails | null> {
  const cacheKey = `route_details_${routeIdOrCode}`;

  // Check cache first
  const cached = await cacheManager.get<RouteDetails>(cacheKey);
  if (cached) {
    logger.info(`Using cached route details for ${routeIdOrCode}`);
    return cached;
  }

  logger.info(`Fetching route details for ${routeIdOrCode}...`);

  try {
    // Get all routes first (from cache if available)
    const allRoutes = await scrapeRoutes();

    // Find the route by ID or code
    const route = allRoutes.find(
      (r) => r.id === routeIdOrCode || r.code.toLowerCase() === routeIdOrCode.toLowerCase()
    );

    if (!route) {
      logger.warn(`Route not found: ${routeIdOrCode}`);
      return null;
    }

    // Fetch route information with details
    const response = await fetch(`${API_BASE_URL}/rutas/${route.id}/${route.code}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const apiRoute = (await response.json()) as ApiRoute;

    // Convert to RouteDetails
    const details = apiRouteToRouteDetails(apiRoute);

    // Fetch paraderos (stations) for this route
    const stations = await getRouteParaderos(apiRoute.id, apiRoute.codigo);
    details.stations = stations;

    // Estimate duration based on number of stations (rough estimate: 2 min per station)
    if (stations.length > 0) {
      details.estimatedDuration = Math.max(10, stations.length * 2);
    }

    // Cache the results
    await cacheManager.set(cacheKey, details);

    return details;
  } catch (error) {
    logger.error(`Failed to get route details for ${routeIdOrCode}:`, error);
    throw new ScrapingError(
      'ROUTE_DETAILS_FAILED',
      `Failed to get route details for ${routeIdOrCode}`,
      error
    );
  }
}
