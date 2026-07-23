import { describe, expect, test } from 'bun:test';
import {
  buildGoogleMapsDirectionsUrl,
  parseGoogleMapsDirectionsResponse,
  sortRoutes,
} from '../src/services/planner/google-maps-planner.js';

function route(
  duration: string,
  departure: string,
  arrival: string,
  transitSummary: unknown[],
  segments?: unknown[]
): unknown[] {
  const overview = new Array(15).fill(null);
  overview[3] = [1_800, duration, 1_800];
  overview[5] = [
    [1, 'America/Bogota', departure],
    [2, 'America/Bogota', arrival],
  ];
  overview[14] = transitSummary;
  return segments ? [overview, [[[], segments]]] : [overview];
}

function walkSegment(duration: string, distance: string): unknown[] {
  const overview = new Array(15).fill(null);
  overview[0] = 2;
  overview[2] = [350, distance];
  overview[3] = [300, duration];
  return [overview];
}

function transitSegment(
  lineName: string,
  departureStop: string,
  arrivalStop: string,
  stopCount: number
): unknown[] {
  const overview = new Array(15).fill(null);
  overview[0] = 3;
  overview[3] = [600, '10 min'];
  overview[14] = [null, [5, [lineName]]];
  const segment = new Array(6).fill(null);
  segment[0] = overview;
  segment[5] = [[departureStop], [arrivalStop], stopCount];
  return segment;
}

const walk = [1, null, [3, 'walk.png', null, 'Camina']];
const bus = [4, null, [3, 'bus2.png', null, 'Autobús']];
const separator = [9];
const alternative = [10];
const line = (name: string) => [5, [name, 1, '#0000f2', '#ffffff']];

function fixturePayload(): string {
  const origin = new Array(1).fill(null);
  origin[0] = [['Origen resuelto, Bogotá']];
  const destination = new Array(1).fill(null);
  destination[0] = [['Destino resuelto, Bogotá']];

  return `)]}'\n${JSON.stringify([
    [
      [origin, destination],
      [
        route(
          '31 min',
          '10:25 a. m.',
          '10:56 a. m.',
          [
            walk,
            separator,
            bus,
            line('H605'),
            separator,
            bus,
            line('SE14'),
            alternative,
            line('466'),
            separator,
            walk,
          ],
          [
            walkSegment('5 min', '350 metros'),
            transitSegment('H605', 'CAI Polo Club', 'Los Alcázares', 6),
            walkSegment('2 min', '120 metros'),
            transitSegment('SE14', 'Br. Alcázares', 'Avenida La Esmeralda', 5),
            walkSegment('4 min', '300 metros'),
          ]
        ),
        route('38 min', '10:30 a. m.', '11:08 a. m.', [bus, line('B11')]),
      ],
    ],
  ])}`;
}

describe('parseGoogleMapsDirectionsResponse', () => {
  test('strips anti-XSSI and extracts resolved endpoints and route options', () => {
    expect(parseGoogleMapsDirectionsResponse(fixturePayload())).toEqual({
      resolvedOrigin: 'Origen resuelto, Bogotá',
      resolvedDestination: 'Destino resuelto, Bogotá',
      routes: [
        {
          departureTime: '10:25 a. m.',
          arrivalTime: '10:56 a. m.',
          duration: '31 min',
          summary: 'H605 → SE14',
          steps: [
            {
              mode: 'walk',
              instruction: 'Camina hasta CAI Polo Club',
              duration: '5 min',
              distance: '350 metros',
            },
            {
              mode: 'transit',
              instruction: 'Toma H605 en CAI Polo Club hasta Los Alcázares',
              duration: '10 min',
              line: 'H605',
              departureStop: 'CAI Polo Club',
              arrivalStop: 'Los Alcázares',
              stopCount: 6,
            },
            {
              mode: 'walk',
              instruction: 'Camina hasta Br. Alcázares',
              duration: '2 min',
              distance: '120 metros',
            },
            {
              mode: 'transit',
              instruction: 'Toma SE14 en Br. Alcázares hasta Avenida La Esmeralda',
              duration: '10 min',
              line: 'SE14',
              departureStop: 'Br. Alcázares',
              arrivalStop: 'Avenida La Esmeralda',
              stopCount: 5,
            },
            {
              mode: 'walk',
              instruction: 'Camina hasta Destino resuelto, Bogotá',
              duration: '4 min',
              distance: '300 metros',
            },
          ],
        },
        {
          departureTime: '10:30 a. m.',
          arrivalTime: '11:08 a. m.',
          duration: '38 min',
          summary: 'B11',
          steps: [{ mode: 'transit', line: 'B11', instruction: 'Autobús B11' }],
        },
      ],
    });
  });

  test('ignores malformed route entries instead of exposing raw data', () => {
    const parsed = parseGoogleMapsDirectionsResponse(`)]}'\n${JSON.stringify([[[], [null, []]]])}`);
    expect(parsed.routes).toEqual([]);
  });
});

describe('buildGoogleMapsDirectionsUrl', () => {
  test('encodes labels as one query parameter and prevents packed-field injection', () => {
    const url = buildGoogleMapsDirectionsUrl('Calle 80 & Av. Boyacá!', 'Portal # Norte?x=1');

    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/preview/directions');
    expect(url.searchParams.get('authuser')).toBe('0');
    expect(url.searchParams.get('hl')).toBe('es-419');
    expect(url.searchParams.get('gl')).toBe('co');
    expect(url.searchParams.get('x')).toBeNull();
    expect(url.searchParams.get('pb')).toStartWith(
      '!1m2!1sCalle 80 & Av. Boyacá!6e0!1m2!1sPortal # Norte?x=1!6e0'
    );
  });

  test('rejects empty labels', () => {
    expect(() => buildGoogleMapsDirectionsUrl('  ', 'Portal Norte')).toThrow();
  });
});

describe('sortRoutes', () => {
  const routes = parseGoogleMapsDirectionsResponse(fixturePayload()).routes;

  test('orders by duration', () => {
    expect(sortRoutes([...routes].reverse(), 'time').map((route) => route.duration)).toEqual([
      '31 min',
      '38 min',
    ]);
  });

  test('orders by number of vehicles before duration', () => {
    expect(sortRoutes(routes, 'transfers').map((route) => route.summary)).toEqual([
      'B11',
      'H605 → SE14',
    ]);
  });
});
