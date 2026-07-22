// Routes scraper using Transmilenio API

import { ScrapingError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';
import { ApiRoutesResponseSchema } from '@schemas/route.schema.js';
import { cacheManager } from '@services/cache/index.js';
import type { ApiRoute, ApiRoutesResponse, Route, RouteDetails } from '@types/route.js';

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
    // Search for the specific route
    const response = await fetch(
      `${API_BASE_URL}/rutas/buscar?page=0&size=100&sort=idCodigo%2Casc`,
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
    const validated = ApiRoutesResponseSchema.parse(data);

    // Find the route by ID or code
    const apiRoute = validated.content.find(
      (r) =>
        r.id.toString() === routeIdOrCode || r.codigo.toLowerCase() === routeIdOrCode.toLowerCase()
    );

    if (!apiRoute) {
      logger.warn(`Route not found: ${routeIdOrCode}`);
      return null;
    }

    // Convert to RouteDetails
    const details = apiRouteToRouteDetails(apiRoute);

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
