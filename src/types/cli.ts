// CLI-specific types for Transmilenio CLI

export type OutputMode = 'human' | 'json';

export interface GlobalOptions {
  json?: boolean;
  quiet?: boolean;
  noColor?: boolean;
  cacheTtl?: number; // In minutes
  noCache?: boolean;
}

export interface SearchOptions extends GlobalOptions {
  type?: string;
  zone?: string;
}

export interface PlanOptions extends GlobalOptions {
  fastest?: boolean;
  shortest?: boolean;
  time?: string;
  alternatives?: number;
  accessible?: boolean;
}

export interface MapOptions extends GlobalOptions {
  route?: string;
  interactive?: boolean;
  zoom?: number;
  legend?: boolean;
}

export interface BalanceOptions extends GlobalOptions {
  save?: boolean;
}

export interface StopsOptions extends GlobalOptions {
  type?: string;
  nearby?: string; // "lat,lon"
  radius?: number; // In kilometers
}

export interface AlertsOptions extends GlobalOptions {
  active?: boolean;
  route?: string;
}

export interface JsonOutput<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    version: string;
    cached: boolean;
  };
}
