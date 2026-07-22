// Alerts scraper for Transmilenio service alerts and operational changes

import { TRANSMILENIO_URLS } from '@config/urls.js';
import { ScrapingError } from '@lib/errors.js';
import { logger } from '@lib/logger.js';
import { cacheManager } from '@services/cache/index.js';

export interface Alert {
  id: string;
  title: string;
  description: string;
  route?: string;
  active: boolean;
  startDate: string;
  endDate?: string;
  type: 'closure' | 'delay' | 'route_change' | 'service_info';
}

/**
 * Scrape active alerts from Transmilenio website
 */
export async function scrapeAlerts(): Promise<Alert[]> {
  const cacheKey = 'alerts_active';

  // Check cache first (short TTL for alerts - 15 minutes)
  const cached = await cacheManager.get<Alert[]>(cacheKey);
  if (cached) {
    logger.info('Using cached alerts data');
    return cached;
  }

  logger.info('Scraping alerts from Transmilenio website...');

  try {
    // Mock alerts data for now
    // In real implementation, scrape from TRANSMILENIO_URLS.alerts
    const alerts: Alert[] = [
      {
        id: '1',
        title: 'Cierre estación Av. Jiménez',
        description:
          'La estación Av. Jiménez permanecerá cerrada por obras del Metro de Bogotá hasta el 30 de julio de 2026',
        active: true,
        startDate: '2026-07-15',
        endDate: '2026-07-30',
        type: 'closure',
      },
      {
        id: '2',
        title: 'Nueva ruta TransMiZonal K576-G576',
        description: 'Nueva ruta conecta el sector de Porvenir con el CAN',
        route: 'K576',
        active: true,
        startDate: '2026-07-21',
        type: 'service_info',
      },
      {
        id: '3',
        title: 'Desvíos por evento en Centro',
        description:
          'TransMilenio implementará desvíos durante la celebración del Día de la Independencia',
        active: true,
        startDate: '2026-07-20',
        endDate: '2026-07-20',
        type: 'route_change',
      },
    ];

    // Cache the results (15 minutes TTL)
    await cacheManager.set(cacheKey, alerts, 15);

    logger.success(`Scraped ${alerts.length} alerts`);
    return alerts;
  } catch (error) {
    logger.error('Failed to scrape alerts:', error);
    throw new ScrapingError('ALERTS_SCRAPE_FAILED', 'Failed to scrape alerts from website', error);
  }
}

/**
 * Get alerts filtered by route
 */
export async function getAlertsByRoute(routeCode: string): Promise<Alert[]> {
  const allAlerts = await scrapeAlerts();

  return allAlerts.filter(
    (alert) => !alert.route || alert.route.toLowerCase() === routeCode.toLowerCase()
  );
}

/**
 * Get only active alerts
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  const allAlerts = await scrapeAlerts();
  return allAlerts.filter((alert) => alert.active);
}
