// Zod schemas for route validation

import { z } from 'zod';

export const RouteTypeSchema = z.enum([
  'troncal',
  'alimentador',
  'complementario',
  'especial',
  'transmi_zonal',
]);

export const RouteStatusSchema = z.enum(['active', 'inactive', 'maintenance']);

export const RouteSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: RouteTypeSchema,
  description: z.string().optional(),
  status: RouteStatusSchema,
  accessibility: z
    .object({
      wheelchair: z.boolean(),
      visualImpairment: z.boolean(),
      audioAnnouncements: z.boolean(),
    })
    .optional(),
});

export const ScheduleSchema = z.object({
  weekday: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    frequency: z.object({
      peak: z.number().int().positive(),
      offPeak: z.number().int().positive(),
    }),
  }),
  weekend: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
    frequency: z.number().int().positive(),
  }),
});

export const RouteDetailsSchema = RouteSchema.extend({
  stations: z.array(z.string()),
  schedule: ScheduleSchema,
  distance: z.number().positive(),
  estimatedDuration: z.number().int().positive(),
});

// Type inference from schemas
export type RouteSchemaType = z.infer<typeof RouteSchema>;
export type RouteDetailsSchemaType = z.infer<typeof RouteDetailsSchema>;
export type ScheduleSchemaType = z.infer<typeof ScheduleSchema>;
