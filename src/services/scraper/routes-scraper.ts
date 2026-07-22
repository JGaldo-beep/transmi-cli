// Routes scraper using agent-browser for Transmilenio website

import type { Route, RouteDetails } from '@types/route.js';
import { TRANSMILENIO_URLS } from '@config/urls.js';
import { ScrapingError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';
import { cacheManager } from '@services/cache/index.js';
import { $ } from 'bun';

/**
 * Scrape all routes from Transmilenio website
 */
export async function scrapeRoutes(): Promise<Route[]> {
  const cacheKey = 'routes_all';

  // Check cache first
  const cached = await cacheManager.get<Route[]>(cacheKey);
  if (cached) {
    logger.info('Using cached routes data');
    return cached;
  }

  logger.info('Scraping routes from Transmilenio website...');

  try {
    // Open the routes page
    await $`agent-browser open ${TRANSMILENIO_URLS.routes}`.quiet();
    await $`agent-browser wait --load networkidle`.quiet();

    // Get snapshot to see the page structure
    const snapshot = await $`agent-browser snapshot -i`.text();

    logger.debug('Page snapshot obtained');

    // Extract route data from the page
    // This is a simplified version - in reality, we'd parse the actual HTML structure
    const routes: Route[] = await extractRoutesFromPage();

    // Cache the results
    await cacheManager.set(cacheKey, routes);

    // Close browser
    await $`agent-browser close`.quiet();

    logger.success(`Scraped ${routes.length} routes`);
    return routes;
  } catch (error) {
    logger.error('Failed to scrape routes:', error);
    await $`agent-browser close`.nothrow().quiet();
    throw new ScrapingError(
      'ROUTES_SCRAPE_FAILED',
      'Failed to scrape routes from website',
      error
    );
  }
}

/**
 * Extract routes data from the page
 * TODO: This needs to be implemented based on actual page structure
 */
async function extractRoutesFromPage(): Promise<Route[]> {
  // For now, return mock data
  // In a real implementation, this would use agent-browser eval or snapshot parsing
  logger.warn('Using mock route data - actual scraping not yet implemented');

  return [
    {
      id: '1',
      code: 'B11',
      name: 'Portal Norte - Universidades',
      type: 'troncal',
      status: 'active',
    },
    {
      id: '2',
      code: 'C30',
      name: 'Alameda - Suba',
      type: 'complementario',
      status: 'active',
    },
    {
      id: '3',
      code: 'K86',
      name: 'Portal Eldorado - Calle 100',
      type: 'troncal',
      status: 'active',
    },
    {
      id: '4',
      code: 'A10',
      name: 'Portal Norte - Alimentador',
      type: 'alimentador',
      status: 'active',
    },
  ];
}

/**
 * Search routes by query (name, code, or destination)
 */
export async function searchRoutes(query: string, type?: string): Promise<Route[]> {
  const allRoutes = await scrapeRoutes();

  const lowerQuery = query.toLowerCase();

  return allRoutes.filter((route) => {
    const matchesQuery =
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
    // Find the route first
    const routes = await scrapeRoutes();
    const route = routes.find(
      (r) => r.id === routeIdOrCode || r.code.toLowerCase() === routeIdOrCode.toLowerCase()
    );

    if (!route) {
      return null;
    }

    // Mock route details - in real implementation, scrape from detail page
    const details: RouteDetails = {
      ...route,
      stations: [
        'Portal Norte',
        'Calle 187',
        'Calle 170',
        'Calle 146',
        'Calle 142',
        'Calle 127',
        'Pepe Sierra',
        'Calle 100',
        'Virrey',
        'Av. Chile',
        'Calle 76',
        'Calle 72',
        'Calle 63',
        'Av. 39',
        'Av. Jiménez',
        'Universidades',
      ],
      schedule: {
        weekday: {
          start: '04:30',
          end: '23:00',
          frequency: {
            peak: 3,
            offPeak: 8,
          },
        },
        weekend: {
          start: '05:00',
          end: '22:00',
          frequency: 10,
        },
      },
      distance: 18.5,
      estimatedDuration: 45,
    };

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
