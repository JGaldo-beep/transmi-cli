// Zod schemas for configuration and CLI options validation

import { z } from 'zod';

export const GlobalOptionsSchema = z.object({
  json: z.boolean().optional(),
  quiet: z.boolean().optional(),
  noColor: z.boolean().optional(),
  cacheTtl: z.number().int().positive().optional(),
  noCache: z.boolean().optional(),
});

export const SearchOptionsSchema = GlobalOptionsSchema.extend({
  type: z.string().optional(),
  zone: z.string().optional(),
});

export const PlanOptionsSchema = GlobalOptionsSchema.extend({
  fastest: z.boolean().optional(),
  shortest: z.boolean().optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  alternatives: z.number().int().positive().max(10).optional(),
  accessible: z.boolean().optional(),
});

export const MapOptionsSchema = GlobalOptionsSchema.extend({
  route: z.string().optional(),
  interactive: z.boolean().optional(),
  zoom: z.number().int().min(1).max(3).optional(),
  legend: z.boolean().optional(),
});

export const BalanceOptionsSchema = GlobalOptionsSchema.extend({
  save: z.boolean().optional(),
});

export const StopsOptionsSchema = GlobalOptionsSchema.extend({
  type: z.string().optional(),
  nearby: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .optional(), // lat,lon
  radius: z.number().positive().optional(),
});

export const AlertsOptionsSchema = GlobalOptionsSchema.extend({
  active: z.boolean().optional(),
  route: z.string().optional(),
});

// Type inference from schemas
export type GlobalOptionsSchemaType = z.infer<typeof GlobalOptionsSchema>;
export type SearchOptionsSchemaType = z.infer<typeof SearchOptionsSchema>;
export type PlanOptionsSchemaType = z.infer<typeof PlanOptionsSchema>;
export type MapOptionsSchemaType = z.infer<typeof MapOptionsSchema>;
export type BalanceOptionsSchemaType = z.infer<typeof BalanceOptionsSchema>;
export type StopsOptionsSchemaType = z.infer<typeof StopsOptionsSchema>;
export type AlertsOptionsSchemaType = z.infer<typeof AlertsOptionsSchema>;
