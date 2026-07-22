// Application constants for Transmilenio CLI

export const APP_NAME = 'transmilenio-cli';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'CLI tool for Transmilenio system in Bogotá, Colombia';

// Cache TTL configuration (in minutes)
export const CACHE_TTL = {
  routes: 24 * 60, // 24 hours
  routeDetails: 12 * 60, // 12 hours
  schedules: 6 * 60, // 6 hours
  mapData: 7 * 24 * 60, // 7 days
  alerts: 15, // 15 minutes
  balance: 0, // Never cache (sensitive)
  stations: 24 * 60, // 24 hours
} as const;

// Default values
export const DEFAULTS = {
  cacheTtl: 60, // 1 hour
  alternatives: 3, // Number of alternative routes
  zoom: 2, // Default map zoom level
  radius: 1, // Search radius in km
  timeout: 30000, // Request timeout in ms
} as const;

// Transmilenio system constants
export const TRANSMILENIO = {
  baseFare: 3000, // Base fare in COP
  transferTime: 5, // Transfer time penalty in minutes
  maxTransfers: 3, // Maximum transfers in a trip
  operatingHours: {
    start: '04:00',
    end: '23:00',
  },
} as const;

// Route type weights for planning algorithm
export const ROUTE_TYPE_WEIGHTS = {
  troncal: 1.0,
  alimentador: 1.1,
  complementario: 1.2,
  especial: 1.15,
  transmi_zonal: 1.1,
} as const;

// Time of day multipliers
export const TIME_MULTIPLIERS = {
  rushHour: 1.2, // 6-9 AM, 5-8 PM
  offPeak: 1.0, // Rest of the day
} as const;

// Cache directory
export const CACHE_DIR = 'data';

// User config directory (for saved preferences)
export const CONFIG_DIR = '.transmilenio-cli';
