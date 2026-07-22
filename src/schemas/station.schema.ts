// Zod schemas for station validation

import { z } from 'zod';

export const StationTypeSchema = z.enum([
  'troncal',
  'portal',
  'intermedia',
  'sencilla',
  'sitp',
  'cable',
]);

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const StationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: StationTypeSchema,
  coordinates: CoordinatesSchema.optional(),
  address: z.string().optional(),
  routes: z.array(z.string()),
  accessibility: z
    .object({
      elevator: z.boolean(),
      ramp: z.boolean(),
      tactilePaving: z.boolean(),
    })
    .optional(),
  services: z.array(z.string()).optional(),
});

// Type inference from schemas
export type StationSchemaType = z.infer<typeof StationSchema>;
export type CoordinatesSchemaType = z.infer<typeof CoordinatesSchema>;
