// Google Maps route extractor using agent-browser
// Extracts TransMilenio routes directly from Google Maps

import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@lib/logger.js';

const execAsync = promisify(exec);

export interface GoogleMapsStep {
  time: string;
  location: string;
  mode: 'walk' | 'transit' | 'wait';
  transitDetails?: {
    line: string;
    duration: string;
    stops?: number;
    stopId?: string;
  };
  walkDetails?: {
    duration: string;
    distance: string;
  };
}

export interface GoogleMapsRoute {
  departureTime: string;
  arrivalTime: string;
  duration: string;
  steps: GoogleMapsStep[];
  summary: string;
}

export interface GoogleMapsResult {
  success: boolean;
  origin: string;
  destination: string;
  routes: GoogleMapsRoute[];
  error?: string;
}

/**
 * Extract transit routes from Google Maps using agent-browser
 */
export async function extractGoogleMapsRoutes(
  origin: string,
  destination: string
): Promise<GoogleMapsResult> {
  logger.info(`Extracting routes from Google Maps: ${origin} → ${destination}`);

  // Construct Google Maps URL with transit mode
  const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)},+Bogotá/${encodeURIComponent(destination)},+Bogotá/@4.6533,-74.0836,12z/data=!3m1!4b1!4m2!4m1!3e3`;

  logger.info(`Opening: ${url}`);

  try {
    // Open Google Maps
    await execAsync(`agent-browser open "${url}"`);

    // Wait for page to load
    await execAsync('agent-browser wait --load networkidle', { timeout: 30000 });

    // Check if routes are available
    const checkResult = await execAsync(`agent-browser eval "(function() { const panel = document.querySelector('div[role=\\"main\\"]'); return panel ? panel.innerText.substring(0, 500) : 'not found'; })()"`);

    const panelPreview = JSON.parse(checkResult.stdout.trim());

    if (typeof panelPreview === 'string' && panelPreview.includes('no pudimos calcular la ruta')) {
      logger.warn('Google Maps could not calculate transit route for these addresses');

      await execAsync('agent-browser close');

      return {
        success: false,
        origin,
        destination,
        routes: [],
        error: 'Google Maps no pudo calcular una ruta en transporte público para estas direcciones. Intenta con direcciones más específicas o estaciones conocidas de TransMilenio.'
      };
    }

    // Extract all route information
    const fullExtraction = await execAsync(`cat <<'EOFSCRIPT' | agent-browser eval --stdin
(function() {
  const panel = document.querySelector('div[role="main"]');
  if (!panel) return { found: false };

  return {
    found: true,
    fullText: panel.innerText
  };
})();
EOFSCRIPT`);

    const extracted = JSON.parse(fullExtraction.stdout.trim());

    if (!extracted.found) {
      await execAsync('agent-browser close');
      return {
        success: false,
        origin,
        destination,
        routes: [],
        error: 'No se pudo extraer información de Google Maps'
      };
    }

    // Parse the routes from the extracted text
    const routes = parseGoogleMapsText(extracted.fullText);

    // Close browser
    await execAsync('agent-browser close');

    logger.success(`Extracted ${routes.length} routes from Google Maps`);

    return {
      success: true,
      origin,
      destination,
      routes
    };

  } catch (error) {
    // Try to close browser on error
    try {
      await execAsync('agent-browser close');
    } catch {}

    logger.error('Failed to extract routes from Google Maps:', error);

    return {
      success: false,
      origin,
      destination,
      routes: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Parse Google Maps text output into structured routes
 * This is a simplified parser - can be enhanced for more detailed extraction
 */
function parseGoogleMapsText(text: string): GoogleMapsRoute[] {
  const routes: GoogleMapsRoute[] = [];

  // Extract route lines (format: "54 min\n9:48 p.m.—10:42 p.m.\nT11BC917T163  K16")
  const routePattern = /(\d+\s+(?:min|h\s+\d+\s+min))\n(\d+:\d+\s+[ap]\.m\.)—(\d+:\d+\s+[ap]\.m\.)/g;

  let match;
  while ((match = routePattern.exec(text)) !== null) {
    const duration = match[1];
    const departureTime = match[2];
    const arrivalTime = match[3];

    // Extract transit lines after the time
    const afterMatch = text.substring(match.index + match[0].length, match.index + match[0].length + 200);
    const linesMatch = afterMatch.match(/([A-Z0-9]+(?:\s+[A-Z0-9]+)*)/);
    const summary = linesMatch ? linesMatch[1].trim() : 'Ruta no especificada';

    routes.push({
      departureTime,
      arrivalTime,
      duration,
      summary,
      steps: [] // Simplified - would need detailed extraction for full steps
    });
  }

  return routes;
}
