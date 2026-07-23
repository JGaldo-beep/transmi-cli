// Google Maps trip planner using agent-browser
// Directly extracts routes from Google Maps

import { spawn } from 'child_process';
import { logger } from '@lib/logger.js';

export interface GoogleMapsTrip {
  success: boolean;
  origin: string;
  destination: string;
  routes: Array<{
    departureTime: string;
    arrivalTime: string;
    duration: string;
    summary: string;
    steps: string[];
  }>;
  rawDetails?: string;
  error?: string;
}

/**
 * Execute agent-browser command and return output
 */
async function execAgentBrowser(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('agent-browser', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`agent-browser exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Plan trip using Google Maps via agent-browser
 */
export async function planTripWithGoogleMaps(
  origin: string,
  destination: string
): Promise<GoogleMapsTrip> {
  logger.info(`[Google Maps] Planning trip: ${origin} → ${destination}`);

  try {
    // Construct Google Maps URL with transit mode
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)},+Bogotá/${encodeURIComponent(destination)},+Bogotá/@4.6533,-74.0836,12z/data=!3m1!4b1!4m2!4m1!3e3`;

    logger.info(`[Google Maps] Opening: ${url.substring(0, 100)}...`);

    // Open Google Maps
    await execAgentBrowser(['open', url]);

    // Wait for page to load
    await execAgentBrowser(['wait', '--load', 'networkidle']);

    logger.info('[Google Maps] Page loaded, extracting routes...');

    // Extract route information
    const extractScript = `
(function() {
  const panel = document.querySelector('div[role="main"]');
  if (!panel) {
    return JSON.stringify({ success: false, error: 'Panel not found' });
  }

  const panelText = panel.innerText;

  // Check if route calculation failed
  if (panelText.includes('no pudimos calcular la ruta') || panelText.includes('Lamentablemente')) {
    return JSON.stringify({
      success: false,
      error: 'Google Maps no pudo calcular una ruta en transporte público. Intenta con direcciones más específicas o estaciones conocidas de TransMilenio.'
    });
  }

  return JSON.stringify({
    success: true,
    rawDetails: panelText.substring(0, 5000)
  });
})();
`;

    const result = await execAgentBrowser(['eval', extractScript]);

    // Close browser
    await execAgentBrowser(['close']).catch(() => {
      // Ignore close errors
    });

    // Parse the result
    const parsed = JSON.parse(result);

    if (!parsed.success) {
      return {
        success: false,
        origin,
        destination,
        routes: [],
        error: parsed.error || 'Error desconocido al extraer rutas'
      };
    }

    // Parse routes from raw text
    const routes = parseRoutesFromText(parsed.rawDetails);

    logger.success(`[Google Maps] Extracted ${routes.length} routes`);

    return {
      success: true,
      origin,
      destination,
      routes,
      rawDetails: parsed.rawDetails
    };

  } catch (error) {
    logger.error('[Google Maps] Error:', error);

    // Try to close browser on error
    try {
      await execAgentBrowser(['close']);
    } catch {}

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
 * Parse routes from Google Maps panel text
 */
function parseRoutesFromText(text: string): Array<{
  departureTime: string;
  arrivalTime: string;
  duration: string;
  summary: string;
  steps: string[];
}> {
  const routes: Array<{
    departureTime: string;
    arrivalTime: string;
    duration: string;
    summary: string;
    steps: string[];
  }> = [];

  // Match time patterns like "9:48 p.m.—10:42 p.m."
  const timePattern = /(\d+:\d+\s+[ap]\.m\.)—(\d+:\d+\s+[ap]\.m\.)/g;
  const durationPattern = /(\d+\s+min|\d+\s*h\s+\d+\s*min)/;

  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const timeMatch = timePattern.exec(line);

    if (timeMatch) {
      const departureTime = timeMatch[1];
      const arrivalTime = timeMatch[2];

      // Look for duration in nearby lines
      let duration = '?';
      for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 3); j++) {
        const durationMatch = durationPattern.exec(lines[j]);
        if (durationMatch) {
          duration = durationMatch[1];
          break;
        }
      }

      // Look for transit info in next few lines
      const nextLines = lines.slice(i + 1, i + 5).join(' ');
      const summary = nextLines.substring(0, 100).replace(/\s+/g, ' ').trim() || 'Ver detalles';

      routes.push({
        departureTime,
        arrivalTime,
        duration,
        summary,
        steps: []
      });

      timePattern.lastIndex = 0; // Reset regex
    }

    i++;
  }

  return routes;
}
