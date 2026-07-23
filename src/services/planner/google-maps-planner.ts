import { logger } from '@lib/logger.js';

const DIRECTIONS_URL = 'https://www.google.com/maps/preview/directions';
const REQUEST_TIMEOUT_MS = 8_000;

// Captured from an anonymous transit request. The only opaque string in the capture was
// replaced with an empty value and the resulting template was verified against Google Maps.
const PB_CONTEXT = [
  '!3m12!1m3!1d127258.11761189872!2d-74.0950016!3d4.6268416',
  '!2m3!1f0.0!2f0.0!3f0.0!3m2!1i1024!2i768!4f13.1',
  '!6m58!1m5!18b1!30b1!31m1!1b1!34e1!2m4!5m1!6e2!20e3!39b1',
  '!6m29!32i1!49b1!63m0!66b1!85b1!114b1!149b1!206b1!209b1!212b1',
  '!216b1!222b1!223b1!232b1!234b1!235b1!239b1!246b1!253b1!260b1',
  '!266b1!270b1!273b1!280b1!281b1!286b1!291m0!302i300!303i100',
  '!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m5!1e3!2e3!5e2!6b1!14b1',
  '!46m1!1b0!96b1!99b1!15m3!1s!7e81!15i10142!20m28',
  '!1m6!1m2!1i0!2i0!2m2!1i530!2i768',
  '!1m6!1m2!1i974!2i0!2m2!1i1024!2i768',
  '!1m6!1m2!1i0!2i0!2m2!1i1024!2i20',
  '!1m6!1m2!1i0!2i748!2m2!1i1024!2i768',
  '!27b1!40i787!47m2!8b1!10e2',
].join('');

export interface GoogleMapsTrip {
  success: boolean;
  origin: string;
  destination: string;
  resolvedOrigin?: string;
  resolvedDestination?: string;
  routes: Array<{
    departureTime: string;
    arrivalTime: string;
    duration: string;
    summary: string;
    steps: GoogleMapsStep[];
  }>;
  error?: string;
}

export interface GoogleMapsStep {
  mode: 'walk' | 'transit';
  instruction: string;
  duration?: string;
  distance?: string;
  line?: string;
  departureStop?: string;
  arrivalStop?: string;
  stopCount?: number;
}

interface ParsedDirections {
  resolvedOrigin?: string;
  resolvedDestination?: string;
  routes: GoogleMapsTrip['routes'];
}

export type TripOptimization = 'time' | 'transfers';

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function at(value: unknown, ...indexes: number[]): unknown {
  let current = value;
  for (const index of indexes) {
    const array = asArray(current);
    if (!array) return undefined;
    current = array[index];
  }
  return current;
}

function cleanWaypointLabel(label: string): string {
  // "!" delimits fields in Google's packed format. Treat it as whitespace rather than
  // allowing a label to inject another field into the request.
  return [...label]
    .map((character) => {
      const code = character.codePointAt(0) ?? 0;
      return character === '!' || code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .trim();
}

export function buildGoogleMapsDirectionsUrl(origin: string, destination: string): URL {
  const safeOrigin = cleanWaypointLabel(origin);
  const safeDestination = cleanWaypointLabel(destination);
  if (!safeOrigin || !safeDestination) {
    throw new Error('El origen y el destino son obligatorios.');
  }

  const pb = `!1m2!1s${safeOrigin}!6e0!1m2!1s${safeDestination}!6e0${PB_CONTEXT}`;
  const url = new URL(DIRECTIONS_URL);
  url.search = new URLSearchParams({
    authuser: '0',
    hl: 'es-419',
    gl: 'co',
    pb,
  }).toString();
  return url;
}

function parseTransitSteps(value: unknown): GoogleMapsStep[] {
  const tokens = asArray(value) ?? [];
  const steps: GoogleMapsStep[] = [];
  let vehicle = '';
  let lines: string[] = [];

  const flushVehicle = () => {
    if (vehicle && lines.length > 0) {
      const line = lines.join(' o ');
      steps.push({ mode: 'transit', line, instruction: `${vehicle} ${line}` });
    }
    vehicle = '';
    lines = [];
  };

  for (const value of tokens) {
    const token = asArray(value);
    if (!token) continue;

    const kind = token[0];
    if (kind === 1) {
      flushVehicle();
      if (steps.at(-1)?.mode !== 'walk') {
        steps.push({ mode: 'walk', instruction: 'Camina' });
      }
    } else if (kind === 4) {
      flushVehicle();
      vehicle = asString(at(token, 2, 3)) ?? 'Transporte público';
    } else if (kind === 5) {
      const line = asString(at(token, 1, 0));
      if (line && !lines.includes(line)) lines.push(line);
    } else if (kind === 9) {
      flushVehicle();
    }
  }
  flushVehicle();

  return steps;
}

function parseDetailedSteps(route: unknown, destination?: string): GoogleMapsStep[] {
  const segments = asArray(at(route, 1, 0, 1));
  if (!segments) return [];

  const steps: GoogleMapsStep[] = [];
  segments.forEach((segment, index) => {
    const kind = at(segment, 0, 0);
    const duration = asString(at(segment, 0, 3, 1));

    if (kind === 2) {
      const distance = asString(at(segment, 0, 2, 1));
      const nextTransit = segments.slice(index + 1).find((candidate) => at(candidate, 0, 0) === 3);
      const target = asString(at(nextTransit, 5, 0, 0)) ?? destination;
      steps.push({
        mode: 'walk',
        duration,
        distance,
        instruction: target ? `Camina hasta ${target}` : 'Camina hasta el siguiente punto',
      });
      return;
    }

    if (kind === 3) {
      const line = asString(at(segment, 0, 14, 1, 1, 0));
      const departureStop = asString(at(segment, 5, 0, 0));
      const arrivalStop = asString(at(segment, 5, 1, 0));
      const stopCountValue = at(segment, 5, 2);
      const stopCount = typeof stopCountValue === 'number' ? stopCountValue : undefined;
      const instruction = [
        line ? `Toma ${line}` : 'Toma el transporte público',
        departureStop ? `en ${departureStop}` : '',
        arrivalStop ? `hasta ${arrivalStop}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      steps.push({
        mode: 'transit',
        instruction,
        duration,
        line,
        departureStop,
        arrivalStop,
        stopCount,
      });
    }
  });
  return steps;
}

export function parseGoogleMapsDirectionsResponse(payload: string): ParsedDirections {
  const trimmed = payload.trimStart();
  const json = trimmed.startsWith(")]}'")
    ? trimmed.slice(trimmed.indexOf('\n') >= 0 ? trimmed.indexOf('\n') + 1 : 4)
    : trimmed;
  const response: unknown = JSON.parse(json);

  const resolvedOrigin = asString(at(response, 0, 0, 0, 0, 0, 0));
  const resolvedDestination = asString(at(response, 0, 0, 1, 0, 0, 0));
  const routeValues = asArray(at(response, 0, 1)) ?? [];
  const routes = routeValues.flatMap((route) => {
    const overview = asArray(at(route, 0));
    if (!overview) return [];

    const duration = asString(at(overview, 3, 1));
    if (!duration) return [];

    const steps = parseDetailedSteps(route, resolvedDestination);
    const effectiveSteps = steps.length > 0 ? steps : parseTransitSteps(overview[14]);
    const transitSteps = effectiveSteps.filter((step) => step.mode === 'transit');
    return [
      {
        departureTime: asString(at(overview, 5, 0, 2)) ?? '',
        arrivalTime: asString(at(overview, 5, 1, 2)) ?? '',
        duration,
        summary:
          transitSteps.map((step) => step.line ?? step.instruction).join(' → ') ||
          'Transporte público',
        steps: effectiveSteps,
      },
    ];
  });

  return {
    resolvedOrigin,
    resolvedDestination,
    routes,
  };
}

function durationMinutes(duration: string): number {
  const hours = Number(duration.match(/(\d+)\s*h/)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)\s*min/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

export function sortRoutes(
  routes: GoogleMapsTrip['routes'],
  optimizeFor: TripOptimization
): GoogleMapsTrip['routes'] {
  return [...routes].sort((a, b) => {
    if (optimizeFor === 'transfers') {
      const aVehicles = a.steps.filter((step) => step.mode === 'transit').length;
      const bVehicles = b.steps.filter((step) => step.mode === 'transit').length;
      if (aVehicles !== bVehicles) return aVehicles - bVehicles;
    }
    return durationMinutes(a.duration) - durationMinutes(b.duration);
  });
}

export async function planTripWithGoogleMaps(
  origin: string,
  destination: string,
  optimizeFor: TripOptimization = 'time'
): Promise<GoogleMapsTrip> {
  logger.info(`[Google Maps] Planning trip: ${origin} -> ${destination}`);

  try {
    const response = await fetch(buildGoogleMapsDirectionsUrl(origin, destination), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Google Maps respondió con HTTP ${response.status}.`);
    }

    let parsed: ParsedDirections;
    try {
      parsed = parseGoogleMapsDirectionsResponse(await response.text());
    } catch {
      throw new Error('Google Maps devolvió una respuesta incompatible.');
    }
    if (parsed.routes.length === 0) {
      return {
        success: false,
        origin,
        destination,
        resolvedOrigin: parsed.resolvedOrigin,
        resolvedDestination: parsed.resolvedDestination,
        routes: [],
        error: 'Google Maps no encontró opciones de transporte público para esos lugares.',
      };
    }

    logger.success(`[Google Maps] Extracted ${parsed.routes.length} routes`);
    return {
      success: true,
      origin,
      destination,
      resolvedOrigin: parsed.resolvedOrigin,
      resolvedDestination: parsed.resolvedDestination,
      routes: sortRoutes(parsed.routes, optimizeFor),
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    const message = timedOut
      ? `Google Maps excedió ${REQUEST_TIMEOUT_MS / 1000} segundos.`
      : error instanceof Error
        ? error.message
        : 'No fue posible consultar Google Maps.';
    logger.error(`[Google Maps] ${message}`);
    return { success: false, origin, destination, routes: [], error: message };
  }
}
